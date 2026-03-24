#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PI_DIR="${HOME}/.pi/agent"
MCP_CONFIG_PATH="${PI_DIR}/mcp.json"
EXAMPLE_MCP_CONFIG="${ROOT_DIR}/examples/mcp.global.example.json"

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
for dir in pi-mcp-access pi-agents; do
  echo "--> $dir"
  (cd "$dir" && npm install)
done

echo "==> Installing local pi packages"
pi install ./pi-dotfiles -l
pi install ./pi-mcp-access -l
pi install ./pi-agents -l

mkdir -p "$PI_DIR"
if [[ ! -f "$MCP_CONFIG_PATH" ]]; then
  cp "$EXAMPLE_MCP_CONFIG" "$MCP_CONFIG_PATH"
  echo "Wrote global MCP config to $MCP_CONFIG_PATH"
else
  echo "Global MCP config already exists at $MCP_CONFIG_PATH"
  echo "Review or merge this example if needed: $EXAMPLE_MCP_CONFIG"
fi

cat <<EOF

Global install complete.

Installed local pi packages:
  - pi-dotfiles
  - pi-mcp-access
  - pi-agents

Global MCP config:
  $MCP_CONFIG_PATH

Configured MCP servers:
  - Context7
  - Exa
  - JCodeMunch

You can now run pi in any project. If you want the repo-local project config,
run pi from:
  $ROOT_DIR/pi-dotfiles
EOF
