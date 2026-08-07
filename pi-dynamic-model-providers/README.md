# pi-dynamic-model-providers

Dynamic model provider extension for `pi-coding-agent`.

Fetches model catalogs from live endpoints, caches results locally, and registers providers at runtime inside pi.

## Providers

| Provider | Source | Models |
|----------|--------|--------|
| `cline` | [api.cline.bot/api/v1/ai/cline/models](https://api.cline.bot/api/v1/ai/cline/models) | All Cline models (500+) + 3 static free models |
| `kilo-gateway` | [api.kilo.ai/api/gateway](https://api.kilo.ai/api/gateway) | Free models via Kilo's gateway (`kilo-auto/free` + `*:free` tier) |

### Cline free models

Cline documents three free models ([docs.cline.bot/api/models](https://docs.cline.bot/api/models)):

- `minimax/minimax-m2.5` — MiniMax M2.5 Free (1M context)
- `kwaipilot/kat-coder-pro` — KAT Coder Pro (32K context)
- `z-ai/glm-5` — GLM-5 Free (128K context)

These are registered as static models so they're always available, even if the model list fetch fails.

### Kilo Gateway

`kilo-gateway` points pi at `https://api.kilo.ai/api/gateway` and exposes only the free tier:

- `kilo-auto/free` — auto-routes to the cheapest free model available (default)
- every `:free` model served by the gateway (DeepSeek, Nemotron, Llama, Poolside, Qwen, etc.)

Auth is an OAuth bearer token. The config reads it from `~/.pi/agent/auth.json` under the `kilo-gateway` key at runtime, so no key is committed to the repo. To store a key instead, set the `KILO_API_KEY` environment variable.

## Model display

Model names show pricing and context info at a glance:

```
MiniMax: MiniMax M2.5 (FREE | ctx:1M out:33K)
Anthropic: Claude Sonnet 4.6 ($3/$15 | ctx:200K out:16K)
```

- **FREE** — zero-cost models (show first in lists)
- **$X/$Y** — cost per million tokens (input/output)
- **ctx:N** — input context window
- **out:N** — max output tokens

Context is abbreviated: `128K`, `1M`, etc.

## Config files

| File | Purpose |
|------|---------|
| `.pi/dynamic-model-providers.json` | Project-level overrides |
| `~/.pi/agent/dynamic-model-providers.json` | Global config |

Project config overrides global config. Both are optional — built-in defaults cover all providers.

## API keys

Set the environment variable for the provider:

```bash
export CLINE_API_KEY="your-cline-key"
```

Or configure in the global config file:

```json
{
  "providers": {
    "cline": { "apiKey": "CLINE_API_KEY" }
  }
}
```

## Commands

| Command | What it does |
|---------|-------------|
| `/provider-models status` | Show loaded provider counts and sources |
| `/provider-models refresh` | Force a fresh fetch from all endpoints |
| `/provider-models list` | List all models across providers |
| `/provider-models list cline` | List models for one provider |
| `/add-model` | **Interactive wizard** — add a custom endpoint (no JSON editing needed) |

## Adding a custom endpoint

```
/add-model
```

The wizard will guide you step by step:

1. **Endpoint base URL** — paste the base URL of your API, e.g. `https://api.my-server.com/v1`.
   The wizard does not ask you to type `/models` — it appends that itself.

2. **Model auto-discovery** — the wizard probes these paths in order:

   ```
   {url}/v1/models
   {url}/models
   {url}/openai/v1/models
   {url}/api/v1/models
   ```

   If one of them responds, models are auto-detected with their:
   - **id** and **display name**
   - **context window** (from `context_length`, `context_window`, or `max_input_tokens`)
   - **max output tokens** (from `max_tokens` or `max_output_tokens`)
   - **reasoning support** (from `supported_parameters`)
   - **image input** (from `architecture.input_modalities`)

   You then pick which models to keep via a selector.
   Select the first option to add all of them.

   If no /models endpoint is reachable, the wizard falls back to a **manual
   entry** — you type the model id and name yourself.

3. **API key** (optional if your server does not need one).
   If you enter a key it is saved to `~/.pi/agent/auth.json`.

4. **Provider id and display name** — derived from the URL hostname.
   Edit them if you want something different.

5. **Confirmation** — the wizard summarises the entry and asks you to confirm.

### Files written

| File | Content |
|------|---------|
| `~/.pi/agent/models.json` | New provider entry (merged with existing content) |
| `~/.pi/agent/auth.json` | API key, if you entered one |

After the wizard finishes run:

```
/provider-models refresh
```

to load the new models. They also appear automatically on the next session start.

### Example models.json entry created by the wizard

```json
{
  "providers": {
    "foo-ai-compatible": {
      "baseUrl": "https://api.foo.ai/v1",
      "api": "openai-completions",
      "authHeader": true,
      "displayName": "Foo AI (Custom)",
      "apiKey": "FOO_API_KEY",
      "models": [
        {
          "id": "model-a",
          "name": "Model A",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 16384
        }
      ]
    }
  }
}
```

## Cache

Models are cached to `~/.pi/agent/cache/dynamic-model-providers-cache.json` with a configurable TTL (default 12 hours). If a fetch fails, stale cache is used as fallback.

## How it works

1. On session start, check cache freshness
2. If stale or expired, fetch from each provider's model endpoint
3. Parse model metadata (pricing, context window, capabilities)
4. Sort free models first, label with pricing info
5. Register providers and models inside pi
6. Cache results to disk
