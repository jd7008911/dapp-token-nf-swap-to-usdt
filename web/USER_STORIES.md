# User Stories & Test Matrix — NFSwap DeFi Frontend

This document defines the **user stories** (what the user wants to do) and the
**acceptance criteria** (how we know it works), mapped directly to unit tests.

---

## Story 1 — Connect to Hardhat Node

> **As a** developer,
> **I want** to connect to my local Hardhat node with one click,
> **so that** I can interact with deployed contracts without MetaMask.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 1.1 | "Connect to Hardhat" button is visible before connection | `App.spec.ts` | *shows the Connect button when not connected* |
| 1.2 | After clicking Connect, account section appears | `App.spec.ts` | *shows Account card after connecting* |
| 1.3 | Status message confirms connection | `App.spec.ts` | *shows status message after connection* |
| 1.4 | Account selector is populated with Hardhat accounts | `App.spec.ts` | *populates the account selector with mock accounts* |
| 1.5 | Token name, symbol, and supply are displayed | `App.spec.ts` | *displays token info after connecting* |

---

## Story 2 — View Token Information

> **As a** user,
> **I want** to see the token name, symbol, total supply, and my balances,
> **so that** I know the current state of my holdings.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 2.1 | Token Info section shows name, symbol after connect | `App.spec.ts` | *displays token info after connecting* |
| 2.2 | Contract address is shown in the header | `App.spec.ts` | *displays the contract address* |
| 2.3 | Network badge says "Local Hardhat Network" | `App.spec.ts` | *shows the network badge* |

---

## Story 3 — Transfer NF Tokens

> **As a** user,
> **I want** to send NF tokens from one account to another,
> **so that** I can distribute tokens for testing.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 3.1 | Transfer section has From, To, Amount fields | `App.spec.ts` | *renders Transfer Tokens section* |
| 3.2 | Amount defaults to 100 | `App.spec.ts` | *pre-fills the Transfer amount input* |
| 3.3 | Transfer button exists and is clickable | `App.spec.ts` | *has a Transfer button* |
| 3.4 | Clicking Transfer sends the transaction | `App.spec.ts` | *clicking Transfer triggers the transfer flow* |

---

## Story 4 — Approve Spender Allowance

> **As a** user,
> **I want** to approve another address to spend my NF tokens,
> **so that** smart contracts (e.g. the swap contract) can move tokens on my behalf.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 4.1 | Approve Spender section is rendered | `App.spec.ts` | *renders Approve Spender section* |
| 4.2 | Approve button exists | `App.spec.ts` | *has an Approve button* |

---

## Story 5 — Check Token Balance / Allowance

> **As a** user,
> **I want** to check the NF balance or allowance for any address,
> **so that** I can verify token state without using a block explorer.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 5.1 | Check Balance section is rendered | `App.spec.ts` | *renders Check Balance section* |
| 5.2 | Check Allowance section is rendered | `App.spec.ts` | *renders Check Allowance section* |
| 5.3 | Check buttons exist | `App.spec.ts` | *has a Check (allowance) button* |

---

## Story 6 — Swap NF ↔ USDT

> **As a** user,
> **I want** to swap NF for USDT (or vice-versa) using the on-chain liquidity pool,
> **so that** I can convert between tokens at the pool rate.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 6.1 | Swap section renders with pool info | `App.spec.ts` | *renders Swap NF ↔ USDT section*, *shows pool info in swap section* |
| 6.2 | Direction toggle (NF→USDT / USDT→NF) exists | `App.spec.ts` | *has NF → USDT and USDT → NF toggle buttons* |
| 6.3 | Swap button executes the two-step flow (approve + swap) | `App.spec.ts` | *clicking Swap executes the swap flow* |
| 6.4 | Completed swap appears in transaction history | `App.spec.ts` | *swap transaction appears in history after successful swap* |
| 6.5 | History section hidden when no swaps yet | `App.spec.ts` | *does NOT show swap history when no swaps have occurred* |

---

## Story 7 — Withdraw (Send) USDT

> **As a** user,
> **I want** to send USDT to any wallet address (including TRON addresses),
> **so that** I can transfer USDT off the local network for testing.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 7.1 | Withdraw USDT section is rendered | `App.spec.ts` | *renders Withdraw USDT section* |
| 7.2 | Send USDT button exists | `App.spec.ts` | *renders the Send USDT button* |
| 7.3 | Available balance hint is shown | `App.spec.ts` | *shows 'Available:' USDT balance hint* |
| 7.4 | Clicking Send USDT triggers withdraw | `App.spec.ts` | *clicking Send USDT triggers withdraw flow* |

---

## Story 8 — Contract Configuration Integrity

> **As a** developer,
> **I want** the deployed addresses, ABIs, and RPC URL to be correct,
> **so that** the frontend connects to the right contracts.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 8.1 | TOKEN_ADDRESS is a valid Ethereum address | `token.spec.ts` | *exports a valid TOKEN_ADDRESS* |
| 8.2 | USDT_ADDRESS is a valid Ethereum address | `token.spec.ts` | *exports a valid USDT_ADDRESS* |
| 8.3 | SWAP_ADDRESS is a valid Ethereum address | `token.spec.ts` | *exports a valid SWAP_ADDRESS* |
| 8.4 | All addresses are unique | `token.spec.ts` | *each address is unique* |
| 8.5 | RPC URL = http://127.0.0.1:8545 | `token.spec.ts` | *points to localhost:8545* |
| 8.6 | TOKEN_ABI has all ERC-20 read + write functions | `token.spec.ts` | *includes standard ERC-20 read/write functions* |
| 8.7 | TOKEN_ABI has Transfer & Approval events | `token.spec.ts` | *includes Transfer and Approval events* |
| 8.8 | USDT_ABI has balanceOf, decimals, transfer, approve | `token.spec.ts` | *includes balanceOf, decimals, symbol* + *includes transfer and approve* |
| 8.9 | SWAP_ABI has swap, preview, and pool-query functions | `token.spec.ts` | *includes swap/preview/pool query functions* |

---

## Running Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-run on file changes)
pnpm test:watch

# With coverage report
pnpm test:coverage
```

## Test Architecture

```
src/
  __mocks__/
    ethers.ts          ← Mocks for ethers.js (JsonRpcProvider, Contract, etc.)
  __tests__/
    token.spec.ts      ← Contract config & ABI tests (Story 8)
    App.spec.ts        ← Component tests (Stories 1–7)
```

### Why Mock ethers.js?

Unit tests must run **fast, offline, and deterministically**. The real
`ethers.js` library needs a running Hardhat node and real RPC calls. By
replacing it with a mock:

- Tests run in < 1 second with no network dependency
- Every function returns predictable values
- We test **our code's logic**, not the blockchain

### Testing Patterns Used

| Pattern | Purpose |
|---------|---------|
| `vi.mock("ethers", ...)` | Replace real ethers with predictable stubs |
| `mount()` + `flushPromises()` | Render Vue component and wait for async effects |
| `wrapper.find()` / `findAll()` | Query DOM elements to assert UI state |
| `trigger("click")` | Simulate user interactions |
| `beforeEach` | Fresh component for each test (isolation) |
| Describe blocks | Group tests by feature / user story |
