import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { CACHE_PATH, type DynamicProviderConfig, type ModelCost, type ModelOverride } from "./config.js";

export interface RuntimeProviderModel {
  id: string;
  name: string;
  reasoning: boolean;
  input: Array<"text" | "image">;
  cost: ModelCost;
  contextWindow: number;
  maxTokens: number;
  headers?: Record<string, string>;
  compat?: Record<string, unknown>;
}

export interface RuntimeProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  api?: "openai-completions" | "openai-responses";
  authHeader?: boolean;
  headers?: Record<string, string>;
  models: RuntimeProviderModel[];
  oauth?: any;
}

export interface CachedProviderEntry {
  providerName: string;
  timestamp: number;
  configHash: string;
  fetchedFrom?: string;
  models: RuntimeProviderModel[];
}

export interface CacheFile {
  providers: Record<string, CachedProviderEntry>;
}

export interface ProviderSummary {
  providerName: string;
  displayName: string;
  modelCount: number;
  source: "live" | "cache" | "stale-cache" | "builtin-fallback" | "static";
  ageMinutes: number;
  fetchedFrom?: string;
  error?: string;
}

export interface LoadedProvider {
  providerName: string;
  displayName: string;
  runtimeConfig?: RuntimeProviderConfig;
  summary: ProviderSummary;
}

const ZERO_COST: ModelCost = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

