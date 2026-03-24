import assert from "node:assert/strict";
import test from "node:test";
import { discoverAgents, getPackageAgentsDir } from "../src/agents.js";

test("getPackageAgentsDir resolves bundled agent directory", () => {
  const dir = getPackageAgentsDir();
  assert.ok(dir);
  assert.match(dir ?? "", /pi-agents[\\/]agents$/);
});

test("discoverAgents includes bundled package agents", () => {
  const result = discoverAgents(process.cwd(), "user");
  const planner = result.agents.find((agent) => agent.name === "planner");
  const worker = result.agents.find((agent) => agent.name === "worker");
  const context7 = result.agents.find((agent) => agent.name === "context7-sdk-compliance");

  assert.ok(planner);
  assert.equal(planner?.source, "package");
  assert.deepEqual(planner?.tools, ["read", "grep", "find", "ls", "bash"]);

  assert.ok(worker);
  assert.equal(worker?.source, "package");
  assert.ok(worker?.tools?.includes("write"));
  assert.ok(worker?.tools?.includes("edit"));

  assert.ok(context7);
  assert.ok(context7?.tools?.includes("context7_query-docs"));
  assert.ok(context7?.tools?.includes("context7_resolve-library-id"));
});
