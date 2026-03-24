---
description: MEV bot development patterns and best practices from TheBigSandwich project
---

# /mev-bot - MEV Bot Development

Load MEV bot development patterns for building cryptocurrency trading bots (sandwich, arbitrage, front-running).

## Usage

```
/mev-bot                    # Load skill and patterns
/mev-bot --scanner          # Focus on mempool scanner patterns
/mev-bot --executor         # Focus on transaction executor patterns
/mev-bot --config           # Focus on configuration patterns
```

## When to Use

- Building sandwich attack bots
- Implementing arbitrage strategies
- Creating mempool scanners
- Adding DEX integrations (PancakeSwap, Uniswap, SushiSwap)
- Setting up Go-Rust IPC communication
- Configuring multi-RPC failover

## Patterns Loaded

From TheBigSandwich git history:

1. **RPC Failover** - Multi-endpoint with rate limiting
2. **Multi-Source Pool Resolution** - DexScreener, DexPaprika, RPC
3. **Sandwich Attack Execution** - Front-run/back-run detection
4. **YAML Configuration** - Type-safe Go structs with YAML tags
5. **Go-Rust IPC** - Unix socket communication
6. **Dynamic Token Registry** - External API fetching with caching

## Key Components

```
internal/
├── scanner/      # Mempool monitoring
├── executor/    # Transaction execution
├── verifier/    # Pool reserves, profit validation
├── config/      # YAML configuration
├── pools/       # DEX pool data
├── tokens/      # Token registry
├── opportunity/ # Strategy detection
├── decoder/     # Transaction decoding
└── crypto/      # Key management
```

## Example Config

```yaml
network:
  name: "BNB Smart Chain"
  chain_id: 56

rpcs:
  mempool:
    - url: "https://bsc-dataseed.binance.org"
      weight: 100
    - url: "https://public.rpc.binance.org"
      weight: 50
  sending:
    - url: "https://rpc.ankr.com/bsc"
      weight: 100

mev:
  mode: "sandwich"
  min_profit_usd: 10.0
  max_gas_price_gwei: 50
```

## Related Skills

- `security-review` - For securing wallet/keystore handling
- `golang-patterns` - For Go code patterns
