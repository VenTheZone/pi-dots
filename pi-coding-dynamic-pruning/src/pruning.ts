import { normalize, relative, resolve } from "node:path";
import type { DcpConfig } from "./config.js";
import { matchesAnyGlob } from "./glob.js";

export const PRUNED_TOOL_OUTPUT_REPLACEMENT = "[DCP pruned stale tool output. Re-run the tool if you need it again.]";
export const PRUNED_TOOL_INPUT_REPLACEMENT = "[DCP pruned stale tool input. Re-run or inspect the current file state if needed.]";
export const PRUNED_ERROR_INPUT_REPLACEMENT = "[DCP pruned errored tool input. The error output was kept.]";

export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  data?: string;
  mimeType?: string;
}

export interface ThinkingContent {
  type: "thinking";
  thinking: string;
}

export interface ToolCallContent {
  type: "toolCall";
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export type AssistantContent = TextContent | ImageContent | ThinkingContent | ToolCallContent;

export interface UserMessage {
  role: "user";
  content: unknown;
  timestamp: number;
}

export interface AssistantMessage {
  role: "assistant";
  content: AssistantContent[];
  timestamp: number;
  [key: string]: unknown;
}

export interface ToolResultMessage {
  role: "toolResult";
  toolCallId: string;
  toolName: string;
  content: Array<TextContent | ImageContent>;
  isError: boolean;
  timestamp: number;
  [key: string]: unknown;
}

export type PrunableMessage = UserMessage | AssistantMessage | ToolResultMessage | Record<string, unknown>;

export interface PruneSummary {
  changed: boolean;
  prunedOutputs: number;
  prunedInputs: number;
  approxTokensSaved: number;
  totalToolCalls: number;
  reasons: string[];
}

interface ToolRef {
  id: string;
  name: string;
  args: Record<string, unknown>;
  assistantContent: ToolCallContent;
  resultMessage?: ToolResultMessage;
  turn: number;
  order: number;
  path: string | undefined;
  protected: boolean;
}

export function applyPruning(messages: PrunableMessage[], cwd: string, config: DcpConfig): PruneSummary {
  const refs = collectToolRefs(messages, cwd, config);
  if (refs.length === 0) {
    return {
      changed: false,
      prunedOutputs: 0,
      prunedInputs: 0,
      approxTokensSaved: 0,
      totalToolCalls: 0,
      reasons: [],
    };
  }

  const outputPrunes = new Set<string>();
  const inputPrunes = new Map<string, "stale" | "superseded" | "error">();
  const reasons = new Set<string>();

  if (config.strategies.deduplication) {
    const bySignature = new Map<string, ToolRef[]>();

    for (const ref of refs) {
      if (ref.protected || !ref.resultMessage || ref.resultMessage.isError) continue;
      const signature = `${ref.name}::${stableStringify(stripUndefined(ref.args))}`;
      const group = bySignature.get(signature) ?? [];
      group.push(ref);
      bySignature.set(signature, group);
    }

    for (const group of bySignature.values()) {
      if (group.length <= 1) continue;
      group.sort((left, right) => left.order - right.order);
      for (const ref of group.slice(0, -1)) {
        markToolForPruning(ref, outputPrunes, inputPrunes, "stale");
        reasons.add("deduplication");
      }
    }
  }

  if (config.strategies.supersedeWrites) {
    const fileEvents = new Map<string, ToolRef[]>();

    for (const ref of refs) {
      if (!ref.path || ref.protected) continue;
      if (!isFileStateTool(ref.name)) continue;
      const group = fileEvents.get(ref.path) ?? [];
      group.push(ref);
      fileEvents.set(ref.path, group);
    }

    for (const group of fileEvents.values()) {
      group.sort((left, right) => left.order - right.order);
      for (let index = 0; index < group.length; index += 1) {
        const ref = group[index];
        if (!ref || !isWriteLikeTool(ref.name)) continue;
        const hasLaterFileState = group.slice(index + 1).some((entry) => isFileStateTool(entry.name));
        if (!hasLaterFileState) continue;
        inputPrunes.set(ref.id, "superseded");
        reasons.add("supersedeWrites");
      }
    }
  }

  if (config.strategies.purgeErrors.enabled) {
    const threshold = Math.max(1, config.strategies.purgeErrors.turns);
    const currentTurn = getCurrentTurn(messages);

    for (const ref of refs) {
      if (ref.protected || !ref.resultMessage || !ref.resultMessage.isError) continue;
      if (currentTurn - ref.turn < threshold) continue;
      inputPrunes.set(ref.id, "error");
      reasons.add("purgeErrors");
    }
  }

  let prunedOutputs = 0;
  let prunedInputs = 0;
  let approxTokensSaved = 0;

  for (const ref of refs) {
    if (outputPrunes.has(ref.id) && ref.resultMessage) {
      const before = estimateContentTokens(ref.resultMessage.content);
      ref.resultMessage.content = [{ type: "text", text: PRUNED_TOOL_OUTPUT_REPLACEMENT }];
      approxTokensSaved += Math.max(0, before - estimateContentTokens(ref.resultMessage.content));
      prunedOutputs += 1;
    }

    const inputReason = inputPrunes.get(ref.id);
    if (inputReason) {
      const before = estimateArgumentTokens(ref.assistantContent.arguments);
      ref.assistantContent.arguments = pruneArguments(ref.name, ref.assistantContent.arguments, inputReason);
      approxTokensSaved += Math.max(0, before - estimateArgumentTokens(ref.assistantContent.arguments));
      prunedInputs += 1;
    }
  }

  return {
    changed: prunedOutputs > 0 || prunedInputs > 0,
    prunedOutputs,
    prunedInputs,
    approxTokensSaved,
    totalToolCalls: refs.length,
    reasons: [...reasons],
  };
}

function collectToolRefs(messages: PrunableMessage[], cwd: string, config: DcpConfig): ToolRef[] {
  const refsById = new Map<string, ToolRef>();
  const refs: ToolRef[] = [];
  let turn = 0;
  let order = 0;

  for (const message of messages) {
    if (isUserMessage(message)) {
      turn += 1;
      continue;
    }

    if (isAssistantMessage(message)) {
      for (const content of message.content) {
        if (!isToolCallContent(content)) continue;
        const ref: ToolRef = {
          id: content.id,
          name: content.name,
          args: content.arguments,
          assistantContent: content,
          turn,
          order,
          path: extractPrimaryPath(cwd, content.arguments),
          protected: false,
        };
        refs.push(ref);
        refsById.set(ref.id, ref);
        order += 1;
      }
      continue;
    }

    if (isToolResultMessage(message)) {
      const ref = refsById.get(message.toolCallId);
      if (ref) {
        ref.resultMessage = message;
      }
    }
  }

  const latestTurn = turn;
  for (const ref of refs) {
    ref.protected = isProtectedRef(ref, latestTurn, config);
  }

  return refs;
}

function isProtectedRef(ref: ToolRef, latestTurn: number, config: DcpConfig): boolean {
  if (matchesAnyGlob(ref.name, config.protectedTools)) return true;
  if (ref.path && matchesAnyGlob(ref.path, config.protectedPathPatterns)) return true;
  if (config.turnProtection.enabled) {
    const protectedTurns = Math.max(1, config.turnProtection.turns);
    if (latestTurn - ref.turn < protectedTurns) return true;
  }
  return false;
}

function markToolForPruning(
  ref: ToolRef,
  outputPrunes: Set<string>,
  inputPrunes: Map<string, "stale" | "superseded" | "error">,
  reason: "stale" | "superseded" | "error",
): void {
  if (isWriteLikeTool(ref.name)) {
    inputPrunes.set(ref.id, reason);
    return;
  }
  outputPrunes.add(ref.id);
}

function pruneArguments(
  toolName: string,
  args: Record<string, unknown>,
  reason: "stale" | "superseded" | "error",
): Record<string, unknown> {
  if (reason === "error") {
    return replaceStringLeaves(args, PRUNED_ERROR_INPUT_REPLACEMENT, true);
  }

  if (toolName === "write") {
    return {
      ...args,
      content: typeof args.content === "string" ? PRUNED_TOOL_INPUT_REPLACEMENT : args.content,
    };
  }

  if (toolName === "edit") {
    return {
      ...args,
      oldText: typeof args.oldText === "string" ? PRUNED_TOOL_INPUT_REPLACEMENT : args.oldText,
      newText: typeof args.newText === "string" ? PRUNED_TOOL_INPUT_REPLACEMENT : args.newText,
    };
  }

  return replaceStringLeaves(args, PRUNED_TOOL_INPUT_REPLACEMENT, false);
}

function replaceStringLeaves(
  value: Record<string, unknown>,
  replacement: string,
  preservePathLikeKeys: boolean,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (preservePathLikeKeys && isPathKey(key)) {
      next[key] = entry;
      continue;
    }

    next[key] = replaceNestedStrings(entry, replacement, preservePathLikeKeys);
  }

