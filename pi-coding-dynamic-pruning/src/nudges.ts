/**
 * Context nudges for DCP.
 * Injects guidance messages into the system prompt when context is filling up.
 *
 * Ported from opencode-dynamic-context-pruning with pi-compatible adaptations:
 * - Uses system prompt injection via before_agent_start instead of message injection
 * - Simplified nudge types (context-limit, turn, iteration)
 */

import type { DcpConfig } from "./config.js";
import type { CompressState } from "./compress-state.js";

export interface NudgeState {
  /** Last turn index where a turn nudge was injected */
  lastTurnNudgeTurn: number;
  /** Last turn index where an iteration nudge was injected */
  lastIterationNudgeTurn: number;
  /** Consecutive turns without a user message (tool-only iterations) */
  consecutiveIterations: number;
  /** Current turn index */
  currentTurn: number;
}

export function createNudgeState(): NudgeState {
  return {
    lastTurnNudgeTurn: 0,
    lastIterationNudgeTurn: 0,
    consecutiveIterations: 0,
    currentTurn: 0,
  };
}

const CONTEXT_LIMIT_NUDGE = `
⚠️ Context usage is high. Consider using \`compress\` to reduce context size.
Focus on compressing the oldest, most stale conversation sections first.
If you have multiple independent closed sections, compress them in parallel.
`;

const TURN_NUDGE = `
💡 Context housekeeping: You have stale conversation sections that could be compressed.
Review older tool outputs and compress any closed sections to maintain a high-signal context window.
`;

const ITERATION_NUDGE = `
💡 You've been iterating without user input. Consider compressing completed exploration steps to keep context clean for the next user interaction.
`;

export interface NudgeResult {
  /** Additional system prompt text to inject */
  systemPromptAddition: string;
  /** Whether a nudge was injected */
  injected: boolean;
}

/**
 * Evaluate context and return nudge text if appropriate.
 * Call this from before_agent_start handler.
 */
export function evaluateNudges(
  config: DcpConfig,
  compressState: CompressState,
  nudgeState: NudgeState,
  contextTokens: number | null | undefined,
  contextWindow: number | undefined,
  isUserTurn: boolean,
): NudgeResult {
  if (!config.compress.nudges.enabled) {
    return { systemPromptAddition: "", injected: false };
  }

  const parts: string[] = [];

  // Context limit nudge
  if (
    contextTokens != null &&
    contextWindow != null &&
    contextWindow > 0
  ) {
    const percent = (contextTokens / contextWindow) * 100;
    if (percent >= config.compress.nudges.maxContextPercent) {
      parts.push(CONTEXT_LIMIT_NUDGE);
    } else if (percent >= config.compress.nudges.minContextPercent) {
      // Between min and max - only nudge on turn boundaries
      if (isUserTurn) {
        const turnsSinceLastNudge =
          nudgeState.currentTurn - nudgeState.lastTurnNudgeTurn;
        if (turnsSinceLastNudge >= config.compress.nudges.nudgeFrequency) {
          parts.push(TURN_NUDGE);
          nudgeState.lastTurnNudgeTurn = nudgeState.currentTurn;
        }
      }
    }
  }

  // Iteration nudge - tool-only turns without user input
  if (!isUserTurn) {
    nudgeState.consecutiveIterations++;
    if (
      nudgeState.consecutiveIterations >=
      config.compress.nudges.iterationThreshold
    ) {
      const turnsSinceLastNudge =
        nudgeState.currentTurn - nudgeState.lastIterationNudgeTurn;
      if (turnsSinceLastNudge >= config.compress.nudges.nudgeFrequency) {
        parts.push(ITERATION_NUDGE);
        nudgeState.lastIterationNudgeTurn = nudgeState.currentTurn;
      }
    }
  } else {
    nudgeState.consecutiveIterations = 0;
  }

  if (parts.length === 0) {
    return { systemPromptAddition: "", injected: false };
  }

  return {
    systemPromptAddition: parts.join("\n"),
    injected: true,
  };
}

/**
 * Call this on each user message to track turn counting.
 */
export function trackUserTurn(nudgeState: NudgeState): void {
  nudgeState.currentTurn++;
  nudgeState.consecutiveIterations = 0;
}

/**
 * Call this on tool-only turns (no new user message).
 */
export function trackIterationTurn(nudgeState: NudgeState): void {
  nudgeState.currentTurn++;
  nudgeState.consecutiveIterations++;
}
