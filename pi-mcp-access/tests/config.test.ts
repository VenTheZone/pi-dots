import assert from "node:assert/strict";
import test from "node:test";
import { mergeConfig } from "../src/config.js";

test("mergeConfig merges server definitions", () => {
  const merged = mergeConfig(
    { servers: { context7: { transport: "streamable-http", url: "https://old" } } },
    {
      servers: {
        context7: { url: "https://new", headers: { Authorization: "Bearer token" } },
        local: { transport: "stdio", command: "npx", args: ["server.js"] },
      },
    },
  );

  assert.equal(merged.servers.context7?.transport, "streamable-http");
  assert.equal(merged.servers.context7?.url, "https://new");
  assert.equal(merged.servers.context7?.headers?.Authorization, "Bearer token");
  assert.equal(merged.servers.local?.transport, "stdio");
  assert.equal(merged.servers.local?.command, "npx");
  assert.deepEqual(merged.servers.local?.args, ["server.js"]);
});
