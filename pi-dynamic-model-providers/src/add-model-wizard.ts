/**
 * /add-model wizard
 *
 * Guides the user through adding a custom OpenAI-compatible endpoint to pi
 * without editing any JSON files by hand.
 *
 * Uses the ExtensionContext UI primitives:
 *   ctx.ui.input()   - single-line text prompt
 *   ctx.ui.select()  - list selector
 *   ctx.ui.confirm() - yes/no dialog
 *   ctx.ui.notify()  - status bar message
 *
 * Flow
 * -----
 *  1. Prompt for the endpoint base URL
 *  2. Probe /v1/models, /models, /openai/v1/models, /api/v1/models
 *     - If found -> parse model ids, context-windows, names; let user pick
 *     - If not found -> fall back to manual single-model entry
 *  4. Optionally set an API key (written to auth.json)
 *  5. Confirm provider id and display name (derived from URL)
 *  6. Write the entry into ~/.pi/agent/models.json (merged with existing content)
 *  7. Notify: run /provider-models refresh to see models immediately
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

// ============================================================
// Constants
// ============================================================

const PROBE_PATHS   = ["/v1/models", "/models", "/openai/v1/models", "/api/v1/models"];
const PROBE_TIMEOUT = 8000;
const DEFAULT_CTX   = 128000;
const DEFAULT_MAXOUT = 16384;

const GLOBAL_AUTH_PATH    = join(homedir(), ".pi", "agent", "auth.json");
const DEFAULT_MODELS_PATH = join(homedir(), ".pi", "agent", "models.json");

// ============================================================
// Types
// ============================================================

interface ParsedModel {
    id:            string;
    name:          string;
    reasoning:     boolean;
    contextWindow: number;
    maxTokens:     number;
    hasImage:      boolean;
}

// ============================================================
// URL / naming helpers
// ============================================================

function normalizeBaseUrl(raw: string): string {
    return raw.trim().replace(/\/+$/, "");
}

/**
 * https://api.foo.ai/v1  ->  "foo-ai-compatible"
 * https://my.example.com  ->  "example-compatible"
 */
function urlToProviderName(base: string): string {
    try {
        const parts = new URL(base).hostname.split(".").filter(Boolean);
        if (parts.length >= 2) return (parts[parts.length - 2] || "custom") + "-compatible";
        return `${parts[0] ?? "custom"}-compatible`;
    }
    catch {
        return "custom-compatible";
    }
}

/**
 * https://api.foo.ai/v1  ->  "Foo AI (Custom)"
 */
function urlToDisplayName(base: string): string {
    try {
        const parts = new URL(base).hostname.split(".").filter(Boolean);
        const core = parts.length >= 2 ? (parts[parts.length - 2] || "Custom") : (parts[0] || "Custom");
        const words = core
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
        return `${words} (Custom)`;
    }
    catch {
        return "Custom Endpoint";
    }
}

// ============================================================
// HTTP / model-parsing helpers
// ============================================================

async function tryFetch(base: string): Promise<Response | undefined> {
    for (const p of PROBE_PATHS) {
        try {
            const r = await fetch(`${base}${p}`, { signal: AbortSignal.timeout(PROBE_TIMEOUT) });
            if (r.ok) return r;
        }
        catch {
            // try next path
        }
    }
    return undefined;
}

function extractArray(payload: unknown): unknown[] | undefined {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
        const obj = payload as Record<string, unknown>;
        for (const k of ["data", "models", "result"]) {
            const v = obj[k];
            if (Array.isArray(v)) return v;
        }
    }
    return undefined;
}

