import { describe, it, expect } from "vitest";
import {
  TOKEN_ADDRESS,
  USDT_ADDRESS,
  SWAP_ADDRESS,
  HARDHAT_RPC_URL,
  TOKEN_ABI,
  USDT_ABI,
  SWAP_ABI,
} from "../contracts/token";

describe("contracts/token.ts — contract config", () => {
  describe("deployed addresses", () => {
    it("exports a valid TOKEN_ADDRESS", () => {
      expect(TOKEN_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("exports a valid USDT_ADDRESS", () => {
      expect(USDT_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("exports a valid SWAP_ADDRESS", () => {
      expect(SWAP_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("each address is unique", () => {
      const addrs = [TOKEN_ADDRESS, USDT_ADDRESS, SWAP_ADDRESS];
      expect(new Set(addrs).size).toBe(3);
    });
  });

  describe("HARDHAT_RPC_URL", () => {
    it("points to localhost:8545", () => {
      expect(HARDHAT_RPC_URL).toBe("http://127.0.0.1:8545");
    });
  });

  describe("TOKEN_ABI", () => {
    const fnNames = TOKEN_ABI.filter((e) => e.type === "function").map(
      (e) => (e as any).name
    );

    it("includes standard ERC-20 read functions", () => {
      expect(fnNames).toContain("name");
      expect(fnNames).toContain("symbol");
      expect(fnNames).toContain("decimals");
      expect(fnNames).toContain("totalSupply");
      expect(fnNames).toContain("balanceOf");
      expect(fnNames).toContain("allowance");
    });

    it("includes standard ERC-20 write functions", () => {
      expect(fnNames).toContain("transfer");
      expect(fnNames).toContain("transferFrom");
      expect(fnNames).toContain("approve");
    });

    it("includes Transfer and Approval events", () => {
      const events = TOKEN_ABI.filter((e) => e.type === "event").map(
        (e) => (e as any).name
      );
      expect(events).toContain("Transfer");
      expect(events).toContain("Approval");
    });
  });

  describe("USDT_ABI", () => {
    const fnNames = USDT_ABI.filter((e) => e.type === "function").map(
      (e) => (e as any).name
    );

    it("includes balanceOf, decimals, symbol", () => {
      expect(fnNames).toContain("balanceOf");
      expect(fnNames).toContain("decimals");
      expect(fnNames).toContain("symbol");
    });

    it("includes transfer and approve", () => {
      expect(fnNames).toContain("transfer");
      expect(fnNames).toContain("approve");
    });
  });

  describe("SWAP_ABI", () => {
    const fnNames = SWAP_ABI.filter((e) => e.type === "function").map(
      (e) => (e as any).name
    );

    it("includes swap functions", () => {
      expect(fnNames).toContain("swapNFtoUSDT");
      expect(fnNames).toContain("swapUSDTtoNF");
    });

    it("includes preview functions", () => {
      expect(fnNames).toContain("getUSDTAmount");
      expect(fnNames).toContain("getNFAmount");
    });

    it("includes pool query functions", () => {
      expect(fnNames).toContain("poolNFBalance");
      expect(fnNames).toContain("poolUSDTBalance");
      expect(fnNames).toContain("rate");
    });
  });
});