export async function loadProviderModels(
  providerName: string,
  config: DynamicProviderConfig,
  globalTtlHours: number,
  forceRefresh = false,
): Promise<LoadedProvider> {
  const displayName = config.displayName ?? providerName;
  const cache = readCache();
  const cached = cache.providers[providerName];
  
  // If no modelsUrl but have modelOverrides or models, use static models
  const hasStaticModels = !config.modelsUrl && 
    ((config.modelOverrides && Object.keys(config.modelOverrides).length > 0) ||
     (Array.isArray(config.models) && config.models.length > 0));
  
  const configHash = stableHash({
    providerName,
    kind: config.kind,
    baseUrl: config.baseUrl,
    modelsUrl: config.modelsUrl,
    maxModels: config.maxModels,
    assumeFree: config.assumeFree,
    defaultContextWindow: config.defaultContextWindow,
    defaultMaxTokens: config.defaultMaxTokens,
    defaultReasoning: config.defaultReasoning,
    include: config.include,
    exclude: config.exclude,
    modelOverrides: config.modelOverrides,
    models: config.models,
  });
  const ttlHours = config.ttlHours ?? globalTtlHours;
  const maxAgeMs = Math.max(1, ttlHours) * 60 * 60 * 1000;
  const now = Date.now();

  const cacheFresh =
    !!cached && cached.configHash === configHash && now - cached.timestamp <= maxAgeMs && cached.models.length > 0;

  if (!forceRefresh && cacheFresh) {
    return {
      providerName,
      displayName,
      runtimeConfig: toRuntimeProviderConfig(config, cached.models),
      summary: makeSummary({
        providerName,
        displayName,
        modelCount: cached.models.length,
        source: "cache",
        ageMinutes: Math.round((now - cached.timestamp) / 60000),
        ...(cached.fetchedFrom ? { fetchedFrom: cached.fetchedFrom } : {}),
      }),
    };
  }

  // If static models from overrides, use those directly
  if (hasStaticModels) {
    const models = buildStaticModels(config);
    const entry = makeCachedProviderEntry({
      providerName,
      timestamp: now,
      configHash,
      models,
    });
    cache.providers[providerName] = entry;
    writeCache(cache);
    return {
      providerName,
      displayName,
      runtimeConfig: toRuntimeProviderConfig(config, models),
      summary: makeSummary({
        providerName,
        displayName,
        modelCount: models.length,
        source: "static",
        ageMinutes: 0,
      }),
    };
  }

  try {
    const models = await fetchProviderModels(providerName, config);
    if (models.length === 0) {
      throw new Error("No compatible text models found");
    }
    const entry = makeCachedProviderEntry({
      providerName,
      timestamp: now,
      configHash,
      ...(config.modelsUrl ? { fetchedFrom: config.modelsUrl } : {}),
      models,
    });
    cache.providers[providerName] = entry;
    writeCache(cache);
    return {
      providerName,
      displayName,
      runtimeConfig: toRuntimeProviderConfig(config, models),
      summary: makeSummary({
        providerName,
        displayName,
        modelCount: models.length,
        source: "live",
        ageMinutes: 0,
        ...(config.modelsUrl ? { fetchedFrom: config.modelsUrl } : {}),
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (cached && cached.models.length > 0) {
      return {
        providerName,
        displayName,
        runtimeConfig: toRuntimeProviderConfig(config, cached.models),
        summary: makeSummary({
          providerName,
          displayName,
          modelCount: cached.models.length,
          source: "stale-cache",
          ageMinutes: Math.round((now - cached.timestamp) / 60000),
          ...(cached.fetchedFrom ? { fetchedFrom: cached.fetchedFrom } : {}),
          error: message,
        }),
      };
    }
    return {
      providerName,
      displayName,
      summary: makeSummary({
        providerName,
        displayName,
        modelCount: 0,
        source: providerName === "openrouter" ? "builtin-fallback" : "stale-cache",
        ageMinutes: 0,
        ...(config.modelsUrl ? { fetchedFrom: config.modelsUrl } : {}),
        error: message,
      }),
    };
  }
}

async function fetchProviderModels(providerName: string, config: DynamicProviderConfig): Promise<RuntimeProviderModel[]> {
  const url = config.modelsUrl;
  if (!url) throw new Error(`No modelsUrl configured for ${providerName}`);

  const headers = await resolveHeaders(config.headers);
  const apiKey = await resolveValue(config.apiKey);
  if (config.authHeader && apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Model fetch failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as unknown;
  const rawModels = extractModelArray(payload);
  const parsed = rawModels
    .map((raw) => parseModel(raw, config))
    .filter((model): model is RuntimeProviderModel => model !== null)
    .filter((model) => matchesFilters(model.id, config.include, config.exclude));

  parsed.sort((a, b) => a.id.localeCompare(b.id));
  return typeof config.maxModels === "number" && config.maxModels > 0 ? parsed.slice(0, config.maxModels) : parsed;
}

function extractModelArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload)) {
    const data = payload.data;
    if (Array.isArray(data)) return data;
    const models = payload.models;
    if (Array.isArray(models)) return models;
  }
  return [];
}

function parseModel(raw: unknown, config: DynamicProviderConfig): RuntimeProviderModel | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : typeof raw.name === "string" ? raw.name : undefined;
  if (!id) return null;

  const modalities = inferInputModalities(raw);
  if (!modalities.includes("text")) return null;
  const outputModalities = inferOutputModalities(raw);
  if (outputModalities.length > 0 && !outputModalities.includes("text")) return null;

  const override = config.modelOverrides?.[id];
  const cost = applyCostOverride(parseCost(raw, config.assumeFree === true), override?.cost);
  const reasoning = override?.reasoning ?? inferReasoning(raw, config.defaultReasoning ?? false);
  const input = override?.input ?? (modalities.includes("image") ? (["text", "image"] as const) : (["text"] as const));
  const contextWindow = override?.contextWindow ?? inferContextWindow(raw, config.defaultContextWindow ?? 128000);
  const maxTokens = override?.maxTokens ?? inferMaxTokens(raw, config.defaultMaxTokens ?? 16384);
  const baseName = override?.name ?? inferDisplayName(raw, id);
  const name = `${baseName} (${formatPriceLabel(cost)})`;

  const model: RuntimeProviderModel = {
    id,
    name,
    reasoning,
    input: [...input],
    cost,
    contextWindow,
    maxTokens,
  };

  if (override?.headers) model.headers = { ...override.headers };
  if (override?.compat) model.compat = { ...override.compat };
  return model;
}

function inferDisplayName(raw: Record<string, unknown>, id: string): string {
  return typeof raw.name === "string" && raw.name.trim().length > 0 ? raw.name : id;
}

function inferInputModalities(raw: Record<string, unknown>): Array<"text" | "image"> {
  const fromArchitecture = isRecord(raw.architecture) ? raw.architecture.input_modalities : undefined;
  const values = Array.isArray(fromArchitecture) ? fromArchitecture : [];
  const hasText = values.some((value) => value === "text") || values.length === 0;
  const hasImage = values.some((value) => value === "image");
  return hasImage ? (hasText ? ["text", "image"] : ["image"]) : ["text"];
}

function inferOutputModalities(raw: Record<string, unknown>): string[] {
  const values = isRecord(raw.architecture) && Array.isArray(raw.architecture.output_modalities) ? raw.architecture.output_modalities : [];
  return values.filter((value): value is string => typeof value === "string");
}

