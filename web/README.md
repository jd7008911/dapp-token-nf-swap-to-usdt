# NFSwap — DeFi Frontend

Web interface for the Nacjia Fog Token (NF) ecosystem running on a local Hardhat network. Swap NF ↔ USDT, transfer tokens, manage allowances, and withdraw USDT — all without MetaMask.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Vue 3 (`<script setup>` + Composition API) |
| Language | TypeScript 5.9 (strict) |
| Build | Vite 8 |
| Web3 | ethers.js 6 |
| Testing | Vitest 4 + Vue Test Utils + happy-dom |
| Coverage | @vitest/coverage-v8 |

## Prerequisites

- **Node.js** ≥ 18
- **pnpm**
- A running Hardhat node with deployed contracts (see `../network/`)

## Setup

```bash
pnpm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Type-check + production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run all unit tests once |
| `pnpm test:watch` | Run tests in watch mode (TDD) |
| `pnpm test:coverage` | Run tests with V8 coverage report |

## Project Structure

```
src/
├── App.vue                 # Main app — all DeFi features
├── main.ts                 # Vue entry point
├── style.css               # Global styles (dark theme)
├── global.d.ts             # Window.ethereum type declaration
├── contracts/
│   ├── deployed.json       # Deployed contract addresses
│   └── token.ts            # ABIs, addresses, RPC URL
├── __mocks__/
│   └── ethers.ts           # ethers.js mock for offline tests
└── __tests__/
    ├── token.spec.ts       # Contract config & ABI tests (13)
    └── App.spec.ts         # Component & interaction tests (29)
```

## Features

- **Connect** — Direct Hardhat RPC connection (no wallet extension needed)
- **Account Switcher** — Switch between all 20 Hardhat accounts
- **Transfer** — Send NF tokens between accounts
- **Approve / Allowance** — Manage ERC-20 spending allowances
- **Check Balance** — Query any address's NF balance
- **Swap NF ↔ USDT** — Two-step swap (approve → execute) with live preview
- **Withdraw USDT** — Send USDT to any address (supports TRON address conversion)
- **Swap History** — Real-time transaction log with timestamps and tx hashes

## Testing

Tests run fully offline with mocked ethers.js — no Hardhat node required.

```bash
pnpm test
```

```
 ✓ src/__tests__/token.spec.ts   (13 tests)
 ✓ src/__tests__/App.spec.ts     (29 tests)
 42 passed
```

See [USER_STORIES.md](USER_STORIES.md) for the full user story → test mapping.
