import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("NFSwap", function () {
  const NF_SUPPLY = 1000000n;
  const USDT_SUPPLY = 1000000n; // 1M USDT
  const RATE = 10000n; // 1 NF = 0.01 USDT (10000 in 6 decimals)

  async function deploySwap() {
    const [owner, user] = await ethers.getSigners();

    const nf = await ethers.deployContract("Token", [NF_SUPPLY]);
    const usdt = await ethers.deployContract("MockUSDT", [USDT_SUPPLY]);
    const swap = await ethers.deployContract("NFSwap", [
      await nf.getAddress(),
      await usdt.getAddress(),
      RATE,
    ]);

    const swapAddr = await swap.getAddress();

    // Fund the swap pool: 100,000 NF + 100,000 USDT
    const nfFund = ethers.parseUnits("100000", 18);
    const usdtFund = ethers.parseUnits("100000", 6);
    await nf.transfer(swapAddr, nfFund);
    await usdt.transfer(swapAddr, usdtFund);

    // Give user some NF and USDT for testing
    const userNF = ethers.parseUnits("1000", 18);
    const userUSDT = ethers.parseUnits("1000", 6);
    await nf.transfer(user.address, userNF);
    await usdt.transfer(user.address, userUSDT);

    return { nf, usdt, swap, owner, user, swapAddr };
  }

  // ── Deployment ────────────────────────────────────────────────────

  it("Should deploy with correct rate and pool balances", async function () {
    const { swap } = await deploySwap();
    expect(await swap.rate()).to.equal(RATE);
    expect(await swap.poolNFBalance()).to.equal(ethers.parseUnits("100000", 18));
    expect(await swap.poolUSDTBalance()).to.equal(ethers.parseUnits("100000", 6));
  });

  it("Should set owner to deployer", async function () {
    const { swap, owner } = await deploySwap();
    expect(await swap.owner()).to.equal(owner.address);
  });

  // ── Swap NF → USDT ───────────────────────────────────────────────

  it("Should swap NF → USDT", async function () {
    const { nf, usdt, swap, user, swapAddr } = await deploySwap();

    // User approves swap contract to spend NF
    const nfAmount = ethers.parseUnits("100", 18); // 100 NF
    await nf.connect(user).approve(swapAddr, nfAmount);

    // Expected USDT: 100 NF * 0.01 = 1 USDT
    const expectedUSDT = ethers.parseUnits("1", 6);
    const usdtBefore = await usdt.balanceOf(user.address);

    await expect(swap.connect(user).swapNFtoUSDT(nfAmount))
      .to.emit(swap, "Swapped");

    const usdtAfter = await usdt.balanceOf(user.address);
    expect(usdtAfter - usdtBefore).to.equal(expectedUSDT);
  });

  it("Should decrease NF balance and increase pool NF after NF → USDT swap", async function () {
    const { nf, swap, user, swapAddr } = await deploySwap();

    const nfAmount = ethers.parseUnits("100", 18);
    const nfBefore = await nf.balanceOf(user.address);
    const poolNFBefore = await swap.poolNFBalance();

    await nf.connect(user).approve(swapAddr, nfAmount);
    await swap.connect(user).swapNFtoUSDT(nfAmount);

    expect(await nf.balanceOf(user.address)).to.equal(nfBefore - nfAmount);
    expect(await swap.poolNFBalance()).to.equal(poolNFBefore + nfAmount);
  });

  it("Should fail NF → USDT swap without approval", async function () {
    const { swap, user } = await deploySwap();
    const nfAmount = ethers.parseUnits("100", 18);

    await expect(
      swap.connect(user).swapNFtoUSDT(nfAmount)
    ).to.revert(ethers);
  });

  it("Should fail swap if pool has insufficient USDT", async function () {
    const { nf, swap, user, swapAddr } = await deploySwap();

    // Try to swap way more NF than pool can cover
    const hugeAmount = ethers.parseUnits("999999999", 18);
    await nf.connect(user).approve(swapAddr, hugeAmount);

    await expect(
      swap.connect(user).swapNFtoUSDT(hugeAmount)
    ).to.be.revertedWith("Insufficient USDT in pool");
  });

  // ── Swap USDT → NF ───────────────────────────────────────────────

  it("Should swap USDT → NF", async function () {
    const { nf, usdt, swap, user, swapAddr } = await deploySwap();

    // User approves swap contract to spend USDT
    const usdtAmount = ethers.parseUnits("10", 6); // 10 USDT
    await usdt.connect(user).approve(swapAddr, usdtAmount);

    // Expected NF: 10 USDT / 0.01 = 1000 NF
    const expectedNF = ethers.parseUnits("1000", 18);
    const nfBefore = await nf.balanceOf(user.address);

    await expect(swap.connect(user).swapUSDTtoNF(usdtAmount))
      .to.emit(swap, "Swapped");

    const nfAfter = await nf.balanceOf(user.address);
    expect(nfAfter - nfBefore).to.equal(expectedNF);
  });

  it("Should fail USDT → NF swap without approval", async function () {
    const { swap, user } = await deploySwap();
    const usdtAmount = ethers.parseUnits("10", 6);

    await expect(
      swap.connect(user).swapUSDTtoNF(usdtAmount)
    ).to.revert(ethers);
  });

  it("Should fail swap if pool has insufficient NF", async function () {
    const { usdt, swap, user, swapAddr } = await deploySwap();

    const hugeUSDT = ethers.parseUnits("999999999", 6);
    await usdt.connect(user).approve(swapAddr, hugeUSDT);

    await expect(
      swap.connect(user).swapUSDTtoNF(hugeUSDT)
    ).to.be.revertedWith("Insufficient NF in pool");
  });

  // ── Rate Management ───────────────────────────────────────────────

  it("Should allow owner to update rate", async function () {
    const { swap, owner } = await deploySwap();

    const newRate = 50000n; // 1 NF = 0.05 USDT
    await expect(swap.setRate(newRate))
      .to.emit(swap, "RateUpdated")
      .withArgs(RATE, newRate);

    expect(await swap.rate()).to.equal(newRate);
  });

  it("Should not allow non-owner to update rate", async function () {
    const { swap, user } = await deploySwap();

    await expect(
      swap.connect(user).setRate(50000n)
    ).to.be.revertedWith("Not owner");
  });

  it("Should reject zero rate", async function () {
    const { swap } = await deploySwap();

    await expect(
      swap.setRate(0n)
    ).to.be.revertedWith("Rate must be > 0");
  });

  it("Should use updated rate for subsequent swaps", async function () {
    const { nf, usdt, swap, user, swapAddr } = await deploySwap();

    // Change rate to 1 NF = 1 USDT (1_000_000)
    await swap.setRate(1000000n);

    const nfAmount = ethers.parseUnits("100", 18);
    await nf.connect(user).approve(swapAddr, nfAmount);

    const usdtBefore = await usdt.balanceOf(user.address);
    await swap.connect(user).swapNFtoUSDT(nfAmount);
    const usdtAfter = await usdt.balanceOf(user.address);

    // 100 NF * 1 USDT = 100 USDT
    expect(usdtAfter - usdtBefore).to.equal(ethers.parseUnits("100", 6));
  });

  // ── Preview Calculations ──────────────────────────────────────────

  it("Should calculate amounts correctly", async function () {
    const { swap } = await deploySwap();

    // 100 NF at rate 10000 = 1 USDT (1000000 smallest units / 1000000 = 1)
    const nfAmount = ethers.parseUnits("100", 18);
    expect(await swap.getUSDTAmount(nfAmount)).to.equal(ethers.parseUnits("1", 6));

    // 1 USDT at rate 10000 = 100 NF
    const usdtAmount = ethers.parseUnits("1", 6);
    expect(await swap.getNFAmount(usdtAmount)).to.equal(ethers.parseUnits("100", 18));
  });

  it("Should return zero for zero-amount preview", async function () {
    const { swap } = await deploySwap();
    expect(await swap.getUSDTAmount(0n)).to.equal(0n);
    expect(await swap.getNFAmount(0n)).to.equal(0n);
  });

  // ── Owner Withdraw ────────────────────────────────────────────────

  it("Should allow owner to withdraw tokens from pool", async function () {
    const { nf, swap, owner } = await deploySwap();

    const withdrawAmount = ethers.parseUnits("1000", 18);
    const ownerBefore = await nf.balanceOf(owner.address);

    await expect(swap.withdraw(await nf.getAddress(), withdrawAmount))
      .to.emit(swap, "Withdrawn");

    expect(await nf.balanceOf(owner.address)).to.equal(ownerBefore + withdrawAmount);
  });

  it("Should not allow non-owner to withdraw", async function () {
    const { nf, swap, user } = await deploySwap();

    await expect(
      swap.connect(user).withdraw(await nf.getAddress(), 1n)
    ).to.be.revertedWith("Not owner");
  });
});
