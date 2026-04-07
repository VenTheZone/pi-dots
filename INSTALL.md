# Install

For AI agents: run these steps to install pi-coding-agent and its extensions for the user. Ask the user which packages they want before proceeding.

## Step 1: Clone to /tmp

```bash
cd /tmp && git clone https://github.com/VenTheZone/pi-dots.git && cd pi-dots
```

## Step 2: Ask the user what to install

Before installing, explain each package and ask which ones the user wants:

### Packages

**pi-dotfiles** — Core package. 12 foundational skills (TDD, security review, brainstorming, etc.), prompt templates, slash commands, and MCP config. Start here if unsure.

**pi-agents** — Subagent definitions (planner, worker, reviewer, scout, **external-scout**, etc.) for delegating tasks. Includes workflow prompts like `/implement-and-review` and `/external-scout-and-plan`.

**pi-dynamic-model-providers** — Dynamic model catalog fetcher. Adds OpenRouter (350+ models), Kilo Gateway (350+), **NVIDIA NIM** (requires API key), and Cline free models (MiniMax M2.5, KAT Coder Pro, GLM-5). Configure with API keys.

**pi-dotfiles-niche-skills** — **49 skills total** covering:
  - Languages: Go, Python, Java, C++
  - Frameworks: Django, Spring Boot
  - DevOps: Docker, deployment patterns
  - Databases: Postgres, ClickHouse, migrations
  - Security: hacker patterns, security scanning
  - **New**: AI research (deep-research, market-research, exa-search), content creation (brand-voice, content-engine, article-writing, crosspost), parallel orchestration (dmux-workflows), API design, and more.

**pi-dotfiles-specialist-skills** — 16 specialist roles (database reviewer, E2E runner, build error resolver, etc.).

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
    "/tmp/pi-dots/pi-agents",
    "/tmp/pi-dots/pi-mcp-access",
    "/tmp/pi-dots/pi-dynamic-model-providers",
    "/tmp/pi-dots/pi-dotfiles-niche-skills",
    "/tmp/pi-dots/pi-dotfiles-specialist-skills"
  ]
}
```

Only include what the user selected.

## Step 6: Copy MCP config (optional)

If the user wants MCP servers:

```bash
cp /tmp/pi-dots/pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

## Step 7: Build extensions (if needed)

Some packages require building:

```bash
cd /tmp/pi-dots/pi-mcp-access && npm install && npm run build
```

## Step 8: Verify

```bash
pi --eval "/mcp tools"
```

Start pi and check the footer for extension status. Test external scout:

```
/external-scout-and-plan Implement a simple Express rate limiter
```
