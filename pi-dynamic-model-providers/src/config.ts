import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export type ProviderKind = "openrouter" | "kilo-gateway" | "openai-compatible" | "cline" | "nvidia-nim";
export type ProviderApi = "openai-completions" | "openai-responses";

export interface ModelCost {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface ModelOverride {
  name?: string;
  reasoning?: boolean;
  input?: Array<"text" | "image">;
  contextWindow?: number;
  maxTokens?: number;
  cost?: Partial<ModelCost>;
  headers?: Record<string, string>;
  compat?: Record<string, unknown>;
}

export interface StaticModel {
  id: string;
  name?: string;
  contextWindow?: number;
  maxTokens?: number;
  reasoning?: boolean;
}

export interface DynamicProviderConfig {
  enabled?: boolean;
  kind?: ProviderKind;
  displayName?: string;
  baseUrl?: string;
  modelsUrl?: string;
  api?: ProviderApi;
  apiKey?: string;
  authHeader?: boolean;
  headers?: Record<string, string>;
  ttlHours?: number;
  maxModels?: number;
  assumeFree?: boolean;
  defaultContextWindow?: number;
  defaultMaxTokens?: number;
  defaultReasoning?: boolean;
  /** Rate limit for API requests (requests per minute). Used to throttle model fetching. */
  requestsPerMinute?: number;
  include?: string[];
  exclude?: string[];
  modelOverrides?: Record<string, ModelOverride>;
  models?: StaticModel[];
}

export interface DynamicProvidersConfig {
  cacheTtlHours?: number;
  providers?: Record<string, DynamicProviderConfig>;
}

export const GLOBAL_CONFIG_PATH = join(homedir(), ".pi", "agent", "dynamic-model-providers.json");
export const PROJECT_CONFIG_NAME = join(".pi", "dynamic-model-providers.json");
export const CACHE_PATH = join(homedir(), ".pi", "agent", "cache", "dynamic-model-providers-cache.json");

export const DEFAULT_CONFIG: DynamicProvidersConfig = {
  cacheTtlHours: 12,
  providers: {
    openrouter: {
      enabled: true,
      kind: "openrouter",
      displayName: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      modelsUrl: "https://openrouter.ai/api/v1/models",
      api: "openai-completions",
      apiKey: "OPENROUTER_API_KEY",
      authHeader: true,
      headers: {
        "HTTP-Referer": "https://github.com/VenTheZone/pi-dots",
        "X-Title": "pi-dots",
      },
      maxModels: 350,
      defaultContextWindow: 128000,
      defaultMaxTokens: 16384,
      defaultReasoning: false,
      modelOverrides: {
        "openrouter/free": { name: "OpenRouter Auto-Router" },
      },
    },
    "kilo-gateway": {
      enabled: true,
      kind: "kilo-gateway",
      displayName: "Kilo Gateway",
      baseUrl: "https://api.kilo.ai/api/gateway",
      modelsUrl: "https://api.kilo.ai/api/gateway/models",
      api: "openai-completions",
      apiKey: "KILO_API_KEY",
      authHeader: true,
      maxModels: 350,
      defaultContextWindow: 128000,
      defaultMaxTokens: 16384,
      defaultReasoning: false,
    },
    cline: {
      enabled: true,
      kind: "cline",
      displayName: "Cline",
      baseUrl: "https://api.cline.bot/api/v1",
      modelsUrl: "https://api.cline.bot/api/v1/ai/cline/models",
      api: "openai-completions",
      // Note: apiKey not set - uses OAuth credentials from /login instead
      authHeader: true,
      headers: {
        "HTTP-Referer": "https://cline.bot",
        "X-Title": "pi-dots",
      },
      maxModels: 500,
      defaultContextWindow: 128000,
      defaultMaxTokens: 16384,
      defaultReasoning: false,
      models: [
        {
          id: "minimax/minimax-m2.5",
          name: "MiniMax M2.5 Free",
          contextWindow: 1000000,
          maxTokens: 32768,
        },
        {
          id: "kwaipilot/kat-coder-pro",
          name: "KAT Coder Pro Free",
          contextWindow: 32768,
          maxTokens: 8192,
        },
        {
          id: "z-ai/glm-5",
          name: "GLM-5 Free",
          contextWindow: 128000,
          maxTokens: 16384,
        },
      ],
    },
    "nvidia-nim": {
      enabled: true,
      kind: "nvidia-nim",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      modelsUrl: "https://integrate.api.nvidia.com/v1/models",
      api: "openai-completions",
      apiKey: "NVIDIA_API_KEY",
      authHeader: true,
      headers: {
        "Accept": "application/json",
      },
      maxModels: 500,
      // NVIDIA NIM free tier has 40 RPM limit for model listing
      requestsPerMinute: 40,
      assumeFree: true,
      defaultContextWindow: 128000,
      defaultMaxTokens: 16384,
      defaultReasoning: false,
      modelOverrides: {
        // DeepSeek V3.2 has 128k+ context (API reports limited info, override for accuracy)
        "deepseek-ai/deepseek-v3.2": {
          name: "DeepSeek V3.2",
          contextWindow: 128000,
          maxTokens: 32768,
        },
        // Kimi-K2.5 has 256k context window
        "moonshotai/kimi-k2.5": {
          name: "Kimi K2.5",
          contextWindow: 256000,
          maxTokens: 32768,
        },
        // Kimi-K2 also has extended context
        "moonshotai/kimi-k2": {
          name: "Kimi K2",
          contextWindow: 256000,
          maxTokens: 32768,
        },
        "moonshotai/kimi-k2-instruct": {
          name: "Kimi K2 Instruct",
          contextWindow: 256000,
          maxTokens: 32768,
        },
      },
    },
  },
};

export function loadConfig(cwd: string, ctx?: ExtensionContext): DynamicProvidersConfig {
  let config = DEFAULT_CONFIG;

  for (const path of [GLOBAL_CONFIG_PATH, findProjectConfig(cwd)]) {
    if (!path || !existsSync(path)) continue;
    try {
      const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
      config = mergeConfig(config, raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx?.ui.notify(`Dynamic provider config error in ${path}: ${message}`, "warning");
    }
  }

  return withComputedDefaults(config);
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

export function mergeConfig(base: DynamicProvidersConfig, raw: unknown): DynamicProvidersConfig {
  if (!isRecord(raw)) return base;
  const next: DynamicProvidersConfig = {
    providers: { ...(base.providers ?? {}) },
  };
  const cacheTtlHours = typeof raw.cacheTtlHours === "number" ? raw.cacheTtlHours : base.cacheTtlHours;
  if (typeof cacheTtlHours === "number") next.cacheTtlHours = cacheTtlHours;

  if (isRecord(raw.providers)) {
    for (const [name, value] of Object.entries(raw.providers)) {
      if (!isRecord(value)) continue;
      const current = next.providers?.[name] ?? {};
      const merged: DynamicProviderConfig = {
        ...current,
        ...filterProviderFields(value),
      };
      if (isRecord(value.headers)) merged.headers = filterStringMap(value.headers);
      if (Array.isArray(value.include)) merged.include = value.include.filter(isString);
      if (Array.isArray(value.exclude)) merged.exclude = value.exclude.filter(isString);
      if (isRecord(value.modelOverrides)) {
        merged.modelOverrides = { ...(current.modelOverrides ?? {}) };
        for (const [modelId, override] of Object.entries(value.modelOverrides)) {
          if (!isRecord(override)) continue;
          merged.modelOverrides[modelId] = mergeModelOverride(current.modelOverrides?.[modelId], override);
        }
      }
      if (!next.providers) next.providers = {};
      next.providers[name] = merged;
    }
  }

  return next;
}

function withComputedDefaults(config: DynamicProvidersConfig): DynamicProvidersConfig {
  const providers = { ...(config.providers ?? {}) };
  for (const [name, provider] of Object.entries(providers)) {
    if (provider.modelsUrl === undefined && provider.baseUrl) {
      providers[name] = {
        ...provider,
        modelsUrl: provider.baseUrl.replace(/\/$/, "") + "/models",
      };
    }
  }
  return { ...config, providers };
}

function mergeModelOverride(base: ModelOverride | undefined, raw: Record<string, unknown>): ModelOverride {
  const next: ModelOverride = { ...(base ?? {}) };
  if (typeof raw.name === "string") next.name = raw.name;
  if (typeof raw.reasoning === "boolean") next.reasoning = raw.reasoning;
  if (Array.isArray(raw.input)) {
    next.input = raw.input.filter((value): value is "text" | "image" => value === "text" || value === "image");
  }
  if (typeof raw.contextWindow === "number") next.contextWindow = raw.contextWindow;
  if (typeof raw.maxTokens === "number") next.maxTokens = raw.maxTokens;
  if (isRecord(raw.headers)) next.headers = filterStringMap(raw.headers);
  if (isRecord(raw.compat)) next.compat = { ...raw.compat };
  if (isRecord(raw.cost)) {
    next.cost = {
      ...(base?.cost ?? {}),
      ...filterCostFields(raw.cost),
    };
  }
  return next;
}

function filterProviderFields(raw: Record<string, unknown>): DynamicProviderConfig {
  const next: DynamicProviderConfig = {};
  if (typeof raw.enabled === "boolean") next.enabled = raw.enabled;
  if (raw.kind === "openrouter" || raw.kind === "kilo-gateway" || raw.kind === "openai-compatible" || raw.kind === "cline" || raw.kind === "nvidia-nim") next.kind = raw.kind;
  if (typeof raw.displayName === "string") next.displayName = raw.displayName;
  if (typeof raw.baseUrl === "string") next.baseUrl = raw.baseUrl;
  if (typeof raw.modelsUrl === "string") next.modelsUrl = raw.modelsUrl;
  if (raw.api === "openai-completions" || raw.api === "openai-responses") next.api = raw.api;
  if (typeof raw.apiKey === "string") next.apiKey = raw.apiKey;
  if (typeof raw.authHeader === "boolean") next.authHeader = raw.authHeader;
  if (typeof raw.requestsPerMinute === "number") next.requestsPerMinute = raw.requestsPerMinute;
  if (typeof raw.ttlHours === "number") next.ttlHours = raw.ttlHours;
  if (typeof raw.maxModels === "number") next.maxModels = raw.maxModels;
  if (typeof raw.assumeFree === "boolean") next.assumeFree = raw.assumeFree;
  if (typeof raw.defaultContextWindow === "number") next.defaultContextWindow = raw.defaultContextWindow;
  if (typeof raw.defaultMaxTokens === "number") next.defaultMaxTokens = raw.defaultMaxTokens;
  if (typeof raw.defaultReasoning === "boolean") next.defaultReasoning = raw.defaultReasoning;
  if (isRecord(raw.modelOverrides)) next.modelOverrides = raw.modelOverrides as Record<string, ModelOverride>;
  if (Array.isArray(raw.models)) next.models = raw.models as StaticModel[];
  return next;
}

function filterCostFields(raw: Record<string, unknown>): Partial<ModelCost> {
  const next: Partial<ModelCost> = {};
  if (typeof raw.input === "number") next.input = raw.input;
  if (typeof raw.output === "number") next.output = raw.output;
  if (typeof raw.cacheRead === "number") next.cacheRead = raw.cacheRead;
  if (typeof raw.cacheWrite === "number") next.cacheWrite = raw.cacheWrite;
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