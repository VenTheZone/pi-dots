import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export interface DeduplicationConfig {
  enabled: boolean;
  protectedTools: string[];
}

export interface PurgeErrorsConfig {
  enabled: boolean;
  turns: number;
  protectedTools: string[];
}

export interface NudgesConfig {
  enabled: boolean;
  /** Nudge when context exceeds this % of window */
  maxContextPercent: number;
  /** Start nudging on turn boundaries above this % */
  minContextPercent: number;
  /** Minimum turns between nudges */
  nudgeFrequency: number;
  /** Nudge after this many consecutive tool-only iterations */
  iterationThreshold: number;
}

export interface CompressConfig {
  enabled: boolean;
  permission: "allow" | "deny";
  protectedTools: string[];
  protectUserMessages: boolean;
  nudges: NudgesConfig;
}

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
    deduplication: DeduplicationConfig;
    supersedeWrites: boolean;
    purgeErrors: PurgeErrorsConfig;
  };
  compress: CompressConfig;
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
    deduplication: {
      enabled: true,
      protectedTools: [],
    },
    supersedeWrites: true,
    purgeErrors: {
      enabled: true,
      turns: 4,
      protectedTools: [],
    },
  },
  compress: {
    enabled: true,
    permission: "allow",
    protectedTools: ["compress"],
    protectUserMessages: false,
    nudges: {
      enabled: true,
      maxContextPercent: 80,
      minContextPercent: 50,
      nudgeFrequency: 5,
      iterationThreshold: 15,
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
      deduplication: { ...config.strategies.deduplication },
      supersedeWrites: config.strategies.supersedeWrites,
      purgeErrors: { ...config.strategies.purgeErrors },
    },
    compress: {
      ...config.compress,
      protectedTools: [...config.compress.protectedTools],
      nudges: { ...config.compress.nudges },
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
      const warnings = validateConfig(parsed);
      for (const w of warnings) {
        ctx?.ui.notify(`DCP config warning (${path}): ${w}`, "warning");
      }
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

/** Known valid top-level config keys for validation */
const VALID_TOP_KEYS = new Set([
  "enabled",
  "minContextTokens",
  "protectedTools",
  "protectedPathPatterns",
  "turnProtection",
  "strategies",
  "compress",
]);

const VALID_STRATEGY_KEYS = new Set([
  "deduplication",
  "supersedeWrites",
  "purgeErrors",
]);

const VALID_COMPRESS_KEYS = new Set([
  "enabled",
  "permission",
  "protectedTools",
  "protectUserMessages",
  "nudges",
]);

const VALID_NUDGE_KEYS = new Set([
  "enabled",
  "maxContextPercent",
  "minContextPercent",
  "nudgeFrequency",
  "iterationThreshold",
]);

/**
 * Validate config and return warning messages.
 * Does not block loading - just warns about unknown keys and type mismatches.
 */
export function validateConfig(raw: unknown): string[] {
  const warnings: string[] = [];
  if (!isRecord(raw)) return warnings;

  for (const key of Object.keys(raw)) {
    if (!VALID_TOP_KEYS.has(key)) {
      warnings.push(`Unknown key "${key}"`);
    }
  }

  if (isRecord(raw.strategies)) {
    for (const key of Object.keys(raw.strategies)) {
      if (!VALID_STRATEGY_KEYS.has(key)) {
        warnings.push(`Unknown strategies key "${key}"`);
      }
    }
    // Check per-strategy protectedTools
    if (isRecord(raw.strategies.deduplication)) {
      const d = raw.strategies.deduplication;
      if (d.protectedTools !== undefined && !Array.isArray(d.protectedTools)) {
        warnings.push(
          `strategies.deduplication.protectedTools should be string[], got ${typeof d.protectedTools}`,
        );
      }
    }
    if (isRecord(raw.strategies.purgeErrors)) {
      const p = raw.strategies.purgeErrors;
      if (p.protectedTools !== undefined && !Array.isArray(p.protectedTools)) {
        warnings.push(
          `strategies.purgeErrors.protectedTools should be string[], got ${typeof p.protectedTools}`,
        );
      }
      if (typeof p.turns === "number" && p.turns < 1) {
        warnings.push(`strategies.purgeErrors.turns must be >= 1, got ${p.turns}`);
      }
    }
  }

  if (isRecord(raw.compress)) {
    for (const key of Object.keys(raw.compress)) {
      if (!VALID_COMPRESS_KEYS.has(key)) {
        warnings.push(`Unknown compress key "${key}"`);
      }
    }
    if (
      raw.compress.permission !== undefined &&
      !["allow", "deny"].includes(raw.compress.permission as string)
    ) {
      warnings.push(
        `compress.permission should be "allow" or "deny", got "${raw.compress.permission}"`,
      );
    }
    if (isRecord(raw.compress.nudges)) {
      for (const key of Object.keys(raw.compress.nudges)) {
        if (!VALID_NUDGE_KEYS.has(key)) {
          warnings.push(`Unknown compress.nudges key "${key}"`);
        }
      }
    }
  }

  // Type checks
  if (raw.enabled !== undefined && typeof raw.enabled !== "boolean") {
    warnings.push(`enabled should be boolean, got ${typeof raw.enabled}`);
  }
  if (raw.minContextTokens !== undefined && typeof raw.minContextTokens !== "number") {
    warnings.push(`minContextTokens should be number, got ${typeof raw.minContextTokens}`);
  }

  return warnings;
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
    // Deduplication - supports both boolean shorthand and object form
    if (typeof raw.strategies.deduplication === "boolean") {
      next.strategies.deduplication.enabled = raw.strategies.deduplication;
    } else if (isRecord(raw.strategies.deduplication)) {
      if (typeof raw.strategies.deduplication.enabled === "boolean") {
        next.strategies.deduplication.enabled = raw.strategies.deduplication.enabled;
      }
      if (Array.isArray(raw.strategies.deduplication.protectedTools)) {
        next.strategies.deduplication.protectedTools =
          raw.strategies.deduplication.protectedTools.filter(isString);
      }
    }

    if (typeof raw.strategies.supersedeWrites === "boolean") {
      next.strategies.supersedeWrites = raw.strategies.supersedeWrites;
    }

    // PurgeErrors - supports both number shorthand and object form
    if (typeof raw.strategies.purgeErrors === "number") {
      next.strategies.purgeErrors.turns = Math.max(1, raw.strategies.purgeErrors);
    } else if (isRecord(raw.strategies.purgeErrors)) {
      if (typeof raw.strategies.purgeErrors.enabled === "boolean") {
        next.strategies.purgeErrors.enabled = raw.strategies.purgeErrors.enabled;
      }
      if (typeof raw.strategies.purgeErrors.turns === "number") {
        next.strategies.purgeErrors.turns = Math.max(1, raw.strategies.purgeErrors.turns);
      }
      if (Array.isArray(raw.strategies.purgeErrors.protectedTools)) {
        next.strategies.purgeErrors.protectedTools =
          raw.strategies.purgeErrors.protectedTools.filter(isString);
      }
    }
  }

  // Compress config
  if (isRecord(raw.compress)) {
    if (typeof raw.compress.enabled === "boolean") next.compress.enabled = raw.compress.enabled;
    if (raw.compress.permission === "allow" || raw.compress.permission === "deny") {
      next.compress.permission = raw.compress.permission;
    }
    if (Array.isArray(raw.compress.protectedTools)) {
      next.compress.protectedTools = raw.compress.protectedTools.filter(isString);
    }
    if (typeof raw.compress.protectUserMessages === "boolean") {
      next.compress.protectUserMessages = raw.compress.protectUserMessages;
    }
    if (isRecord(raw.compress.nudges)) {
      const n = raw.compress.nudges;
      if (typeof n.enabled === "boolean") next.compress.nudges.enabled = n.enabled;
      if (typeof n.maxContextPercent === "number") next.compress.nudges.maxContextPercent = n.maxContextPercent;
      if (typeof n.minContextPercent === "number") next.compress.nudges.minContextPercent = n.minContextPercent;
      if (typeof n.nudgeFrequency === "number") next.compress.nudges.nudgeFrequency = Math.max(1, n.nudgeFrequency);
      if (typeof n.iterationThreshold === "number") next.compress.nudges.iterationThreshold = Math.max(1, n.iterationThreshold);
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
