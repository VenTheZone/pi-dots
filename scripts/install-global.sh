#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PI_DIR="${HOME}/.pi/agent"
MCP_CONFIG_PATH="${PI_DIR}/mcp.json"
DYNAMIC_MODELS_CONFIG_PATH="${PI_DIR}/dynamic-model-providers.json"
EXAMPLE_MCP_CONFIG="${ROOT_DIR}/examples/mcp.global.example.json"
EXAMPLE_DYNAMIC_MODELS_CONFIG="${ROOT_DIR}/examples/dynamic-model-providers.global.example.json"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

need_cmd node
need_cmd npm
need_cmd pi
need_cmd uvx

cd "$ROOT_DIR"

echo "==> Installing npm dependencies needed by local packages"
for dir in pi-mcp-access pi-agents pi-dynamic-model-providers; do
  echo "--> $dir"
  (cd "$dir" && npm install)
done

echo "==> Installing core pi packages globally"
pi install ./pi-dotfiles
pi install ./pi-mcp-access
pi install ./pi-agents
pi install ./pi-dynamic-model-providers

mkdir -p "$PI_DIR"
if [[ ! -f "$MCP_CONFIG_PATH" ]]; then
  cp "$EXAMPLE_MCP_CONFIG" "$MCP_CONFIG_PATH"
  echo "Wrote global MCP config to $MCP_CONFIG_PATH"
else
  echo "Global MCP config already exists at $MCP_CONFIG_PATH"
  echo "Review or merge this example if needed: $EXAMPLE_MCP_CONFIG"
fi

if [[ ! -f "$DYNAMIC_MODELS_CONFIG_PATH" ]]; then
  cp "$EXAMPLE_DYNAMIC_MODELS_CONFIG" "$DYNAMIC_MODELS_CONFIG_PATH"
  echo "Wrote dynamic provider config to $DYNAMIC_MODELS_CONFIG_PATH"
else
  echo "Dynamic provider config already exists at $DYNAMIC_MODELS_CONFIG_PATH"
  echo "Review or merge this example if needed: $EXAMPLE_DYNAMIC_MODELS_CONFIG"
fi

cat <<EOF

Global install complete.

Installed global pi packages:
  - pi-dotfiles
  - pi-mcp-access
  - pi-agents
  - pi-dynamic-model-providers

Optional packages available but not installed by default:
  - pi-dotfiles-niche-skills
  - pi-dotfiles-specialist-skills

Global MCP config:
  $MCP_CONFIG_PATH

Dynamic provider config:
  $DYNAMIC_MODELS_CONFIG_PATH

Configured MCP servers:
  - Context7
  - JCodeMunch

Configured dynamic providers:
  - OpenRouter
  - Kilo Gateway
  - Cline proxy (disabled until configured)

To add the optional packages later:
  pi install ./pi-dotfiles-niche-skills
  pi install ./pi-dotfiles-specialist-skills

Or install everything in one step:
  npm run install-global-full

You can now run pi in any project. If you want the repo-local project config,
run pi from:
  $ROOT_DIR/pi-dotfiles
EOF
