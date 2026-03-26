# Install

## 1. Install pi

```bash
npm install -g @mariozechner/pi-coding-agent
```

## 2. Copy files

```bash
# Core skills (12)
mkdir -p ~/.pi/agent/skills
cp -r pi-dotfiles/skills/* ~/.pi/agent/skills/

# Settings
cp pi-dotfiles/.pi/settings.json ~/.pi/agent/
cp pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

## 3. Verify

```bash
pi --eval "/mcp tools"
```

---

## Optional extras

```bash
# More skills
cp -r pi-dotfiles-niche-skills/skills/* ~/.pi/agent/skills/
cp -r pi-dotfiles-specialist-skills/skills/* ~/.pi/agent/skills/

# Model providers
cp examples/dynamic-model-providers.global.example.json ~/.pi/agent/dynamic-model-providers.json
```