function parseModelEntry(raw: unknown): ParsedModel | null {
    if (raw === null || typeof raw !== "object") return null;

    const obj = raw as Record<string, unknown>;

    // id / name
    const id = typeof obj.id === "string" ? obj.id
        : typeof obj.name === "string" ? (obj.name as string)
        : undefined;
    if (!id) return null;

    // Input modalities
    const archInput = (typeof obj.architecture === "object" && obj.architecture !== null)
        ? ((obj.architecture as Record<string, unknown>).input_modalities as string[] | undefined)
        : undefined;
    const modalities = Array.isArray(archInput) ? archInput : [];

    // Must have text input
    if (!modalities.includes("text")) return null;

    // Context window
    const ctxLength =
        typeof obj.context_length   === "number" ? (obj.context_length   as number)
      : typeof obj.context_window   === "number" ? (obj.context_window   as number)
      : typeof obj.max_input_tokens === "number" ? (obj.max_input_tokens as number)
      : undefined;

    // Max output tokens
    const maxTok =
        typeof obj.max_tokens        === "number" ? (obj.max_tokens        as number)
      : typeof obj.max_output_tokens === "number" ? (obj.max_output_tokens as number)
      : undefined;

    // Reasoning flag
    const sp        = Array.isArray((obj as Record<string, unknown>).supported_parameters)
        ? ((obj as Record<string, unknown>).supported_parameters as string[])
        : [];
    const reasoning = sp.includes("reasoning") || sp.includes("include_reasoning");

    const name = (typeof obj.name === "string" ? (obj.name as string) : id) as string;

    return {
        id:            id,
        name,
        reasoning,
        contextWindow: ctxLength ?? DEFAULT_CTX,
        maxTokens:     maxTok   ?? DEFAULT_MAXOUT,
        hasImage:      modalities.includes("image"),
    };
}

// ============================================================
// Config-file helpers
// ============================================================

function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null && !Array.isArray(x);
}

function readConfigJson(path: string): Record<string, unknown> {
    try {
        return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
    }
    catch {
        // missing file, bad JSON, ...  fresh start
        return {};
    }
}

/**
 * Deep-merge `delta` into the JSON file at `path` and write it back.
 * Existing scalar fields are replaced by `delta`; `models` and
 * `modelOverrides` are shallow-extended rather than replaced.
 */
