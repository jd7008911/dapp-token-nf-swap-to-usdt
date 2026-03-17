# NFSwap — Smart Contracts

Solidity smart contracts for the Nacjia Fog Token (NF) ecosystem: an ERC-20 token, a mock USDT stablecoin, and a fixed-rate swap pool — deployed on Hardhat.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Hardhat 3 |
| Language | Solidity 0.8.28 + TypeScript |
| Testing | Mocha + Chai + ethers.js 6 |
| Compiler | solc 0.8.28 |

## Contracts

| Contract | File | Description |
|----------|------|-------------|
| **Token** | `contracts/Token.sol` | ERC-20 "Nacjia Fog" (NF), 18 decimals |
| **MockUSDT** | `contracts/MockUSDT.sol` | Mock USDT stablecoin, 6 decimals |
| **NFSwap** | `contracts/NFSwap.sol` | Fixed-rate swap pool (NF ↔ USDT), owner-managed |

## Prerequisites

- **Node.js** ≥ 18
- **pnpm**

## Setup

```bash
pnpm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm compile` | Compile Solidity contracts |
| `pnpm test` | Run all smart contract tests |
| `pnpm node` | Start a local Hardhat node |
| `pnpm deploy:local` | Deploy all contracts to local node |
| `pnpm deploy:sepolia` | Deploy to Sepolia testnet |

## Project Structure

```
contracts/
├── Token.sol            # NF Token (ERC-20)
├── MockUSDT.sol         # Mock USDT (ERC-20, 6 decimals)
└── NFSwap.sol           # Swap pool with fixed rate
scripts/
├── deploy.ts            # Deploy all 3 contracts + fund pool
├── fund-wallet.ts       # Fund an external wallet with NF
└── transfer.ts          # Demo: transfer between accounts
test/
├── Token.ts             # 13 tests — ERC-20 token coverage
├── MockUSDT.ts          # 6 tests  — USDT stablecoin coverage
└── NFSwap.ts            # 16 tests — swap, rate, pool, access control
```

## Deployment Flow

1. Start a Hardhat node: `pnpm node`
2. Deploy contracts: `pnpm deploy:local`
3. The deploy script automatically:
   - Deploys Token, MockUSDT, and NFSwap
   - Funds the swap pool (100K NF + 100K USDT)
   - Writes addresses to `../web/src/contracts/deployed.json`

## Testing

```bash
pnpm test
```

**35 total tests** across 3 contract suites:

| Suite | Tests | Covers |
|-------|-------|--------|
| Token | 13 | Deploy, transfer, approve, transferFrom, edge cases |
| MockUSDT | 6 | Deploy, transfer, approve, transferFrom |
| NFSwap | 16 | Swap both directions, rate management, pool queries, access control, withdraw |

See [USER_STORIES.md](USER_STORIES.md) for the full user story → test mapping.

## Network Configuration

| Network | Type | Chain ID |
|---------|------|----------|
| `hardhat` | Local (EDR) | 1337 |
| `sepolia` | Testnet (HTTP) | — |

For Sepolia, set env vars in `.env`:
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
SEPOLIA_PRIVATE_KEY=your_private_key
```
