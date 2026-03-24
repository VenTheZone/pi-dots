#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_CHECKS="${RUN_CHECKS:-0}"

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

echo "==> Installing package dependencies"
for dir in pi-mcp-access pi-agents; do
  echo "--> $dir"
  (cd "$dir" && npm install)
done

if [[ "$RUN_CHECKS" == "1" ]]; then
  echo "==> Running checks"
  for dir in pi-mcp-access pi-agents; do
    echo "--> $dir"
    (cd "$dir" && npm run check)
  done
fi

cat <<EOF

Local setup complete.

Recommended next steps:
  cd "$ROOT_DIR/pi-dotfiles"
  pi

Inside pi-dotfiles, project-local settings will load:
  - ../            (pi-dotfiles package resources)
  - ../../pi-mcp-access
  - ../../pi-agents

Project MCP config is already present at:
  $ROOT_DIR/pi-dotfiles/.pi/mcp.json

That config enables:
  - Context7
  - Exa
  - JCodeMunch (via uvx jcodemunch-mcp)

Useful commands inside pi:
  /mcp tools
  /implement <task>
  /scout-and-plan <task>
  /implement-and-review <task>
EOF
