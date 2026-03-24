import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { loadConfig, STATE_ENTRY, STATUS_KEY, type SessionOverrideState } from "./config.js";
import { applyPruning } from "./pruning.js";

export default function dynamicContextPruning(pi: ExtensionAPI): void {
  let config = loadConfig(process.cwd());
  let sessionState: SessionOverrideState = {};
  let lastSummaryText: string | undefined;

  const refreshRuntimeState = (ctx: ExtensionContext): void => {
    config = loadConfig(ctx.cwd, ctx);
    sessionState = restoreSessionState(ctx);
    updateStatus(ctx);
  };

  const persistSessionState = (): void => {
    pi.appendEntry<SessionOverrideState>(STATE_ENTRY, sessionState);
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
    ctx.ui.setStatus(STATUS_KEY, lastSummaryText);
  };

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
    return {
      systemPrompt:
        event.systemPrompt +
        "\n\nDynamic Context Pruning (DCP) is active. Older stale tool outputs and stale tool inputs may be replaced with short placeholders to save context. If a placeholder appears, re-run the relevant tool instead of guessing.",
    };
  });

  pi.on("context", async (event, ctx) => {
    if (!isEnabled() || isManual()) {
      lastSummaryText = undefined;
      updateStatus(ctx);
      return;
    }

    const usage = ctx.getContextUsage();
    if (usage?.tokens !== null && usage?.tokens !== undefined && usage.tokens < config.minContextTokens) {
      lastSummaryText = undefined;
      updateStatus(ctx);
      return;
    }

    const summary = applyPruning(event.messages as import("./pruning.js").PrunableMessage[], ctx.cwd, config);
    if (!summary.changed) {
      lastSummaryText = undefined;
      updateStatus(ctx);
      return;
    }

    lastSummaryText = `DCP: -${formatCompactNumber(summary.approxTokensSaved)} tok (${summary.prunedOutputs} out, ${summary.prunedInputs} in)`;
    updateStatus(ctx);
    return { messages: event.messages };
  });

  pi.registerCommand("dcp", {
    description: "Dynamic Context Pruning controls and status",
    handler: async (args, ctx) => {
      const [command, ...rest] = args.trim().split(/\s+/).filter(Boolean);

      if (!command || command === "help") {
        ctx.ui.notify("/dcp status | on | off | manual [on|off] | reload", "info");
        return;
      }

      if (command === "status") {
        config = loadConfig(ctx.cwd, ctx);
        const usage = ctx.getContextUsage();
        const usageText = usage?.tokens != null
          ? `${formatCompactNumber(usage.tokens)} / ${formatCompactNumber(usage.contextWindow)}`
          : "unknown";
        ctx.ui.notify(
          `DCP ${isEnabled() ? "on" : "off"}${isManual() ? " (manual)" : ""} | usage ${usageText} | ${lastSummaryText ?? "no pruning applied yet"}`,
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
        ctx.ui.notify(`DCP manual mode ${isManual() ? "enabled" : "disabled"}`, "info");
        return;
      }

      ctx.ui.notify("Unknown DCP command. Try /dcp help", "warning");
    },
  });
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

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}
