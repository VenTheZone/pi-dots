import assert from "node:assert/strict";
import test from "node:test";
import { matchesGlob } from "../src/glob.js";

test("matchesGlob handles recursive globs", () => {
  assert.equal(matchesGlob("src/a.ts", "src/*.ts"), true);
  assert.equal(matchesGlob("src/nested/a.ts", "src/*.ts"), false);
  assert.equal(matchesGlob("src/nested/a.ts", "src/**/*.ts"), true);
  assert.equal(matchesGlob("secrets/.env", "secrets/**"), true);
  assert.equal(matchesGlob("foo/bar/baz.txt", "foo/**/baz.txt"), true);
});
