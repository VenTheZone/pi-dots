# pi-dynamic-model-providers

Dynamic model provider extension for `pi-coding-agent`.

Fetches model catalogs from live endpoints, caches results locally, and registers providers at runtime inside pi.

## Providers

| Provider | Source | Models |
|----------|--------|--------|
| `openrouter` | [openrouter.ai/api/v1/models](https://openrouter.ai/api/v1/models) | All OpenRouter models (350+) |
| `kilo-gateway` | [api.kilo.ai/api/gateway/models](https://api.kilo.ai/api/gateway/models) | All Kilo Gateway models (350+) |
| `cline` | [api.cline.bot/api/v1/ai/cline/models](https://api.cline.bot/api/v1/ai/cline/models) | All Cline models (500+) + 3 static free models |
| `nvidia-nim` | [api.nvidia.com/v1/models](https://api.nvidia.com/v1/models) | All NVIDIA NIM models (e.g., Llama, Nemotron, Nemo) |

### Cline free models

Cline documents three free models ([docs.cline.bot/api/models](https://docs.cline.bot/api/models)):

- `minimax/minimax-m2.5` — MiniMax M2.5 Free (1M context)
- `kwaipilot/kat-coder-pro` — KAT Coder Pro Free (32K context)
- `z-ai/glm-5` — GLM-5 Free (128K context)

These are registered as static models so they're always available, even if the model list fetch fails.

## Provider Details

### NVIDIA NIM

- **Enabled by default**: `false` (explicit opt-in)
- **Endpoint**: `https://api.nvidia.com/v1`
- **Models endpoint**: `https://api.nvidia.com/v1/models`
- **Auth**: Bearer token (`NVIDIA_API_KEY`)
- **Pricing**: The NIM models endpoint does not return pricing information. Costs will appear as unknown (`$?/$?`). To display pricing, add `modelOverrides` with cost information in your config:

```json
{
  "providers": {
    "nvidia-nim": {
      "enabled": true,
      "modelOverrides": {
        "meta/llama-3-70b-instruct": {
          "cost": { "input": 0.35, "output": 0.50 }
        }
      }
    }
  }
}
```
- **Context windows**: Determined from `max_model_len` field with fallback to `defaultContextWindow` (128K).
- **Max output**: Determined from `max_output_tokens` or `max_tokens` with fallback to `defaultMaxTokens` (4096).

Get your NVIDIA API key from https://api.nvidia.com.

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

Set these environment variables for each provider:

```bash
export OPENROUTER_API_KEY="your-openrouter-key"
export KILO_API_KEY="your-kilo-key"
export CLINE_API_KEY="your-cline-key"
export NVIDIA_API_KEY="your-nvidia-key"
```

Or configure in the global config file:

```json
{
  "providers": {
    "openrouter": { "apiKey": "OPENROUTER_API_KEY" },
    "kilo-gateway": { "apiKey": "KILO_API_KEY" },
    "cline": { "apiKey": "CLINE_API_KEY" },
    "nvidia-nim": { "apiKey": "NVIDIA_API_KEY" }
  }
}
```

## Commands

| Command | What it does |
|---------|--------------|
| `/provider-models status` | Show loaded provider counts and sources |
| `/provider-models refresh` | Force a fresh fetch from all endpoints |
| `/provider-models list` | List all models across providers |
| `/provider-models list openrouter` | List models for one provider |

## Cache

Models are cached to `~/.pi/agent/cache/dynamic-model-providers-cache.json` with a configurable TTL (default 12 hours). If a fetch fails, stale cache is used as fallback.

## How it works

1. On session start, check cache freshness
2. If stale or expired, fetch from each provider's model endpoint
3. Parse model metadata (pricing, context window, capabilities)
4. Sort free models first, label with pricing info
5. Register providers and models inside pi
6. Cache results to disk
