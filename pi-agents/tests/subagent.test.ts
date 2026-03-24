import assert from "node:assert/strict";
import test from "node:test";
import subagentExtension from "../src/index.js";

test("subagent extension registers the subagent tool", async () => {
  let registeredTool: any;
  subagentExtension({
    registerTool(tool: any) {
      registeredTool = tool;
    },
  } as any);

  assert.ok(registeredTool);
  assert.equal(registeredTool.name, "subagent");

  const result = await registeredTool.execute(
    "tool-call-id",
    {},
    undefined,
    undefined,
    { cwd: process.cwd(), hasUI: false } as any,
  );

  assert.equal(result.content[0]?.type, "text");
  assert.match(result.content[0]?.text ?? "", /Available agents:/);
  assert.match(result.content[0]?.text ?? "", /planner \(package\)/);
});
