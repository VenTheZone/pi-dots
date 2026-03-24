import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeBinding, listBindings, mcpResultToPiContent, resolveEffectiveToolName } from "../src/mcp.js";

test("listBindings preserves unique MCP tool names", async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = new McpServer({ name: "ctx", version: "1.0.0" });
  server.registerTool(
    "context7_query-docs",
    {
      description: "Query docs",
      inputSchema: { libraryId: z.string(), query: z.string() },
    },
    async ({ libraryId, query }) => ({
      content: [{ type: "text", text: `${libraryId}:${query}` }],
    }),
  );
  await server.connect(serverTransport);

  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);

  const bindings = await listBindings([{ serverName: "context7", client, config: { transport: "streamable-http" } }]);
  assert.equal(bindings.length, 1);
  assert.equal(bindings[0]?.effectiveName, "context7_query-docs");

  await client.close();
  await server.close();
});

test("executeBinding converts MCP result content", async () => {
  const fakeClient = {
    async listTools() {
      return { tools: [] };
    },
    async callTool() {
      return {
        content: [{ type: "text" as const, text: "hello from mcp" }],
        structuredContent: { ok: true },
        isError: false,
      };
    },
    async close() {},
  };

  const result = await executeBinding(
    {
      serverName: "context7",
      effectiveName: "context7_query-docs",
      originalName: "context7_query-docs",
      client: fakeClient,
    },
    { query: "react" },
  );

  assert.equal(result.isError, false);
  assert.equal(result.content[0]?.type, "text");
  assert.equal(result.content[0]?.text, "hello from mcp");
  assert.deepEqual(result.details.structuredContent, { ok: true });
});

test("mcpResultToPiContent falls back to structured content", () => {
  const content = mcpResultToPiContent({ structuredContent: { a: 1 } });
  assert.equal(content[0]?.type, "text");
  assert.match(content[0]?.text ?? "", /"a": 1/);
});

test("resolveEffectiveToolName applies explicit prefixes", () => {
  const counts = new Map<string, number>([["query-docs", 1]]);
  assert.equal(resolveEffectiveToolName("context7", "query-docs", counts, "context7_"), "context7_query-docs");
});
