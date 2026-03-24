import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { DEFAULT_CONFIG, loadConfig, type DynamicProvidersConfig } from "./config.js";
import { formatSummary, loadProviderModels, readCache, toRuntimeProviderConfig, type LoadedProvider } from "./providers.js";

const STATUS_KEY = "dynamic-provider-models";

function createOAuthConfig(displayName: string) {
  return {
    name: `${displayName} (API Key)`,
    async login(callbacks: any) {
      const code = await callbacks.onPrompt({ message: `Enter your API key for ${displayName}:` });
      if (!code || code.trim() === "") throw new Error("API key is required");
      return {
        access: code.trim(),
        refresh: "",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10,
      };
    },
    async refreshToken(credentials: any) {
      return credentials;
    },
    getApiKey(credentials: any) {
      return credentials.access;
    },
  };
}

export default function dynamicModelProviders(pi: ExtensionAPI): void {
  // Load config synchronously for initial static registration
  let config = loadConfig(process.cwd());
  let loadedProviders = new Map<string, LoadedProvider>();
  const managedProviders = new Set<string>();

  const applyProviders = (providers: LoadedProvider[]): void => {
    for (const providerName of managedProviders) {
      pi.unregisterProvider(providerName);
    }
    managedProviders.clear();

    for (const entry of providers) {
      if (!entry.runtimeConfig) continue;
      
      // Inject OAuth config so these providers appear in /login
      entry.runtimeConfig.oauth = createOAuthConfig(entry.displayName);
      
      pi.registerProvider(entry.providerName, entry.runtimeConfig);
      managedProviders.add(entry.providerName);
    }
  };

  const setStatus = (ctx: ExtensionContext): void => {
    const entries = [...loadedProviders.values()].filter((entry) => entry.summary.modelCount > 0);
    if (entries.length === 0) {
      ctx.ui.setStatus(STATUS_KEY, "Models: none loaded");
      return;
    }
    const text = entries.map((entry) => `${entry.providerName}:${entry.summary.modelCount}`).join(" | ");
    ctx.ui.setStatus(STATUS_KEY, `Models: ${text}`);
  };

  // Perform a static load from cache so providers are immediately available (e.g., for /login)
  const initialCache = readCache();
  const initialResults: LoadedProvider[] = [];
  const enabledProviders = Object.entries(config.providers ?? {}).filter(([, provider]) => provider.enabled !== false);
  
  for (const [providerName, providerConfig] of enabledProviders) {
    const cachedEntry = initialCache.providers[providerName];
    const models = cachedEntry?.models ?? [];
    const displayName = providerConfig.displayName ?? providerName;
    const runtimeConfig = toRuntimeProviderConfig(providerConfig, models);
    
    const loaded: LoadedProvider = {
      providerName,
      displayName,
      runtimeConfig,
      summary: {
        providerName,
        displayName,
        modelCount: models.length,
        source: models.length > 0 ? "cache" : "stale-cache",
        ageMinutes: cachedEntry ? Math.round((Date.now() - cachedEntry.timestamp) / 60000) : 0,
      }
    };
    loadedProviders.set(providerName, loaded);
    initialResults.push(loaded);
  }
  applyProviders(initialResults);

  const refreshProviders = async (ctx: ExtensionContext, forceRefresh: boolean): Promise<void> => {
    config = loadConfig(ctx.cwd, ctx);
    const enabledProviders = Object.entries(config.providers ?? {}).filter(([, provider]) => provider.enabled !== false);
    const next = new Map<string, LoadedProvider>();
    const results: LoadedProvider[] = [];

    for (const [providerName, providerConfig] of enabledProviders) {
      const loaded = await loadProviderModels(providerName, providerConfig, config.cacheTtlHours ?? 12, forceRefresh);
      next.set(providerName, loaded);
      results.push(loaded);
    }

    loadedProviders = next;
    applyProviders(results);
    setStatus(ctx);

    const failed = results.filter((entry) => entry.summary.error);
    if (failed.length > 0) {
      ctx.ui.notify(`Dynamic provider issues: ${failed.map((entry) => formatSummary(entry.summary)).join(" | ")}`, "warning");
    }
  };

  pi.on("session_start", async (_event, ctx) => {
    await refreshProviders(ctx, false);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setStatus(STATUS_KEY, undefined);
  });

  pi.registerCommand("provider-models", {
    description: "Dynamic provider model status and refresh",
    handler: async (args, ctx) => {
      const [sub, providerName] = args.trim().split(/\s+/, 2);
      if (!sub || sub === "status") {
        const summaries = [...loadedProviders.values()].map((entry) => formatSummary(entry.summary));
        ctx.ui.notify(summaries.length > 0 ? summaries.join(" | ") : "No dynamic providers loaded", "info");
        return;
      }
      if (sub === "refresh") {
        await refreshProviders(ctx, true);
        const summaries = [...loadedProviders.values()].map((entry) => formatSummary(entry.summary));
        ctx.ui.notify(`Refreshed provider models. ${summaries.join(" | ")}`, "info");
        return;
      }
      if (sub === "list") {
        const targets = providerName ? [...loadedProviders.values()].filter((entry) => entry.providerName === providerName) : [...loadedProviders.values()];
        if (targets.length === 0) {
          ctx.ui.notify(providerName ? `No provider named ${providerName}` : "No dynamic providers loaded", "warning");
          return;
        }
        const lines = targets.flatMap((entry) => {
          const header = `${entry.displayName} (${entry.providerName})`;
          const items = (entry.runtimeConfig?.models ?? []).slice(0, 50).map((model) => `- ${model.id} — ${model.name}`);
          return [header, ...items];
        });
        ctx.ui.notify(lines.join("\n"), "info");
        return;
      }
      ctx.ui.notify("Usage: /provider-models [status|refresh|list [provider]]", "warning");
    },
  });
}