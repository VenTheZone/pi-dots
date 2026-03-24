import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export interface DcpConfig {
  enabled: boolean;
  minContextTokens: number;
  protectedTools: string[];
  protectedPathPatterns: string[];
  turnProtection: {
    enabled: boolean;
    turns: number;
  };
  strategies: {
    deduplication: boolean;
    supersedeWrites: boolean;
    purgeErrors: {
      enabled: boolean;
      turns: number;
    };
  };
}

export interface SessionOverrideState {
  enabled?: boolean;
  manualMode?: boolean;
}

export const STATUS_KEY = "dynamic-context-pruning";
export const STATE_ENTRY = "dynamic-context-pruning:state";
export const GLOBAL_CONFIG_PATH = join(homedir(), ".pi", "agent", "dcp.json");
export const PROJECT_CONFIG_NAME = join(".pi", "dcp.json");

export const DEFAULT_CONFIG: DcpConfig = {
  enabled: true,
  minContextTokens: 50_000,
  protectedTools: [],
  protectedPathPatterns: [],
  turnProtection: {
    enabled: false,
    turns: 4,
  },
  strategies: {
    deduplication: true,
    supersedeWrites: true,
    purgeErrors: {
      enabled: true,
      turns: 4,
    },
  },
};

export function cloneConfig(config: DcpConfig): DcpConfig {
  return {
    enabled: config.enabled,
    minContextTokens: config.minContextTokens,
    protectedTools: [...config.protectedTools],
    protectedPathPatterns: [...config.protectedPathPatterns],
    turnProtection: { ...config.turnProtection },
    strategies: {
      deduplication: config.strategies.deduplication,
      supersedeWrites: config.strategies.supersedeWrites,
      purgeErrors: { ...config.strategies.purgeErrors },
    },
  };
}

export function loadConfig(cwd: string, ctx?: ExtensionContext): DcpConfig {
  let merged = cloneConfig(DEFAULT_CONFIG);

  for (const path of [GLOBAL_CONFIG_PATH, findProjectConfig(cwd)]) {
    if (!path || !existsSync(path)) continue;
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
      merged = mergeConfig(merged, parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx?.ui.notify(`DCP config error in ${path}: ${message}`, "warning");
    }
  }

  return merged;
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

export function mergeConfig(base: DcpConfig, raw: unknown): DcpConfig {
  if (!isRecord(raw)) return base;

  const next = cloneConfig(base);

  if (typeof raw.enabled === "boolean") next.enabled = raw.enabled;
  if (typeof raw.minContextTokens === "number") next.minContextTokens = raw.minContextTokens;
  if (Array.isArray(raw.protectedTools)) next.protectedTools = raw.protectedTools.filter(isString);
  if (Array.isArray(raw.protectedPathPatterns)) {
    next.protectedPathPatterns = raw.protectedPathPatterns.filter(isString);
  }

  if (isRecord(raw.turnProtection)) {
    if (typeof raw.turnProtection.enabled === "boolean") next.turnProtection.enabled = raw.turnProtection.enabled;
    if (typeof raw.turnProtection.turns === "number") next.turnProtection.turns = raw.turnProtection.turns;
  }

  if (isRecord(raw.strategies)) {
    if (typeof raw.strategies.deduplication === "boolean") {
      next.strategies.deduplication = raw.strategies.deduplication;
    }
    if (typeof raw.strategies.supersedeWrites === "boolean") {
      next.strategies.supersedeWrites = raw.strategies.supersedeWrites;
    }
    if (isRecord(raw.strategies.purgeErrors)) {
      if (typeof raw.strategies.purgeErrors.enabled === "boolean") {
        next.strategies.purgeErrors.enabled = raw.strategies.purgeErrors.enabled;
      }
      if (typeof raw.strategies.purgeErrors.turns === "number") {
        next.strategies.purgeErrors.turns = raw.strategies.purgeErrors.turns;
      }
    }
  }

  return next;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