function mergeAndSave(path: string, delta: Record<string, unknown>): void {
    const existing     = readConfigJson(path);
    const srcProviders = isRecord(existing.providers) ? existing.providers : {};
    const hasDelta     = isRecord((delta as Record<string, unknown>).providers)
        ? (delta as Record<string, unknown>).providers as Record<string, unknown>
        : {};

    const outProviders: Record<string, unknown> = { ...srcProviders };

    for (const [name, deltaEntry] of Object.entries(hasDelta)) {
        if (!isRecord(deltaEntry)) continue;

        if (isRecord(outProviders[name])) {
            // pi's models.json expects `models` as an ARRAY, not a map. Append
            // new model entries onto any existing ones.
            const prevModels = (outProviders[name] as Record<string, unknown>).models;
            const deltaModels = (deltaEntry as Record<string, unknown>).models;
            const oldModels: unknown[] = Array.isArray(prevModels) ? prevModels : [];
            const newModels: unknown[] = Array.isArray(deltaModels) ? deltaModels : [];
            const merged: Record<string, unknown> = {
                ...(outProviders[name] as Record<string, unknown>),
                ...deltaEntry,
                models: [...oldModels, ...newModels],
            };
            outProviders[name] = merged;
        } else {
            outProviders[name] = { ...deltaEntry };
        }
    }

    const out: Record<string, unknown> = { ...existing, providers: outProviders };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`, "utf-8");
}

// ============================================================
// Config delta builder
// ============================================================

interface ProviderManifest {
    baseUrl:     string;
    displayName: string;
    key:         string; // env-var name or literal; may be blank
    models:      ParsedModel[];
}

function buildDelta(m: ProviderManifest): Record<string, unknown> {
    const makeModelRecord = (pm: ParsedModel): Record<string, unknown> => ({
        id:            pm.id,
        name:          pm.name,
        reasoning:     pm.reasoning,
        input:         pm.hasImage ? ["text", "image"] : ["text"],
        contextWindow: pm.contextWindow,
        maxTokens:     pm.maxTokens,
    });

    const entry: Record<string, unknown> = {
        baseUrl:     m.baseUrl,
        api:         "openai-completions",
        authHeader:  true,
        displayName: m.displayName,
    };

    if (m.key.trim()) entry.apiKey = m.key.trim();

    // models.json requires `models` to be an array (not a map).
    entry.models = m.models.map(makeModelRecord);

    return { providers: { [urlToProviderName(m.baseUrl)]: entry } };
}

// ============================================================
// Persistence
// ============================================================

async function doPersist(
    ui:     ExtensionContext["ui"],
    cwd:    string,
    m:      ProviderManifest,
): Promise<boolean> {
    // 1) models.json
    const projectConfig = join(cwd, ".pi", "dynamic-model-providers.json");

    // Prefer project-level config if it already exists; otherwise use global
    let tryPath = projectConfig;
    try {
        readFileSync(tryPath, "utf-8"); // exists?
    } catch {
        tryPath = DEFAULT_MODELS_PATH;
    }

    mergeAndSave(tryPath, buildDelta(m));
    ui?.notify?.("Saved to " + tryPath, "info");

    // 2) auth.json  (API key)
    if (m.key && m.key.trim()) {
        const providerId = urlToProviderName(m.baseUrl);
        const auth       = readConfigJson(GLOBAL_AUTH_PATH);
        auth[providerId] = { type: "api_key", key: m.key.trim() };
        mkdirSync(dirname(GLOBAL_AUTH_PATH), { recursive: true });
        writeFileSync(GLOBAL_AUTH_PATH, `${JSON.stringify(auth, null, 2)}\n`, "utf-8");
        ui?.notify?.("API key saved to " + GLOBAL_AUTH_PATH, "info");
    }

    const plural = m.models.length === 1 ? "" : "s";
    ui?.notify?.(
        "Saved " + m.displayName + ": " + m.models.length + " model" + plural +
        ". Run: /provider-models refresh",
        "info",
    );
    return true;
}

// ============================================================
// Auto-discover path
// ============================================================

async function runAutoDiscover(ui: ExtensionContext["ui"], cwd: string, base: string): Promise<boolean> {
    ui?.notify?.("Probing " + base + " ...", "info");

    const rsp = await tryFetch(base);
    if (!rsp) {
        ui?.notify?.(
            "Could not reach any /models endpoint at " + base +
            ". Switching to manual entry.",
            "warning",
        );
        return runManualEntry(ui, cwd, base);
    }

    const body  = (await rsp.clone().json()) as unknown;
    const items = extractArray(body) ?? [];
    const parsed = items
        .map(parseModelEntry)
        .filter((m): m is ParsedModel => m !== null);

    if (parsed.length === 0) {
        ui?.notify?.(
            "Response contained no parseable models at " + base + ". Switching to manual entry.",
            "warning",
        );
        return runManualEntry(ui, cwd, base);
    }

    const total   = parsed.length;
    const showing = parsed.slice(0, 50);
    const extra   = total > 50 ? " (+" + (total - 50) + " more)" : "";

    ui?.notify?.("Found " + total + " model" + (total === 1 ? "" : "s") + " at " + base + ".", "info");

    const allOption      = "All " + total + " model" + (total === 1 ? "" : "s") + extra;
    const labels: string[] = [
        allOption,
        ...showing.map(
            (m) => m.name + " | " + m.id
                + (m.reasoning ? " | R" : "")
                + (m.hasImage        ? " | img" : ""),
        ),
    ];

    const resultRaw = await ui?.select?.("Pick models to add:", labels);
    if (!resultRaw) {
        ui?.notify?.("Cancelled.", "info");
        return false;
    }
    const result = resultRaw as string;
    const picked = result === allOption
        ? parsed
        : parsed.filter((_, i) => labels[i + 1] === result);

    if (picked.length === 0) {
        ui?.notify?.("No models selected. Cancelled.", "warning");
        return false;
    }

    return gatherMetaAndPersist(ui, cwd, base, picked);
}

// ============================================================
// Meta-gathering + persistence
// ============================================================

async function gatherMetaAndPersist(
    ui:     ExtensionContext["ui"],
    cwd:    string,
    base:   string,
    picked: ParsedModel[],
): Promise<boolean> {
    // Ask whether an API key is required
    const apiKey = (await ui?.input?.("API key (leave blank if not required):", "")) ?? "";
    if (apiKey === undefined) {
        ui?.notify?.("Cancelled.", "info");
        return false;
    }

    // Derive defaults from the URL
    const displayName = urlToDisplayName(base);
    const labelId     = urlToProviderName(base);

    const rawProviderName = await ui?.input?.("Provider id (for models.json):", labelId);
    if (!rawProviderName?.trim()) {
        ui?.notify?.("A provider id is required. Cancelled.", "warning");
        return false;
    }
    const providerName = rawProviderName.trim();

    const rawLabel = await ui?.input?.("Display name:", displayName);
    if (!rawLabel?.trim()) {
        ui?.notify?.("A display name is required. Cancelled.", "warning");
        return false;
    }
    const finalLabel = rawLabel.trim();

    const ok = await ui?.confirm?.(
        "Save",
        'Add "' + finalLabel + '" (' + picked.length + ' model' + (picked.length === 1 ? "" : "s") +
        ") to models.json?",
    );
    if (!ok) {
        ui?.notify?.("Cancelled.", "info");
        return false;
    }

    return doPersist(ui, cwd, {
        baseUrl:     base,
        displayName: finalLabel,
        key:         apiKey.trim(),
        models:      picked,
    });
}

// ============================================================
// Manual entry (no /models endpoint)
// ============================================================

async function runManualEntry(
    ui:  ExtensionContext["ui"],
    cwd: string,
    base: string,
): Promise<boolean> {
    ui?.notify?.("Manual entry mode.", "info");

    // API key (required for manual entries)
    const apiKey = (await ui?.input?.("API key (required, stored in auth.json):", "")) ?? "";
    if (!apiKey.trim()) {
        ui?.notify?.("API key is required for manual entries. Cancelled.", "warning");
        return false;
    }

    const displayName = urlToDisplayName(base);
    const labelId     = urlToProviderName(base);

    const rawProviderName = await ui?.input?.("Provider id:", labelId);
    const providerName    = rawProviderName?.trim() || labelId;

    const rawLabel = await ui?.input?.("Display name:", displayName);
    const finalLabel = rawLabel?.trim() || displayName;

    const rawId  = await ui?.input?.("Model id (e.g. gpt-4o):", "");
    const modelId = rawId?.trim();
    if (!modelId) {
        ui?.notify?.("Model id is required. Cancelled.", "warning");
        return false;
    }

    const rawName = await ui?.input?.("Friendly name (empty = use model id):", "");
    const mName   = rawName?.trim() || modelId;

    const ok = await ui?.confirm?.(
        "Save",
        'Add "' + finalLabel + '" with 1 model (' + modelId + ") to models.json?",
    );
    if (!ok) {
        ui?.notify?.("Cancelled.", "info");
        return false;
    }

    const singular: ParsedModel = {
        id: modelId, name: mName, reasoning: false,
        contextWindow: DEFAULT_CTX, maxTokens: DEFAULT_MAXOUT, hasImage: false,
    };
    return doPersist(ui, cwd, {
        baseUrl: base, displayName: finalLabel, key: apiKey.trim(), models: [singular],
    });
}

// ============================================================
// Public entry-point
// ============================================================

/**
 * Run the /add-model wizard.
 *
 * Returns `true` if a provider was added to config, `false` if cancelled.
 */
export async function runAddModelWizard(ctx: ExtensionContext): Promise<boolean> {
    const ui = ctx.ui;
    if (!ui) {
        console.error("[add-model-wizard] ExtensionContext has no ui.");
        return false;
    }

    ui.notify("Adding a custom model endpoint...", "info");

    // 1) Base URL
    const rawUrl = await ui.input(
        "Endpoint base URL (no trailing /v1/models):",
        "https://api.example.com/v1",
    );
    if (!rawUrl?.trim()) {
        ui.notify("Cancelled.", "info");
        return false;
    }
    const baseUrl = normalizeBaseUrl(rawUrl);

    // 2) Auto-discover or manual entry
    return runAutoDiscover(ui, ctx.cwd, baseUrl);
}
