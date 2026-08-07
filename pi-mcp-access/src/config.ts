import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export type McpTransportType = "streamable-http" | "sse" | "stdio";

export interface McpServerConfig {
  enabled?: boolean;
  transport: McpTransportType;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  headers?: Record<string, string>;
  toolPrefix?: string;
  /** Request timeout in milliseconds. Defaults to 60000 (60 seconds). */
  timeout?: number;
}

export interface McpConfig {
  servers: Record<string, McpServerConfig>;
}

export const GLOBAL_CONFIG_PATH = join(homedir(), ".pi", "agent", "mcp.json");
export const PROJECT_CONFIG_NAME = join(".pi", "mcp.json");

export const DEFAULT_CONFIG: McpConfig = {
  servers: {},
};

export function loadConfig(cwd: string, ctx?: ExtensionContext): McpConfig {
  let config: McpConfig = { servers: {} };

  for (const path of [GLOBAL_CONFIG_PATH, findProjectConfig(cwd)]) {
    if (!path || !existsSync(path)) continue;
    try {
      const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
      config = mergeConfig(config, raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx?.ui.notify(`MCP config error in ${path}: ${message}`, "warning");
    }
  }

  return config;
}

export function findProjectConfig(startCwd: string): string | undefined {
  let current = resolve(startCwd);
  while (true) {
    const candidate = join(current, PROJECT_CONFIG_NAME);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

export function mergeConfig(base: McpConfig, raw: unknown): McpConfig {
  if (!isRecord(raw)) return base;
  const next: McpConfig = { servers: { ...base.servers } };

  if (isRecord(raw.servers)) {
    for (const [name, value] of Object.entries(raw.servers)) {
      if (!isRecord(value)) continue;
      const current = next.servers[name] ?? { transport: "streamable-http" as const };
      const merged: McpServerConfig = {
        transport: isTransport(value.transport) ? value.transport : current.transport,
      };
      if (typeof value.enabled === "boolean") merged.enabled = value.enabled;
      else if (current.enabled !== undefined) merged.enabled = current.enabled;
      if (typeof value.url === "string") merged.url = value.url;
      else if (typeof current.url === "string") merged.url = current.url;
      if (typeof value.command === "string") merged.command = value.command;
      else if (typeof current.command === "string") merged.command = current.command;
      if (Array.isArray(value.args)) merged.args = value.args.filter(isString);
      else if (current.args) merged.args = [...current.args];
      if (isRecord(value.env)) merged.env = filterStringMap(value.env);
      else if (current.env) merged.env = { ...current.env };
      if (typeof value.cwd === "string") merged.cwd = value.cwd;
      else if (typeof current.cwd === "string") merged.cwd = current.cwd;
      if (isRecord(value.headers)) merged.headers = filterStringMap(value.headers);
      else if (current.headers) merged.headers = { ...current.headers };
      if (typeof value.toolPrefix === "string") merged.toolPrefix = value.toolPrefix;
      else if (typeof current.toolPrefix === "string") merged.toolPrefix = current.toolPrefix;
      if (typeof value.timeout === "number") merged.timeout = value.timeout;
      else if (current.timeout !== undefined) merged.timeout = current.timeout;
      next.servers[name] = merged;
    }
  }

  return next;
}

function filterStringMap(input: Record<string, unknown>): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") output[key] = value;
  }
  return output;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isTransport(value: unknown): value is McpTransportType {
  return value === "streamable-http" || value === "sse" || value === "stdio";
}