  return next;
}

function replaceNestedStrings(value: unknown, replacement: string, preservePathLikeKeys: boolean): unknown {
  if (typeof value === "string") return replacement;
  if (Array.isArray(value)) {
    return value.map((entry) => replaceNestedStrings(entry, replacement, preservePathLikeKeys));
  }
  if (!isRecord(value)) return value;
  return replaceStringLeaves(value, replacement, preservePathLikeKeys);
}

function isPathKey(key: string): boolean {
  return ["path", "file", "filePath", "oldPath", "newPath", "source", "destination", "target"].includes(key);
}

function extractPrimaryPath(cwd: string, args: Record<string, unknown>): string | undefined {
  const candidate = [args.path, args.filePath, args.file, args.target, args.destination, args.source].find(
    (value): value is string => typeof value === "string",
  );
  if (!candidate) return undefined;
  const normalized = candidate.startsWith("@") ? candidate.slice(1) : candidate;
  return normalize(relative(cwd, resolve(cwd, normalized))).replaceAll("\\", "/");
}

function estimateContentTokens(content: Array<TextContent | ImageContent>): number {
  let chars = 0;
  for (const item of content) {
    if (item.type === "text") chars += item.text.length;
    if (item.type === "image") chars += 256;
  }
  return Math.ceil(chars / 4);
}

