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

  it("Should deploy with correct rate and pool balances", async function () {
    const { swap } = await deploySwap();
    expect(await swap.rate()).to.equal(RATE);
    expect(await swap.poolNFBalance()).to.equal(ethers.parseUnits("100000", 18));
    expect(await swap.poolUSDTBalance()).to.equal(ethers.parseUnits("100000", 6));
  });

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

  it("Should fail swap if pool has insufficient USDT", async function () {
    const { nf, swap, user, swapAddr } = await deploySwap();

    // Try to swap way more NF than pool can cover
    const hugeAmount = ethers.parseUnits("999999999", 18);
    await nf.connect(user).approve(swapAddr, hugeAmount);

    await expect(
      swap.connect(user).swapNFtoUSDT(hugeAmount)
    ).to.be.revertedWith("Insufficient USDT in pool");
  });

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

  it("Should calculate amounts correctly", async function () {
    const { swap } = await deploySwap();

    // 100 NF at rate 10000 = 1 USDT (1000000 smallest units / 1000000 = 1)
    const nfAmount = ethers.parseUnits("100", 18);
    expect(await swap.getUSDTAmount(nfAmount)).to.equal(ethers.parseUnits("1", 6));

    // 1 USDT at rate 10000 = 100 NF
    const usdtAmount = ethers.parseUnits("1", 6);
    expect(await swap.getNFAmount(usdtAmount)).to.equal(ethers.parseUnits("100", 18));
  });
});
