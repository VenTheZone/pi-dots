# Install

For AI agents: follow these steps to install pi-coding-agent and its extensions for the user.

## 1. Install pi

```bash
npm install -g @mariozechner/pi-coding-agent
```

## 2. Copy skills

```bash
mkdir -p ~/.pi/agent/skills

# Core skills (12)
cp -r pi-dotfiles/skills/* ~/.pi/agent/skills/

# Optional: niche skills (33)
cp -r pi-dotfiles-niche-skills/skills/* ~/.pi/agent/skills/

# Optional: specialist skills (16)
cp -r pi-dotfiles-specialist-skills/skills/* ~/.pi/agent/skills/
```

Or pick individual skills:

```bash
cp -r pi-dotfiles/skills/tdd-workflow ~/.pi/agent/skills/
```

## 3. Add extensions to settings

Open `~/.pi/agent/settings.json` and add the packages you want to the `packages` array:

```json
{
  "packages": [
    "/absolute/path/to/pi-dotfiles",
    "/absolute/path/to/pi-coding-dynamic-pruning",
    "/absolute/path/to/pi-mcp-access",
    "/absolute/path/to/pi-agents",
    "/absolute/path/to/pi-dynamic-model-providers"
  ]
}
```

Only include the packages you actually cloned. Each package adds features:

| Package | What it adds |
|---------|-------------|
| `pi-dotfiles` | Skills, prompts, MCP config |
| `pi-coding-dynamic-pruning` | Auto-prune stale tool outputs, compress old messages with `/dcp`, context nudges |
| `pi-mcp-access` | MCP bridge extension |
| `pi-agents` | Subagent definitions |
| `pi-dynamic-model-providers` | OpenRouter, Kilo Gateway providers |

## 4. Copy settings and MCP config (optional)

```bash
cp pi-dotfiles/.pi/settings.json ~/.pi/agent/
cp pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

## 5. Install dependencies and build extensions

```bash
cd pi-coding-dynamic-pruning && npm install && npm run build
cd ../pi-mcp-access && npm install && npm run build
```

## 6. Verify

```bash
pi --eval "/mcp tools"
```

After starting pi, you should see the extensions in the footer. For dynamic pruning, run `/dcp status` to confirm it loaded.
