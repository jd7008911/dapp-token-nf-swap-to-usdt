/**
 * Mock for ethers.js — used by Vitest to isolate unit tests from real RPC calls.
 *
 * Every function/class the app imports from "ethers" is stubbed here so that
 * component tests never hit the network.
 */
import { vi } from "vitest";

// ── helpers for building mock contract instances ────────────────────
export function createMockContract(overrides: Record<string, any> = {}) {
  return {
    name: vi.fn().mockResolvedValue("Nacjia Fog"),
    symbol: vi.fn().mockResolvedValue("NF"),
    decimals: vi.fn().mockResolvedValue(18n),
    totalSupply: vi.fn().mockResolvedValue(1000000n * 10n ** 18n),
    balanceOf: vi.fn().mockResolvedValue(500n * 10n ** 18n),
    allowance: vi.fn().mockResolvedValue(0n),
    transfer: vi.fn().mockResolvedValue({ hash: "0xmocktxhash", wait: vi.fn().mockResolvedValue({}) }),
    approve: vi.fn().mockResolvedValue({ hash: "0xmockapprove", wait: vi.fn().mockResolvedValue({}) }),
    transferFrom: vi.fn().mockResolvedValue({ hash: "0xmocktxfrom", wait: vi.fn().mockResolvedValue({}) }),

    // Swap-specific
    poolNFBalance: vi.fn().mockResolvedValue(10000n * 10n ** 18n),
    poolUSDTBalance: vi.fn().mockResolvedValue(5000n * 10n ** 6n),
    rate: vi.fn().mockResolvedValue(500000n), // 0.5 USDT
    getUSDTAmount: vi.fn().mockResolvedValue(50n * 10n ** 6n),
    getNFAmount: vi.fn().mockResolvedValue(100n * 10n ** 18n),
    swapNFtoUSDT: vi.fn().mockResolvedValue({ hash: "0xswaphash1", wait: vi.fn().mockResolvedValue({}) }),
    swapUSDTtoNF: vi.fn().mockResolvedValue({ hash: "0xswaphash2", wait: vi.fn().mockResolvedValue({}) }),
    ...overrides,
  };
}

// ── mock accounts ──────────────────────────────────────────────────
const MOCK_ACCOUNTS = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
];

// ── mock signer ────────────────────────────────────────────────────
const mockSigner = {
  address: MOCK_ACCOUNTS[0],
  getAddress: vi.fn().mockResolvedValue(MOCK_ACCOUNTS[0]),
};

// ── JsonRpcProvider ────────────────────────────────────────────────
export class JsonRpcProvider {
  constructor(_url?: string) {}

  listAccounts = vi.fn().mockResolvedValue(
    MOCK_ACCOUNTS.map((addr) => ({ address: addr }))
  );

  getSigner = vi.fn().mockResolvedValue(mockSigner);

  getBalance = vi.fn().mockResolvedValue(10000000000000000000n); // 10 ETH
}

// ── Contract ───────────────────────────────────────────────────────
export class Contract {
  [key: string]: any;

  constructor(
    public address: string,
    _abi: any,
    _signerOrProvider?: any,
  ) {
    const mock = createMockContract();
    Object.assign(this, mock);
  }
}

// ── utility re-exports ─────────────────────────────────────────────
export function formatUnits(value: bigint | number | string, decimals: number): string {
  const v = BigInt(value);
  const d = BigInt(decimals);
  const divisor = 10n ** d;
  const intPart = v / divisor;
  const fracPart = v % divisor;
  if (fracPart === 0n) return intPart.toString();
  const fracStr = fracPart.toString().padStart(Number(d), "0").replace(/0+$/, "");
  return `${intPart}.${fracStr}`;
}

export function parseUnits(value: string, decimals: number): bigint {
  const parts = value.split(".");
  const intPart = parts[0] || "0";
  const fracPart = (parts[1] || "").padEnd(decimals, "0").slice(0, decimals);
  return BigInt(intPart + fracPart);
}

export function getAddress(addr: string): string {
  return addr; // passthrough for tests
}
