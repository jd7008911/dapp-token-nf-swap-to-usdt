# User Stories & Test Matrix — NFSwap Smart Contracts

This document defines the **user stories** and **acceptance criteria** for the
Solidity smart contracts, mapped directly to the Hardhat/Mocha integration tests.

---

## Story 1 — Deploy NF Token (ERC-20)

> **As a** project deployer,
> **I want** to deploy the NF token with a configurable initial supply,
> **so that** it follows the ERC-20 standard and all tokens go to my wallet.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 1.1 | Token name is "Nacjia Fog" | `Token.ts` | *Should deploy with correct name and symbol* |
| 1.2 | Token symbol is "NF" | `Token.ts` | *Should deploy with correct name and symbol* |
| 1.3 | Decimals = 18 | `Token.ts` | *Should deploy with correct name and symbol* |
| 1.4 | Total supply = initialSupply × 10^18 | `Token.ts` | *Should assign total supply to deployer* |
| 1.5 | Deployer holds entire supply | `Token.ts` | *Should assign total supply to deployer* |
| 1.6 | Zero initial supply is valid | `Token.ts` | *Should set totalSupply to zero when initialSupply is zero* |

---

## Story 2 — Transfer NF Tokens

> **As a** token holder,
> **I want** to transfer NF tokens to another address,
> **so that** I can distribute or trade tokens.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 2.1 | Transfer moves tokens and updates balances | `Token.ts` | *Should transfer tokens between accounts* |
| 2.2 | Transfer emits Transfer event | `Token.ts` | *Should transfer tokens between accounts* |
| 2.3 | Transfer of zero tokens succeeds | `Token.ts` | *Should allow transfer of zero tokens* |
| 2.4 | Transfer of entire balance succeeds | `Token.ts` | *Should transfer the entire balance* |
| 2.5 | Transfer fails with insufficient balance | `Token.ts` | *Should fail if sender has insufficient balance* |

---

## Story 3 — Approve & Delegated Transfer (NF)

> **As a** token holder,
> **I want** to approve a spender to transfer tokens on my behalf,
> **so that** smart contracts can interact with my tokens (e.g., swap).

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 3.1 | Approve sets allowance and emits Approval event | `Token.ts` | *Should approve and check allowance* |
| 3.2 | New approval overwrites the old value | `Token.ts` | *Should overwrite approval with a new value* |
| 3.3 | Approving zero resets allowance | `Token.ts` | *Should allow approval of zero tokens* |
| 3.4 | transferFrom moves tokens and reduces allowance | `Token.ts` | *Should transferFrom after approval* |
| 3.5 | Partial transferFrom reduces allowance correctly | `Token.ts` | *Should reduce allowance after partial transferFrom* |
| 3.6 | transferFrom fails when allowance exceeded | `Token.ts` | *Should fail transferFrom if allowance exceeded* |
| 3.7 | transferFrom fails when owner has insufficient balance | `Token.ts` | *Should fail transferFrom if owner has insufficient balance* |

---

## Story 4 — Deploy MockUSDT (Stablecoin)

> **As a** project deployer,
> **I want** to deploy a mock USDT token with 6 decimals,
> **so that** I can simulate stablecoin interactions on testnets.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 4.1 | Name = "Tether USD", Symbol = "USDT", Decimals = 6 | `MockUSDT.ts` | *Should deploy with correct name, symbol, and 6 decimals* |
| 4.2 | Deployer holds all supply | `MockUSDT.ts` | *Should assign total supply to deployer* |
| 4.3 | Transfer works and emits event | `MockUSDT.ts` | *Should transfer USDT between accounts* |
| 4.4 | Transfer fails with insufficient balance | `MockUSDT.ts` | *Should fail transfer with insufficient balance* |
| 4.5 | Approve + transferFrom works | `MockUSDT.ts` | *Should approve and allow transferFrom* |
| 4.6 | transferFrom fails when allowance exceeded | `MockUSDT.ts` | *Should fail transferFrom if allowance exceeded* |

---

## Story 5 — Deploy NFSwap Liquidity Pool

