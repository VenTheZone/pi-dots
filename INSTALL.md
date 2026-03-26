# Install Guide

## Quick install (one line)

```bash
curl -fsSL https://raw.githubusercontent.com/VenTheZone/pi-dots/main/scripts/install-global-full.sh | bash
```

## Manual install

### 1. Install pi

```bash
npm install -g @mariozechner/pi-coding-agent
```

### 2. Clone this repo

```bash
git clone https://github.com/VenTheZone/pi-dots.git
cd pi-dots
```

### 3. Run install script

```bash
# Full install (core + niche + specialist skills)
./scripts/install-global-full.sh

# Or core only
./scripts/install-global.sh
```

The script will:
- Create `~/.pi/agent/settings.json` with package paths
- Register MCP access, agents, and dynamic model providers
- Copy skill files to `~/.pi/agent/skills/`

## Verify it works

```bash
# Check packages loaded
pi --eval "/mcp tools"

# Should show: Context7, JCodeMunch, + 31 tools

# Check models
pi --eval "/provider-models status"

# Should show: openrouter:50 | kilo-gateway:200 | ...
```

## Usage

```bash
# Start pi in a project
pi

# Or run a quick task
pi -p "Create a hello world script"
```

## Customizing

Edit `~/.pi/agent/settings.json` to:
- Change default model
- Enable/disable packages
- Adjust MCP settings

## Uninstall

Just remove the packages from `~/.pi/agent/settings.json`:

```json
{
  "packages": []
}
```

The skill files in `~/.pi/agent/skills/` can be deleted if you want a clean slate.