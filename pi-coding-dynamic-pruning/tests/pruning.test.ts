import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CONFIG, cloneConfig } from "../src/config.js";
import {
  PRUNED_ERROR_INPUT_REPLACEMENT,
  PRUNED_TOOL_INPUT_REPLACEMENT,
  PRUNED_TOOL_OUTPUT_REPLACEMENT,
  applyPruning,
  type AssistantMessage,
  type PrunableMessage,
  type ToolResultMessage,
  type UserMessage,
} from "../src/pruning.js";

const cwd = "/repo";

function getText(result: ToolResultMessage): string {
  const item = result.content[0];
  assert.ok(item);
  assert.equal(item.type, "text");
  return item.text;
}

function getToolCall(message: AssistantMessage) {
  const item = message.content[0];
  assert.ok(item);
  assert.equal(item.type, "toolCall");
  return item;
}

function user(timestamp: number, content = "user"): UserMessage {
  return { role: "user", timestamp, content };
}

function assistantToolCall(
  timestamp: number,
  id: string,
  name: string,
  args: Record<string, unknown>,
): AssistantMessage {
  return {
    role: "assistant",
    timestamp,
    content: [{ type: "toolCall", id, name, arguments: { ...args } }],
  };
}

function toolResult(
  timestamp: number,
  toolCallId: string,
  toolName: string,
  text: string,
  isError = false,
): ToolResultMessage {
  return {
    role: "toolResult",
    timestamp,
    toolCallId,
    toolName,
    isError,
    content: [{ type: "text", text }],
  };
}

test("deduplication prunes stale duplicate outputs and keeps newest output", () => {
  const messages: PrunableMessage[] = [
    user(1, "check file"),
    assistantToolCall(2, "call-1", "read", { path: "src/a.ts" }),
    toolResult(3, "call-1", "read", "old read result"),
    assistantToolCall(4, "call-2", "read", { path: "src/a.ts" }),
    toolResult(5, "call-2", "read", "fresh read result"),
  ];

  const summary = applyPruning(messages, cwd, cloneConfig(DEFAULT_CONFIG));

  assert.equal(summary.changed, true);
  assert.equal(summary.prunedOutputs, 1);
  assert.equal(summary.prunedInputs, 0);
  assert.equal(getText(messages[2] as ToolResultMessage), PRUNED_TOOL_OUTPUT_REPLACEMENT);
  assert.equal(getText(messages[4] as ToolResultMessage), "fresh read result");
});

test("supersede writes prunes stale write input after a later read", () => {
  const writeCall = assistantToolCall(2, "call-write", "write", {
    path: "src/a.ts",
    content: "console.log('old');",
  });

  const messages: PrunableMessage[] = [
    user(1, "create file"),
    writeCall,
    toolResult(3, "call-write", "write", "wrote file"),
    assistantToolCall(4, "call-read", "read", { path: "src/a.ts" }),
    toolResult(5, "call-read", "read", "console.log('new');"),
  ];

  const summary = applyPruning(messages, cwd, cloneConfig(DEFAULT_CONFIG));
  const toolCall = getToolCall(writeCall);

  assert.equal(summary.changed, true);
  assert.equal(summary.prunedInputs, 1);
  assert.equal(toolCall.arguments.content, PRUNED_TOOL_INPUT_REPLACEMENT);
});

test("purge errors prunes old errored tool input but preserves output", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.strategies.purgeErrors.turns = 2;

  const errorCall = assistantToolCall(2, "call-bash", "bash", {
    command: "cat giant.log",
    path: "logs/giant.log",
  });

  const messages: PrunableMessage[] = [
    user(1, "run bash"),
    errorCall,
    toolResult(3, "call-bash", "bash", "No such file", true),
    user(4, "next"),
    user(5, "next again"),
  ];

  const summary = applyPruning(messages, cwd, config);
  const toolCall = getToolCall(errorCall);
  const result = messages[2] as ToolResultMessage;

  assert.equal(summary.changed, true);
  assert.equal(summary.prunedInputs, 1);
  assert.equal(toolCall.arguments.command, PRUNED_ERROR_INPUT_REPLACEMENT);
  assert.equal(toolCall.arguments.path, "logs/giant.log");
  assert.equal(getText(result), "No such file");
});

test("protected paths and turn protection block pruning", () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.turnProtection.enabled = true;
  config.turnProtection.turns = 2;
  config.protectedPathPatterns = ["secrets/**"];

  const recentRead = toolResult(5, "call-2", "read", "recent output");
  const secretWrite = assistantToolCall(2, "call-1", "write", {
    path: "secrets/.env",
    content: "TOKEN=abc",
  });

  const messages: PrunableMessage[] = [
    user(1, "first"),
    secretWrite,
    toolResult(3, "call-1", "write", "ok"),
    user(4, "second"),
    assistantToolCall(5, "call-2", "read", { path: "src/recent.ts" }),
    recentRead,
  ];

  const summary = applyPruning(messages, cwd, config);
  const writeToolCall = getToolCall(secretWrite);

  assert.equal(summary.changed, false);
  assert.equal(writeToolCall.arguments.content, "TOKEN=abc");
  assert.equal(getText(recentRead), "recent output");
});
