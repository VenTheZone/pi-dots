import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { loadConfig, STATE_ENTRY, STATUS_KEY, type SessionOverrideState } from "./config.js";
import { applyPruning } from "./pruning.js";
import {
  createCompressState,
  deserializeCompressState,
  serializeCompressState,
  COMPRESS_STATE_ENTRY,
  type CompressState,
  type SerializedCompressState,
} from "./compress-state.js";
import { registerCompressTool, getCompressSystemPrompt } from "./compress-tool.js";
import {
  createNudgeState,
  evaluateNudges,
  trackUserTurn,
  trackIterationTurn,
  type NudgeState,
} from "./nudges.js";

export default function dynamicContextPruning(pi: ExtensionAPI): void {
  let config = loadConfig(process.cwd());
  let sessionState: SessionOverrideState = {};
  let compressState: CompressState = createCompressState();
  let nudgeState: NudgeState = createNudgeState();
  let lastSummaryText: string | undefined;
  /** Snapshot of messages for the current context event, used by compress tool */
  let currentContextMessages: unknown[] = [];

  const refreshRuntimeState = (ctx: ExtensionContext): void => {
    config = loadConfig(ctx.cwd, ctx);
    sessionState = restoreSessionState(ctx);
    compressState = restoreCompressState(ctx);
    nudgeState = createNudgeState();
    updateStatus(ctx);
  };

  const persistSessionState = (): void => {
    pi.appendEntry<SessionOverrideState>(STATE_ENTRY, sessionState);
  };

  const persistCompressState = (): void => {
    pi.appendEntry<SerializedCompressState>(
      COMPRESS_STATE_ENTRY,
      serializeCompressState(compressState),
    );
  };

  const isEnabled = (): boolean => sessionState.enabled ?? config.enabled;
  const isManual = (): boolean => sessionState.manualMode ?? false;

  const updateStatus = (ctx: ExtensionContext): void => {
    if (!isEnabled()) {
      ctx.ui.setStatus(STATUS_KEY, "DCP: off");
      return;
    }
    if (isManual()) {
      ctx.ui.setStatus(STATUS_KEY, "DCP: manual");
      return;
    }
    const parts: string[] = [];
    if (lastSummaryText) parts.push(lastSummaryText);
    const activeBlocks = compressState.activeBlockIds.size;
    if (activeBlocks > 0) parts.push(`${activeBlocks} compressed`);
    ctx.ui.setStatus(STATUS_KEY, parts.length > 0 ? `DCP: ${parts.join(", ")}` : undefined);
  };

  // Register the compress tool (always, it checks config at runtime)
  registerCompressTool(
    pi,
    () => compressState,
    () => currentContextMessages,
    config,
  );

  pi.on("session_start", async (_event, ctx) => {
    lastSummaryText = undefined;
    refreshRuntimeState(ctx);
  });

  pi.on("session_tree", async (_event, ctx) => {
    lastSummaryText = undefined;
    refreshRuntimeState(ctx);
  });

  pi.on("session_fork", async (_event, ctx) => {
    lastSummaryText = undefined;
    refreshRuntimeState(ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setStatus(STATUS_KEY, undefined);
  });

  pi.on("before_agent_start", async (event) => {
    if (!isEnabled() || isManual()) return;

    let systemPrompt = event.systemPrompt;

    // Add DCP active notice
    systemPrompt +=
      "\n\nDynamic Context Pruning (DCP) is active. Older stale tool outputs and stale tool inputs may be replaced with short placeholders to save context. If a placeholder appears, re-run the relevant tool instead of guessing.";

    // Add compress guidance if enabled
    if (config.compress.enabled && config.compress.permission === "allow") {
      systemPrompt += "\n\n" + getCompressSystemPrompt();
    }

    // Evaluate nudges
    if (config.compress.nudges.enabled) {
      const usage = undefined; // Will be available in context handler
      const nudgeResult = evaluateNudges(
        config,
        compressState,
        nudgeState,
        null,
        undefined,
        true, // before_agent_start always fires for user turns
      );
      if (nudgeResult.injected) {
        systemPrompt += "\n\n" + nudgeResult.systemPromptAddition;
      }
    }

    return { systemPrompt };
  });

  pi.on("context", async (event, ctx) => {
    if (!isEnabled() || isManual()) {
      lastSummaryText = undefined;
      updateStatus(ctx);
      return;
    }

    // Snapshot messages for compress tool access
    currentContextMessages = [...event.messages];

    // Inject message reference tags [msg:N] into assistant messages
    injectMessageRefs(event.messages);

    // Apply compress blocks - replace compressed ranges with summaries
    const compressResult = applyCompressBlocks(
      event.messages as unknown as Array<Record<string, unknown>>,
      compressState,
      config,
    );

    // Apply pruning strategies
    const usage = ctx.getContextUsage();
    if (
      usage?.tokens !== null &&
      usage?.tokens !== undefined &&
      usage.tokens < config.minContextTokens &&
      !compressResult.changed
    ) {
      lastSummaryText = undefined;
      updateStatus(ctx);
      return;
    }

    const summary = applyPruning(
      event.messages as import("./pruning.js").PrunableMessage[],
      ctx.cwd,
      config,
    );

    const parts: string[] = [];
    if (summary.changed) {
      parts.push(
        `-${formatCompactNumber(summary.approxTokensSaved)} tok (${summary.prunedOutputs} out, ${summary.prunedInputs} in)`,
      );
    }
    if (compressResult.changed) {
      parts.push(
        `${compressResult.blockCount} compressed blocks`,
      );
    }

    if (parts.length === 0) {
      lastSummaryText = undefined;
      updateStatus(ctx);
      return;
    }

    lastSummaryText = parts.join("; ");
    updateStatus(ctx);

    // Evaluate nudges for context handler (includes context usage info)
    if (config.compress.nudges.enabled && usage?.tokens != null && usage?.contextWindow != null) {
      const nudgeResult = evaluateNudges(
        config,
        compressState,
        nudgeState,
        usage.tokens,
        usage.contextWindow,
        false,
      );
      // Nudges in context handler are informational only
      // (system prompt injection happens in before_agent_start)
    }

    if (summary.changed || compressResult.changed) {
      return { messages: event.messages };
    }
  });

  pi.on("turn_start", async (_event, _ctx) => {
    // Track turns for nudge frequency
    // turn_start fires for every turn including tool-only iterations
    trackIterationTurn(nudgeState);
  });

  // Register /dcp command with subcommands
  pi.registerCommand("dcp", {
    description: "Dynamic Context Pruning controls and status",
    handler: async (args, ctx) => {
      const [command, ...rest] = args.trim().split(/\s+/).filter(Boolean);

      if (!command || command === "help") {
        ctx.ui.notify(
          "/dcp status | on | off | manual [on|off] | reload | stats | decompress <id> | recompress <id>",
          "info",
        );
        return;
      }

      if (command === "status") {
        config = loadConfig(ctx.cwd, ctx);
        const usage = ctx.getContextUsage();
        const usageText =
          usage?.tokens != null
            ? `${formatCompactNumber(usage.tokens)} / ${formatCompactNumber(usage.contextWindow)}`
            : "unknown";
        const activeBlocks = compressState.activeBlockIds.size;
        const statsText =
          compressState.totalTokensSaved > 0
            ? ` | ~${formatCompactNumber(compressState.totalTokensSaved)} tokens saved total`
            : "";
        ctx.ui.notify(
          `DCP ${isEnabled() ? "on" : "off"}${isManual() ? " (manual)" : ""} | usage ${usageText} | ${activeBlocks} compressed blocks${statsText} | ${lastSummaryText ?? "no pruning applied yet"}`,
          "info",
        );
        return;
      }

      if (command === "stats") {
        const blocks = [...compressState.blocksById.values()];
        const active = blocks.filter((b) => b.active);
        const inactive = blocks.filter((b) => !b.active);

        const lines = [
          "DCP Statistics",
          "─".repeat(40),
          `Active blocks: ${active.length}`,
          `Decompressed blocks: ${inactive.length}`,
          `Total tokens saved: ~${formatCompactNumber(compressState.totalTokensSaved)}`,
          `Total blocks created: ${compressState.totalBlocksCreated}`,
        ];

        if (active.length > 0) {
          lines.push("", "Active blocks:");
          for (const b of active) {
            lines.push(
              `  #${b.blockId}: "${b.topic}" (${b.messageIndices.length} msgs, ~${formatCompactNumber(b.compressedTokens)} tok saved)`,
            );
          }
        }

        ctx.ui.notify(lines.join("\n"), "info");
        return;
      }

      if (command === "decompress") {
        const blockIdStr = rest[0];
        if (!blockIdStr) {
          ctx.ui.notify("Usage: /dcp decompress <blockId>", "warning");
          return;
        }
        const blockId = parseInt(blockIdStr, 10);
        const block = compressState.blocksById.get(blockId);
        if (!block) {
          ctx.ui.notify(`Block #${blockId} not found`, "warning");
          return;
        }
        if (!block.active) {
          ctx.ui.notify(`Block #${blockId} is already decompressed`, "info");
          return;
        }

        block.active = false;
        block.deactivatedAt = Date.now();
        compressState.activeBlockIds.delete(blockId);
        persistCompressState();
        updateStatus(ctx);
        ctx.ui.notify(
          `Decompressed block #${blockId} ("${block.topic}"). Messages will be restored on next context refresh.`,
          "info",
        );
        return;
      }

      if (command === "recompress") {
        const blockIdStr = rest[0];
        if (!blockIdStr) {
          ctx.ui.notify("Usage: /dcp recompress <blockId>", "warning");
          return;
        }
        const blockId = parseInt(blockIdStr, 10);
        const block = compressState.blocksById.get(blockId);
        if (!block) {
          ctx.ui.notify(`Block #${blockId} not found`, "warning");
          return;
        }
        if (block.active) {
          ctx.ui.notify(`Block #${blockId} is already active`, "info");
          return;
        }

        block.active = true;
        delete block.deactivatedAt;
        delete block.deactivatedByBlockId;
        compressState.activeBlockIds.add(blockId);
        persistCompressState();
        updateStatus(ctx);
        ctx.ui.notify(
          `Recompressed block #${blockId} ("${block.topic}"). Summary will be re-applied on next context refresh.`,
          "info",
        );
        return;
      }

      if (command === "reload") {
        config = loadConfig(ctx.cwd, ctx);
        updateStatus(ctx);
        ctx.ui.notify("DCP config reloaded", "info");
        return;
      }

      if (command === "on") {
        sessionState.enabled = true;
        persistSessionState();
        updateStatus(ctx);
        ctx.ui.notify("DCP enabled for this session branch", "info");
        return;
      }

      if (command === "off") {
        sessionState.enabled = false;
        persistSessionState();
        updateStatus(ctx);
        ctx.ui.notify("DCP disabled for this session branch", "warning");
        return;
      }

      if (command === "manual") {
        const value = rest[0];
        if (!value) {
          sessionState.manualMode = !isManual();
        } else if (value === "on") {
          sessionState.manualMode = true;
        } else if (value === "off") {
          sessionState.manualMode = false;
        } else {
          ctx.ui.notify("Usage: /dcp manual [on|off]", "warning");
          return;
        }
        persistSessionState();
        updateStatus(ctx);
        ctx.ui.notify(
          `DCP manual mode ${isManual() ? "enabled" : "disabled"}`,
          "info",
        );
        return;
      }

      ctx.ui.notify("Unknown DCP command. Try /dcp help", "warning");
    },
  });
}

/**
 * Inject [msg:N] reference tags into assistant messages so the LLM can
 * reference specific messages when calling compress.
 */
function injectMessageRefs(messages: unknown[]): void {
  let msgIndex = 0;
  for (const message of messages) {
    if (
      typeof message !== "object" ||
      message === null ||
      !("role" in message)
    ) {
      msgIndex++;
      continue;
    }

    const msg = message as { role: string; content?: unknown };
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      // Prepend a text content with the message ref
      const refContent = { type: "text", text: `[msg:${msgIndex}]` };
      // Only inject if not already present
      const first = msg.content[0] as { type?: string; text?: string } | undefined;
      if (!first || first.type !== "text" || !first.text?.includes(`[msg:${msgIndex}]`)) {
        msg.content.unshift(refContent);
      }
    }
    msgIndex++;
  }
}