function inferReasoning(raw: Record<string, unknown>, fallback: boolean): boolean {
  const supported = Array.isArray(raw.supported_parameters) ? raw.supported_parameters : [];
  return fallback || supported.includes("reasoning") || supported.includes("include_reasoning");
}

function inferContextWindow(raw: Record<string, unknown>, fallback: number): number {
  if (typeof raw.context_length === "number") return raw.context_length;
  if (isRecord(raw.top_provider) && typeof raw.top_provider.context_length === "number") return raw.top_provider.context_length;
  return fallback;
}

function inferMaxTokens(raw: Record<string, unknown>, fallback: number): number {
  if (isRecord(raw.top_provider) && typeof raw.top_provider.max_completion_tokens === "number") return raw.top_provider.max_completion_tokens;
  if (typeof raw.maxTokens === "number") return raw.maxTokens;
  return fallback;
}

function parseCost(raw: Record<string, unknown>, assumeFree: boolean): ModelCost {
  if (assumeFree) return { ...ZERO_COST };
  const pricing = isRecord(raw.pricing) ? raw.pricing : undefined;
  const isFree = raw.isFree === true || (typeof raw.id === "string" && raw.id.endsWith(":free"));
  if (isFree) return { ...ZERO_COST };
  if (!pricing) return { ...ZERO_COST, input: Number.NaN, output: Number.NaN };

  const prompt = toCostPerMillion(pricing.prompt);
  const completion = toCostPerMillion(pricing.completion);
  const cacheRead = toCostPerMillion(pricing.input_cache_read);
  const cacheWrite = toCostPerMillion(pricing.input_cache_write);

  return {
    input: Number.isFinite(prompt) ? prompt : Number.NaN,
    output: Number.isFinite(completion) ? completion : Number.NaN,
    cacheRead: Number.isFinite(cacheRead) ? cacheRead : 0,
    cacheWrite: Number.isFinite(cacheWrite) ? cacheWrite : 0,
  };
}

function applyCostOverride(cost: ModelCost, override: Partial<ModelCost> | undefined): ModelCost {
  if (!override) return cost;
  return {
    input: override.input ?? cost.input,
    output: override.output ?? cost.output,
    cacheRead: override.cacheRead ?? cost.cacheRead,
    cacheWrite: override.cacheWrite ?? cost.cacheWrite,
  };
}

export function formatPriceLabel(cost: ModelCost): string {
  const isUnknown = !Number.isFinite(cost.input) || !Number.isFinite(cost.output);
  if (isUnknown) return "price unknown";
  if (cost.input === 0 && cost.output === 0 && cost.cacheRead === 0 && cost.cacheWrite === 0) return "free";
  return `$${formatMoney(cost.input)}/$${formatMoney(cost.output)}`;
}

function buildStaticModels(config: DynamicProviderConfig): RuntimeProviderModel[] {
  const models: RuntimeProviderModel[] = [];
  const overrides = config.modelOverrides ?? {};
  const defaultCost: ModelCost = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  
  // First add models from the static models array
  if (Array.isArray(config.models)) {
    for (const model of config.models) {
      models.push({
        id: model.id,
        name: model.name ?? model.id.split("/").pop() ?? model.id,
        reasoning: model.reasoning ?? config.defaultReasoning ?? false,
        input: ["text"],
        cost: { ...defaultCost },
        contextWindow: model.contextWindow ?? config.defaultContextWindow ?? 128000,
        maxTokens: model.maxTokens ?? config.defaultMaxTokens ?? 16384,
      });
    }
  }
  
  // Then add models from modelOverrides (for backward compatibility)
  for (const [modelId, override] of Object.entries(overrides)) {
    if (!override) continue;
    
    const baseName = override.name ?? modelId.split("/").pop() ?? modelId;
    const name = `${baseName}`;
    const cost: ModelCost = {
      input: override.cost?.input ?? 0,
      output: override.cost?.output ?? 0,
      cacheRead: override.cost?.cacheRead ?? 0,
      cacheWrite: override.cost?.cacheWrite ?? 0,
    };
    
    models.push({
      id: modelId,
      name,
      reasoning: override.reasoning ?? false,
      input: override.input ?? ["text"],
      cost,
      contextWindow: override.contextWindow ?? config.defaultContextWindow ?? 128000,
      maxTokens: override.maxTokens ?? config.defaultMaxTokens ?? 16384,
    });
  }
  
  return models;
}

