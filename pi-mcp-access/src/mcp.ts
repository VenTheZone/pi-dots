import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { McpServerConfig } from "./config.js";

export interface McpToolInfo {
  name: string;
  description?: string | undefined;
  inputSchema?: Record<string, unknown> | undefined;
}

export interface McpToolBinding {
  serverName: string;
  effectiveName: string;
  originalName: string;
  description?: string | undefined;
  inputSchema?: Record<string, unknown> | undefined;
  client: McpClientLike;
}

export interface McpClientLike {
  listTools(): Promise<{ tools: unknown[] }>;
  callTool(params: { name: string; arguments?: Record<string, unknown> }): Promise<any>;
  close(): Promise<void>;
}

export interface McpCallToolResult {
  content?: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
    | { type: "audio"; data: string; mimeType: string }
    | { type: "resource"; resource: { uri: string; text?: string | undefined; blob?: string | undefined; mimeType?: string | undefined } }
    | { type: "resource_link"; uri: string; name: string; description?: string | undefined; mimeType?: string | undefined }
  >;
  structuredContent?: Record<string, unknown> | undefined;
  isError?: boolean | undefined;
}

export interface PiToolContent {
  type: "text" | "image";
  text?: string;
  data?: string;
  mimeType?: string;
}

export async function connectServer(name: string, config: McpServerConfig): Promise<Client> {
  const client = new Client({ name: `pi-mcp-access:${name}`, version: "0.1.0" });
  const transport = createTransport(config);
  await client.connect(transport as any);
  return client;
}

export function createTransport(config: McpServerConfig) {
  switch (config.transport) {
    case "stdio": {
      if (!config.command) throw new Error("stdio MCP server requires a command");
      const options: ConstructorParameters<typeof StdioClientTransport>[0] = {
        command: config.command,
        stderr: "pipe",
      };
      if (config.args) options.args = config.args;
      if (config.env) options.env = config.env;
      if (config.cwd) options.cwd = config.cwd;
      return new StdioClientTransport(options);
    }
    case "sse": {
      if (!config.url) throw new Error("sse MCP server requires a url");
      const options: ConstructorParameters<typeof SSEClientTransport>[1] = {};
      if (config.headers) options.requestInit = { headers: config.headers };
      return new SSEClientTransport(new URL(config.url), options);
    }
    case "streamable-http": {
      if (!config.url) throw new Error("streamable-http MCP server requires a url");
      const options: ConstructorParameters<typeof StreamableHTTPClientTransport>[1] = {};
      if (config.headers) options.requestInit = { headers: config.headers };
      return new StreamableHTTPClientTransport(new URL(config.url), options);
    }
  }
}

export async function listBindings(
  connections: Array<{ serverName: string; client: McpClientLike; config: McpServerConfig }>,
): Promise<McpToolBinding[]> {
  const discovered = await Promise.all(
    connections.map(async ({ serverName, client, config }) => ({
      serverName,
      client,
      config,
      tools: ((await client.listTools()).tools as McpToolInfo[]),
    })),
  );

  const counts = new Map<string, number>();
  for (const group of discovered) {
    for (const tool of group.tools) {
      counts.set(tool.name, (counts.get(tool.name) ?? 0) + 1);
    }
  }

  return discovered.flatMap(({ serverName, client, config, tools }) =>
    tools.map((tool) => ({
      serverName,
      effectiveName: resolveEffectiveToolName(serverName, tool.name, counts, config.toolPrefix),
      originalName: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      client,
    })),
  );
}

export function resolveEffectiveToolName(
  serverName: string,
  toolName: string,
  counts: Map<string, number>,
  explicitPrefix?: string,
): string {
  if (explicitPrefix) return `${explicitPrefix}${toolName}`;
  if ((counts.get(toolName) ?? 0) > 1) return `${sanitizeName(serverName)}__${toolName}`;
  return toolName;
}

export async function executeBinding(
  binding: McpToolBinding,
  args: Record<string, unknown>,
): Promise<{ content: PiToolContent[]; details: Record<string, unknown>; isError: boolean }> {
  const result = (await binding.client.callTool({ name: binding.originalName, arguments: args })) as McpCallToolResult;
  const content = mcpResultToPiContent(result);
  return {
    content,
    details: {
      serverName: binding.serverName,
      toolName: binding.originalName,
      structuredContent: result.structuredContent,
    },
    isError: result.isError === true,
  };
}

export function mcpResultToPiContent(result: McpCallToolResult): PiToolContent[] {
  const output: PiToolContent[] = [];

  for (const item of result.content ?? []) {
    switch (item.type) {
      case "text":
        output.push({ type: "text", text: item.text });
        break;
      case "image":
        output.push({ type: "image", data: item.data, mimeType: item.mimeType });
        break;
      case "audio":
        output.push({ type: "text", text: `[audio ${item.mimeType}, ${item.data.length} bytes base64]` });
        break;
      case "resource":
        if (typeof item.resource.text === "string") {
          output.push({ type: "text", text: `Resource ${item.resource.uri}\n\n${item.resource.text}` });
        } else {
          output.push({
            type: "text",
            text: `Resource ${item.resource.uri} (${item.resource.mimeType ?? "unknown mime"}) returned binary content.`,
          });
        }
        break;
      case "resource_link":
        output.push({
          type: "text",
          text: `Resource link: ${item.name} (${item.uri})${item.description ? `\n${item.description}` : ""}`,
        });
        break;
    }
  }

  if (output.length === 0 && result.structuredContent) {
    output.push({ type: "text", text: JSON.stringify(result.structuredContent, null, 2) });
  }

  if (output.length === 0) {
    output.push({ type: "text", text: "MCP tool returned no content." });
  }

  return output;
}

export function summarizeBindings(bindings: McpToolBinding[]): string {
  if (bindings.length === 0) return "No MCP tools connected";
  const grouped = new Map<string, string[]>();
  for (const binding of bindings) {
    const list = grouped.get(binding.serverName) ?? [];
    list.push(binding.effectiveName);
    grouped.set(binding.serverName, list);
  }
  return [...grouped.entries()]
    .map(([server, tools]) => `${server}: ${tools.sort().join(", ")}`)
    .join(" | ");
}

function sanitizeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]+/g, "_");
}