/**
 * Apply active compress blocks: replace message ranges with synthetic summary messages.
 * Returns info about what was applied.
 */
function applyCompressBlocks(
  messages: Array<Record<string, unknown>>,
  state: CompressState,
  config: import("./config.js").DcpConfig,
): { changed: boolean; blockCount: number } {
  if (state.activeBlockIds.size === 0) {
    return { changed: false, blockCount: 0 };
  }

  // Collect all indices to replace, mapped to their block
  const indexToBlock = new Map<number, { blockId: number; topic: string; summary: string }>();

  for (const blockId of state.activeBlockIds) {
    const block = state.blocksById.get(blockId);
    if (!block || !block.active) continue;

    for (const idx of block.messageIndices) {
      indexToBlock.set(idx, {
        blockId: block.blockId,
        topic: block.topic,
        summary: block.summary,
      });
    }
  }

  if (indexToBlock.size === 0) {
    return { changed: false, blockCount: 0 };
  }

  // Find contiguous ranges of compressed messages
  const sortedIndices = [...indexToBlock.keys()].sort((a, b) => a - b);
  const ranges: Array<{ start: number; end: number; blockId: number; topic: string; summary: string }> = [];

  let rangeStart = sortedIndices[0]!;
  let rangeEnd = rangeStart;
  let currentBlock = indexToBlock.get(rangeStart)!;

  for (let i = 1; i < sortedIndices.length; i++) {
    const idx = sortedIndices[i]!;
    const block = indexToBlock.get(idx)!;

    if (idx === rangeEnd + 1 && block.blockId === currentBlock.blockId) {
      rangeEnd = idx;
    } else {
      ranges.push({
        start: rangeStart,
        end: rangeEnd,
        ...currentBlock,
      });
      rangeStart = idx;
      rangeEnd = idx;
      currentBlock = block;
    }
  }
  ranges.push({ start: rangeStart, end: rangeEnd, ...currentBlock });

  // Replace messages from back to front to preserve indices
  let changed = false;
  for (let ri = ranges.length - 1; ri >= 0; ri--) {
    const range = ranges[ri]!;

    // Build the synthetic summary message
    const timestamp = Date.now();
    const summaryText = [
      `[DCP Compressed: ${range.topic} (block #${range.blockId})]`,
      range.summary,
      `[End of compressed block #${range.blockId}. Use /dcp decompress ${range.blockId} to restore.]`,
    ].join("\n");

    const syntheticMessage: Record<string, unknown> = {
      role: "user",
      content: summaryText,
      timestamp,
    };

    // If protecting user messages, check if any in range are user messages
    if (config.compress.protectUserMessages) {
      let hasUserMessage = false;
      for (let i = range.start; i <= range.end; i++) {
        const msg = messages[i];
        if (msg && (msg as { role?: string }).role === "user") {
          hasUserMessage = true;
          break;
        }
      }
      if (hasUserMessage) continue; // Skip this range
    }

    // Replace the range with the synthetic message
    messages.splice(range.start, range.end - range.start + 1, syntheticMessage);
    changed = true;
  }

  return { changed, blockCount: state.activeBlockIds.size };
}

function restoreSessionState(ctx: ExtensionContext): SessionOverrideState {
  const restored: SessionOverrideState = {};

  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "custom" || entry.customType !== STATE_ENTRY) continue;
    const data = entry.data as SessionOverrideState | undefined;
    if (!data) continue;
    if (typeof data.enabled === "boolean") restored.enabled = data.enabled;
    if (typeof data.manualMode === "boolean") restored.manualMode = data.manualMode;
  }

  return restored;
}

function restoreCompressState(ctx: ExtensionContext): CompressState {
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "custom" || entry.customType !== COMPRESS_STATE_ENTRY) continue;
    const data = entry.data as SerializedCompressState | undefined;
    if (data) return deserializeCompressState(data);
  }
  return createCompressState();
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}
