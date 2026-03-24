import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { DEFAULT_CONFIG, loadConfig, type McpConfig } from "./config.js";
import { connectServer, executeBinding, listBindings, summarizeBindings, type McpToolBinding } from "./mcp.js";

const STATUS_KEY = "mcp-access";

export default function mcpAccess(pi: ExtensionAPI): void {
  let config: McpConfig = DEFAULT_CONFIG;
  let bindings = new Map<string, McpToolBinding>();
  let statusText = "MCP: disconnected";
  const registeredToolNames = new Set<string>();
  const connections = new Map<string, { close(): Promise<void> }>();

  const setStatus = (ctx: ExtensionContext): void => {
    ctx.ui.setStatus(STATUS_KEY, statusText);
  };

  const closeConnections = async (): Promise<void> => {
    await Promise.all([...connections.values()].map((client) => client.close().catch(() => undefined)));
    connections.clear();
    bindings.clear();
  };

  const loadServers = async (ctx: ExtensionContext): Promise<void> => {
    config = loadConfig(ctx.cwd, ctx);
    await closeConnections();

    const enabledServers = Object.entries(config.servers).filter(([, server]) => server.enabled !== false);
    if (enabledServers.length === 0) {
      statusText = "MCP: no servers";
      setStatus(ctx);
      return;
    }

    statusText = `MCP: connecting ${enabledServers.length}`;
    setStatus(ctx);

    const liveConnections: Array<{ serverName: string; client: Awaited<ReturnType<typeof connectServer>>; config: (typeof enabledServers)[number][1] }> = [];
    const failures: string[] = [];

    for (const [serverName, serverConfig] of enabledServers) {
      try {
        const client = await connectServer(serverName, serverConfig);
        connections.set(serverName, client);
        liveConnections.push({ serverName, client, config: serverConfig });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${serverName}: ${message}`);
      }
    }

    const nextBindings = await listBindings(liveConnections);
    bindings = new Map(nextBindings.map((binding) => [binding.effectiveName, binding]));

    for (const binding of nextBindings) {
      if (registeredToolNames.has(binding.effectiveName)) continue;
      registeredToolNames.add(binding.effectiveName);
      pi.registerTool({
        name: binding.effectiveName,
        label: binding.effectiveName,
        description: binding.description ?? `MCP tool ${binding.originalName} from ${binding.serverName}`,
        promptSnippet: `Call MCP tool ${binding.effectiveName}`,
        parameters: (binding.inputSchema as any) ?? Type.Object({}),
        async execute(_toolCallId, params) {
          const current = bindings.get(binding.effectiveName);
          if (!current) {
            throw new Error(`MCP tool unavailable: ${binding.effectiveName}`);
          }
          const result = await executeBinding(current, params as Record<string, unknown>);
          if (result.isError) {
            const message = result.content.find((item) => item.type === "text")?.text ?? "MCP tool failed";
            throw new Error(message);
          }
          return {
            content: result.content.map((item) =>
              item.type === "text"
                ? { type: "text" as const, text: item.text ?? "" }
                : { type: "image" as const, data: item.data ?? "", mimeType: item.mimeType ?? "image/png" },
            ),
            details: result.details,
          };
        },
      });
    }

    statusText = failures.length > 0
      ? `MCP: ${nextBindings.length} tools, ${failures.length} failed`
      : `MCP: ${nextBindings.length} tools`;
    setStatus(ctx);

    if (failures.length > 0) {
      ctx.ui.notify(`MCP connection issues: ${failures.join(" | ")}`, "warning");
    }
  };

  pi.on("session_start", async (_event, ctx) => {
    await loadServers(ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setStatus(STATUS_KEY, undefined);
    await closeConnections();
  });

  pi.registerCommand("mcp", {
    description: "MCP bridge status and reload",
    handler: async (args, ctx) => {
      const [sub] = args.trim().split(/\s+/, 1);
      if (!sub || sub === "status") {
        const summary = summarizeBindings([...bindings.values()]);
        ctx.ui.notify(`${statusText} | ${summary}`, "info");
        return;
      }
      if (sub === "tools") {
        const names = [...bindings.keys()].sort();
        ctx.ui.notify(names.length > 0 ? names.join(", ") : "No MCP tools loaded", "info");
        return;
      }
      if (sub === "reload") {
        await loadServers(ctx);
        ctx.ui.notify(`Reloaded MCP servers. ${summarizeBindings([...bindings.values()])}`, "info");
        return;
      }
      ctx.ui.notify("Usage: /mcp [status|tools|reload]", "warning");
    },
  });
}
