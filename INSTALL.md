# Install

For AI agents: run these steps to install pi-coding-agent and its extensions for the user. Ask the user which packages they want before proceeding.

## Step 1: Clone to /tmp

```bash
cd /tmp && git clone https://github.com/VenTheZone/pi-dots.git && cd pi-dots
```

## Step 2: Ask the user what to install

Before installing, explain each package and ask which ones the user wants:

### Packages

**pi-dotfiles** — Core package. 12 skills (TDD, security review, brainstorming, etc.), prompt templates, slash commands, and MCP config. Start here if unsure.

**pi-coding-dynamic-pruning** — Keeps context clean automatically. Deduplicates repeated tool calls, prunes stale file edits, and lets the model compress old conversation sections into summaries with `/dcp`. Includes context nudges when the window fills up.

**pi-mcp-access** — MCP bridge extension. Needed if the user wants to connect MCP servers.

**pi-agents** — Subagent definitions (planner, worker, reviewer, scout, etc.) for delegating tasks.

**pi-dynamic-model-providers** — Adds OpenRouter, Kilo Gateway, and other providers beyond the built-in ones.

**pi-dotfiles-niche-skills** — 33 extra skills for specific tech: Docker, Python, Go, Django, Spring Boot, Postgres, security scanning, and more.

**pi-dotfiles-specialist-skills** — 16 specialist roles like database reviewer, E2E runner, build error resolver.

After the user picks, continue with the steps below for each chosen package.

## Step 3: Install pi

```bash
npm install -g @mariozechner/pi-coding-agent
```

## Step 4: Copy skills

```bash
mkdir -p ~/.pi/agent/skills
cp -r /tmp/pi-dots/pi-dotfiles/skills/* ~/.pi/agent/skills/

# Optional: niche skills
cp -r /tmp/pi-dots/pi-dotfiles-niche-skills/skills/* ~/.pi/agent/skills/

# Optional: specialist skills
cp -r /tmp/pi-dots/pi-dotfiles-specialist-skills/skills/* ~/.pi/agent/skills/
```

Or pick individual skills:

```bash
cp -r /tmp/pi-dots/pi-dotfiles/skills/tdd-workflow ~/.pi/agent/skills/
```

## Step 5: Configure settings

Open `~/.pi/agent/settings.json` and add the packages the user chose to the `packages` array. Use the absolute paths from `/tmp/pi-dots/`:

```json
{
  "packages": [
    "/tmp/pi-dots/pi-dotfiles",
    "/tmp/pi-dots/pi-coding-dynamic-pruning",
    "/tmp/pi-dots/pi-mcp-access",
    "/tmp/pi-dots/pi-agents",
    "/tmp/pi-dots/pi-dynamic-model-providers"
  ]
}
```

Only include what the user selected.

## Step 6: Copy MCP config (optional)

If the user wants MCP servers:

```bash
cp /tmp/pi-dots/pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

## Step 7: Build extensions

For extensions that need building:

```bash
cd /tmp/pi-dots/pi-coding-dynamic-pruning && npm install && npm run build
cd /tmp/pi-dots/pi-mcp-access && npm install && npm run build
```

## Step 8: Verify

```bash
pi --eval "/mcp tools"
```

Start pi and check the footer for extension status. For dynamic pruning, run `/dcp status` to confirm it loaded.