function estimateArgumentTokens(args: Record<string, unknown>): number {
  return Math.ceil(stableStringify(args).length / 4);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value)) ?? "";
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!isRecord(value)) return value;
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    next[key] = sortKeys(value[key]);
  }
  return next;
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (!isRecord(value)) return value;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null) continue;
    next[key] = stripUndefined(entry);
  }
  return next;
}

function getCurrentTurn(messages: PrunableMessage[]): number {
  let turns = 0;
  for (const message of messages) {
    if (isUserMessage(message)) turns += 1;
  }
  return turns;
}

function isFileStateTool(toolName: string): boolean {
  return toolName === "read" || toolName === "write" || toolName === "edit";
}

function isWriteLikeTool(toolName: string): boolean {
  return toolName === "write" || toolName === "edit";
}

function isUserMessage(value: PrunableMessage): value is UserMessage {
  return value.role === "user";
}

function isAssistantMessage(value: PrunableMessage): value is AssistantMessage {
  return value.role === "assistant" && Array.isArray((value as AssistantMessage).content);
}

function isToolResultMessage(value: PrunableMessage): value is ToolResultMessage {
  return value.role === "toolResult" && typeof (value as ToolResultMessage).toolCallId === "string";
}

function isToolCallContent(value: AssistantContent): value is ToolCallContent {
  return value.type === "toolCall";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