function formatMoney(value: number): string {
  if (value >= 10) return value.toFixed(0);
  if (value >= 1) return value.toFixed(1).replace(/\.0$/, "");
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function toCostPerMillion(value: unknown): number {
  if (typeof value === "number") return value * 1_000_000;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed * 1_000_000 : Number.NaN;
  }
  return Number.NaN;
}

export function toRuntimeProviderConfig(config: DynamicProviderConfig, models: RuntimeProviderModel[]): RuntimeProviderConfig {
  const next: RuntimeProviderConfig = {
    api: config.api ?? "openai-completions",
    models,
  };
  if (config.baseUrl) next.baseUrl = config.baseUrl;
  if (config.apiKey) next.apiKey = config.apiKey;
  if (typeof config.authHeader === "boolean") next.authHeader = config.authHeader;
  if (config.headers) next.headers = config.headers;
  return next;
}

async function resolveHeaders(headers: Record<string, string> | undefined): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    const next = await resolveValue(value);
    if (next) resolved[key] = next;
  }
  return resolved;
}

async function resolveValue(value: string | undefined): Promise<string | undefined> {
  if (!value) return undefined;
  if (value.startsWith("!")) {
    const { execFile } = await import("node:child_process");
    return await new Promise<string>((resolve, reject) => {
      execFile("sh", ["-lc", value.slice(1)], { encoding: "utf8" }, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout.trim());
      });
    });
  }
  const envValue = process.env[value];
  if (typeof envValue === "string" && envValue.length > 0) return envValue;
  if (/^[A-Z][A-Z0-9_]+$/.test(value)) return undefined;
  return value;
}

function matchesFilters(id: string, include: string[] | undefined, exclude: string[] | undefined): boolean {
  const included = !include || include.length === 0 || include.some((pattern) => globMatch(pattern, id));
  if (!included) return false;
  return !(exclude ?? []).some((pattern) => globMatch(pattern, id));
}

function globMatch(pattern: string, value: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i").test(value);
}

export function readCache(): CacheFile {
  try {
    const raw = JSON.parse(readFileSync(CACHE_PATH, "utf8")) as unknown;
    if (isRecord(raw) && isRecord(raw.providers)) {
      const providers: Record<string, CachedProviderEntry> = {};
      for (const [key, value] of Object.entries(raw.providers)) {
        if (!isRecord(value) || !Array.isArray(value.models)) continue;
        providers[key] = makeCachedProviderEntry({
          providerName: typeof value.providerName === "string" ? value.providerName : key,
          timestamp: typeof value.timestamp === "number" ? value.timestamp : 0,
          configHash: typeof value.configHash === "string" ? value.configHash : "",
          ...(typeof value.fetchedFrom === "string" ? { fetchedFrom: value.fetchedFrom } : {}),
          models: value.models.filter(isRuntimeProviderModel),
        });
      }
      return { providers };
    }
  } catch {}
  return { providers: {} };
}

function writeCache(cache: CacheFile): void {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function stableHash(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!isRecord(value)) return value;
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    output[key] = sortDeep(value[key]);
  }
  return output;
}

function makeSummary(value: {
  providerName: string;
  displayName: string;
  modelCount: number;
  source: ProviderSummary["source"];
  ageMinutes: number;
  fetchedFrom?: string;
  error?: string;
}): ProviderSummary {
  const summary: ProviderSummary = {
    providerName: value.providerName,
    displayName: value.displayName,
    modelCount: value.modelCount,
    source: value.source,
    ageMinutes: value.ageMinutes,
  };
  if (value.fetchedFrom) summary.fetchedFrom = value.fetchedFrom;
  if (value.error) summary.error = value.error;
  return summary;
}

function makeCachedProviderEntry(value: {
  providerName: string;
  timestamp: number;
  configHash: string;
  fetchedFrom?: string;
  models: RuntimeProviderModel[];
}): CachedProviderEntry {
  const entry: CachedProviderEntry = {
    providerName: value.providerName,
    timestamp: value.timestamp,
    configHash: value.configHash,
    models: value.models,
  };
  if (value.fetchedFrom) entry.fetchedFrom = value.fetchedFrom;
  return entry;
}

function isRuntimeProviderModel(value: unknown): value is RuntimeProviderModel {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.reasoning === "boolean";
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatSummary(summary: ProviderSummary): string {
  const age = summary.ageMinutes > 0 ? `, age ${summary.ageMinutes}m` : "";
  const error = summary.error ? `, ${summary.error}` : "";
  return `${summary.displayName}: ${summary.modelCount} models (${summary.source}${age}${error})`;
}
