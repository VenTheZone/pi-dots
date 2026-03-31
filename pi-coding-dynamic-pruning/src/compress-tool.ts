/**
 * Compress tool for pi-coding-agent.
 * The LLM calls this to compress stale conversation sections.
 * The LLM provides the summary; this tool manages state and replaces messages.
 *
 * Ported from opencode-dynamic-context-pruning with pi-compatible adaptations:
 * - Uses pi's registerTool() API with TypeBox schemas
 * - Message indices instead of OpenCode's mXXXX IDs
 * - Synthetic user messages instead of OpenCode's WithParts structure
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import type { DcpConfig } from "./config.js";
import {
  allocateBlockId,
  createCompressedUserMessage,
  type CompressState,
  estimateTokens,
  wrapCompressedSummary,
} from "./compress-state.js";

const COMPRESS_SYSTEM_GUIDANCE = `
DCP compress tool is available. Use it to manage context by compressing stale conversation sections.

COMPRESSION GUIDELINES:
- Compress sections that are genuinely closed (research done, implementation complete, exploration exhausted)
- The summary becomes the authoritative record - make it dense and technical
- Prefer several small compressions over one massive one
- Do NOT compress content you still need for active edits or precise references
- Each message has a [msg:N] tag. Use these indices in the compress tool's "ranges" parameter.

Before compressing, ask: "Is this section closed enough to become summary-only right now?"
`;

export function getCompressSystemPrompt(): string {
  return COMPRESS_SYSTEM_GUIDANCE;
}

export function registerCompressTool(
  pi: ExtensionAPI,
  getCompressState: () => CompressState,
  getMessages: () => unknown[],
  config: DcpConfig,
): void {
  pi.registerTool({
    name: "compress",
    label: "Compress",
    description:
      "Compress stale conversation sections into technical summaries. Provide the msg indices to compress and a dense summary for each range. The original messages are replaced with your summary.",
    promptSnippet:
      "Compress old conversation sections into summaries to save context space",
    promptGuidelines: [
      "Use compress on closed sections (finished research, completed implementations, exhausted explorations)",
      "Write dense, technical summaries - they become the authoritative record",
      "Prefer multiple small compressions over one large batch",
      "Do not compress content you still need for active work",
    ],
    parameters: Type.Object({
      topic: Type.String({
        description:
          "Short label (3-5 words) for display, e.g. 'Auth System Exploration'",
      }),
      ranges: Type.Array(
        Type.Object({
          startMsgIndex: Type.Number({
            description:
              "Index of first message to compress (from [msg:N] tag)",
          }),
          endMsgIndex: Type.Number({
            description:
              "Index of last message to compress (inclusive, from [msg:N] tag)",
          }),
          summary: Type.String({
            description:
              "Complete technical summary replacing all content in this range",
          }),
        }),
        {
          description:
            "One or more ranges to compress, each with start/end indices and a summary",
        },
      ),
    }),

    async execute(toolCallId, params, _signal, _onUpdate, ctx) {
      const state = getCompressState();
      const messages = getMessages() as Array<{ timestamp?: number }>;

      const results: string[] = [];
      let totalCompressed = 0;

      for (const range of params.ranges) {
        const { startMsgIndex, endMsgIndex, summary } = range;

        if (startMsgIndex < 0 || endMsgIndex >= messages.length) {
          results.push(
            `Skipped range [${startMsgIndex}-${endMsgIndex}]: out of bounds (0-${messages.length - 1})`,
          );
          continue;
        }

        if (startMsgIndex > endMsgIndex) {
          results.push(
            `Skipped range [${startMsgIndex}-${endMsgIndex}]: start > end`,
          );
          continue;
        }

        const blockId = allocateBlockId(state);
        const messageIndices: number[] = [];
        for (let i = startMsgIndex; i <= endMsgIndex; i++) {
          messageIndices.push(i);
        }

        // Estimate tokens saved
        let originalTokens = 0;
        for (const idx of messageIndices) {
          const msg = messages[idx];
          if (msg) {
            originalTokens += estimateTokens(JSON.stringify(msg));
          }
        }
        const summaryTokens = estimateTokens(
          wrapCompressedSummary(blockId, params.topic, summary),
        );
        const savedTokens = Math.max(0, originalTokens - summaryTokens);

        const anchorTimestamp = messages[endMsgIndex]?.timestamp ?? Date.now();

        const block = {
          blockId,
          active: true,
          topic: params.topic,
          messageIndices,
          summary,
          compressedTokens: savedTokens,
          createdAt: Date.now(),
        };

        state.blocksById.set(blockId, block);
        state.activeBlockIds.add(blockId);
        state.totalTokensSaved += savedTokens;
        state.totalBlocksCreated += 1;

        totalCompressed += messageIndices.length;
        results.push(
          `Block #${blockId}: compressed ${messageIndices.length} messages [${startMsgIndex}-${endMsgIndex}] (~${savedTokens} tokens saved)`,
        );
      }

      const resultText =
        results.length > 0
          ? `Compressed ${totalCompressed} messages:\n${results.join("\n")}`
          : "No messages compressed.";

      return {
        content: [{ type: "text", text: resultText }],
        details: {
          blocksCreated: params.ranges.length,
          totalCompressed,
          topic: params.topic,
        },
      };
    },
  });
}
