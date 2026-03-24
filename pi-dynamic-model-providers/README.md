# pi-dynamic-model-providers

Dynamic model provider extension for `pi-coding-agent`.

This package registers providers at runtime and refreshes their model lists from live endpoints with a local cache.

## Included providers

- `openrouter`
- `kilo-gateway`
- `cline-proxy`

## What it does

- fetches model catalogs dynamically
- caches results with a TTL
- registers providers and models inside pi at runtime
- labels model names with pricing when available
- labels zero-cost models as `free`
- falls back to stale cache if a provider is temporarily unavailable

## Config files

Project config:

- `.pi/dynamic-model-providers.json`

Global config:

- `~/.pi/agent/dynamic-model-providers.json`

Project config overrides global config.

## Commands

- `/provider-models status`
- `/provider-models refresh`
- `/provider-models list`
- `/provider-models list openrouter`

## Notes

- OpenRouter and Kilo model lists are fetched from their public model endpoints.
- `cline-proxy` is treated as a generic OpenAI-compatible provider and may need `modelOverrides` if its `/models` response is minimal.
- If pricing metadata is missing, models are labeled `price unknown`.
