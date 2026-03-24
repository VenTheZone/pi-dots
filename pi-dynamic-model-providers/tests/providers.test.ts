import test from "node:test";
import assert from "node:assert/strict";
import { formatPriceLabel } from "../src/providers.js";
import { mergeConfig, DEFAULT_CONFIG } from "../src/config.js";

test("mergeConfig merges provider overrides", () => {
  const merged = mergeConfig(DEFAULT_CONFIG, {
    cacheTtlHours: 6,
    providers: {
      openrouter: {
        maxModels: 20,
      },
      "cline-proxy": {
        enabled: true,
        baseUrl: "http://localhost:4000/v1",
      },
    },
  });

  assert.equal(merged.cacheTtlHours, 6);
  assert.equal(merged.providers?.openrouter?.maxModels, 20);
  assert.equal(merged.providers?.["cline-proxy"]?.enabled, true);
  assert.equal(merged.providers?.["cline-proxy"]?.baseUrl, "http://localhost:4000/v1");
});

test("formatPriceLabel marks free models", () => {
  assert.equal(formatPriceLabel({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }), "free");
});

test("formatPriceLabel renders per-million token pricing", () => {
  assert.equal(formatPriceLabel({ input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }), "$3/$15");
  assert.equal(formatPriceLabel({ input: 0.4, output: 2, cacheRead: 0, cacheWrite: 0 }), "$0.4/$2");
});

test("formatPriceLabel handles unknown pricing", () => {
  assert.equal(formatPriceLabel({ input: Number.NaN, output: Number.NaN, cacheRead: 0, cacheWrite: 0 }), "price unknown");
});
