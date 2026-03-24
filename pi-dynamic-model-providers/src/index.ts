import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { DEFAULT_CONFIG, loadConfig, type DynamicProvidersConfig } from "./config.js";
import { formatSummary, loadProviderModels, type LoadedProvider } from "./providers.js";

const STATUS_KEY = "dynamic-provider-models";

export default function dynamicModelProviders(pi: ExtensionAPI): void {
  let config: DynamicProvidersConfig = DEFAULT_CONFIG;
  let loadedProviders = new Map<string, LoadedProvider>();
  const managedProviders = new Set<string>();

  const setStatus = (ctx: ExtensionContext): void => {
    const entries = [...loadedProviders.values()].filter((entry) => entry.summary.modelCount > 0);
    if (entries.length === 0) {
      ctx.ui.setStatus(STATUS_KEY, "Models: none loaded");
      return;
    }
    const text = entries.map((entry) => `${entry.providerName}:${entry.summary.modelCount}`).join(" | ");
    ctx.ui.setStatus(STATUS_KEY, `Models: ${text}`);
  };

  const applyProviders = (providers: LoadedProvider[]): void => {
    for (const providerName of managedProviders) {
      pi.unregisterProvider(providerName);
    }
    managedProviders.clear();

    for (const entry of providers) {
      if (!entry.runtimeConfig || entry.runtimeConfig.models.length === 0) continue;
      pi.registerProvider(entry.providerName, entry.runtimeConfig);
      managedProviders.add(entry.providerName);
    }
  };

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