> **As a** project deployer,
> **I want** to deploy a swap contract with a configurable exchange rate,
> **so that** users can swap NF ↔ USDT at a fixed rate.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 5.1 | Pool deploys with correct rate and balances | `NFSwap.ts` | *Should deploy with correct rate and pool balances* |
| 5.2 | Owner is set to deployer | `NFSwap.ts` | *Should set owner to deployer* |

---

## Story 6 — Swap NF → USDT

> **As a** user,
> **I want** to exchange my NF tokens for USDT,
> **so that** I can convert to a stablecoin at the pool rate.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 6.1 | User receives correct USDT amount | `NFSwap.ts` | *Should swap NF → USDT* |
| 6.2 | Swap emits Swapped event | `NFSwap.ts` | *Should swap NF → USDT* |
| 6.3 | User NF decreases, pool NF increases | `NFSwap.ts` | *Should decrease NF balance and increase pool NF after NF → USDT swap* |
| 6.4 | Fails without prior approval | `NFSwap.ts` | *Should fail NF → USDT swap without approval* |
| 6.5 | Fails if pool has insufficient USDT | `NFSwap.ts` | *Should fail swap if pool has insufficient USDT* |

---

## Story 7 — Swap USDT → NF

> **As a** user,
> **I want** to exchange USDT for NF tokens,
> **so that** I can acquire NF at the pool rate.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 7.1 | User receives correct NF amount | `NFSwap.ts` | *Should swap USDT → NF* |
| 7.2 | Swap emits Swapped event | `NFSwap.ts` | *Should swap USDT → NF* |
| 7.3 | Fails without prior approval | `NFSwap.ts` | *Should fail USDT → NF swap without approval* |
| 7.4 | Fails if pool has insufficient NF | `NFSwap.ts` | *Should fail swap if pool has insufficient NF* |

---

## Story 8 — Manage Exchange Rate

> **As the** pool owner,
> **I want** to update the NF/USDT exchange rate,
> **so that** I can adjust pricing as market conditions change.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 8.1 | Owner can update rate (emits RateUpdated) | `NFSwap.ts` | *Should allow owner to update rate* |
| 8.2 | Non-owner cannot update rate | `NFSwap.ts` | *Should not allow non-owner to update rate* |
| 8.3 | Zero rate is rejected | `NFSwap.ts` | *Should reject zero rate* |
| 8.4 | New rate is used in subsequent swaps | `NFSwap.ts` | *Should use updated rate for subsequent swaps* |

---

## Story 9 — Preview Swap Amounts

> **As a** user,
> **I want** to preview how much I'll receive before swapping,
> **so that** I can make informed decisions.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 9.1 | getUSDTAmount and getNFAmount return correct values | `NFSwap.ts` | *Should calculate amounts correctly* |
| 9.2 | Zero input returns zero output | `NFSwap.ts` | *Should return zero for zero-amount preview* |

---

## Story 10 — Owner Withdraws Pool Funds

> **As the** pool owner,
> **I want** to withdraw tokens from the pool,
> **so that** I can manage liquidity.

### Acceptance Criteria

| # | Criterion | Test file | Test name |
|---|-----------|-----------|-----------|
| 10.1 | Owner can withdraw (emits Withdrawn) | `NFSwap.ts` | *Should allow owner to withdraw tokens from pool* |
| 10.2 | Non-owner cannot withdraw | `NFSwap.ts` | *Should not allow non-owner to withdraw* |

---

## Running Tests

```bash
# Run all contract tests
pnpm test

# Or directly via Hardhat
npx hardhat test
```

## Test Architecture

```
test/
├── Token.ts       ← NF Token tests (Stories 1-3)
├── MockUSDT.ts    ← Mock stablecoin tests (Story 4)
└── NFSwap.ts      ← Swap contract tests (Stories 5-10)
```

### Testing Patterns Used

| Pattern | Purpose |
|---------|---------|
| `ethers.deployContract()` | Deploys a fresh contract per test (isolation) |
| `deploySwap()` fixture | Reusable setup: deploy all 3 contracts + fund pool + fund user |
| `.to.emit(contract, "Event")` | Assert Solidity events fire correctly |
| `.to.be.revertedWith("...")` | Assert require()/revert error messages |
| `BigInt` literals (`1000n`) | Precise handling of uint256 values |
| `parseUnits` / `formatUnits` | Convert between human-readable and chain decimals |
