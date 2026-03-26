# pi-dots

Quick setup for pi-coding-agent.

---

## What to copy

### Core (12 skills + settings)

```bash
mkdir -p ~/.pi/agent/skills
cp -r pi-dotfiles/skills/* ~/.pi/agent/skills/
cp pi-dotfiles/.pi/settings.json ~/.pi/agent/
cp pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

### Optional: More skills

```bash
# 34 niche skills (Docker, Python, Go, etc.)
cp -r pi-dotfiles-niche-skills/skills/* ~/.pi/agent/skills/

# 16 specialist roles
cp -r pi-dotfiles-specialist-skills/skills/* ~/.pi/agent/skills/
```

### Optional: Dynamic model providers

```bash
# For OpenRouter or Kilo Gateway support
cp examples/dynamic-model-providers.global.example.json ~/.pi/agent/dynamic-model-providers.json
```

---

## Packages (optional)

If you want packages registered in settings:

```bash
# Edit ~/.pi/agent/settings.json and add:
"packages": [
  "/path/to/pi-dots/pi-dotfiles",
  "/path/to/pi-dots/pi-mcp-access",
  "/path/to/pi-dots/pi-agents",
  "/path/to/pi-dots/pi-dynamic-model-providers"
]
```

Then run:
```bash
pi install ./pi-dotfiles
pi install ./pi-mcp-access
# etc
```

---

## Verify

```bash
pi --eval "/mcp tools"
```