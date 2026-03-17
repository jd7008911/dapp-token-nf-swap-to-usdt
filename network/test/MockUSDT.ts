import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MockUSDT", function () {
  const INITIAL_SUPPLY = 1000000n;
  const DECIMALS = 6n;
  const TOTAL_SUPPLY = INITIAL_SUPPLY * 10n ** DECIMALS;

  // ── Deployment ────────────────────────────────────────────────────

  it("Should deploy with correct name, symbol, and 6 decimals", async function () {
    const usdt = await ethers.deployContract("MockUSDT", [INITIAL_SUPPLY]);
    expect(await usdt.name()).to.equal("Tether USD");
    expect(await usdt.symbol()).to.equal("USDT");
    expect(await usdt.decimals()).to.equal(DECIMALS);
  });

  it("Should assign total supply to deployer", async function () {
    const [owner] = await ethers.getSigners();
    const usdt = await ethers.deployContract("MockUSDT", [INITIAL_SUPPLY]);

    expect(await usdt.totalSupply()).to.equal(TOTAL_SUPPLY);
    expect(await usdt.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
  });

  // ── Transfer ──────────────────────────────────────────────────────

  it("Should transfer USDT between accounts", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const usdt = await ethers.deployContract("MockUSDT", [INITIAL_SUPPLY]);

    const amount = 500n * 10n ** DECIMALS;
    await expect(usdt.transfer(recipient.address, amount))
      .to.emit(usdt, "Transfer")
      .withArgs(owner.address, recipient.address, amount);

    expect(await usdt.balanceOf(recipient.address)).to.equal(amount);
  });

  it("Should fail transfer with insufficient balance", async function () {
    const [, addr1, addr2] = await ethers.getSigners();
    const usdt = await ethers.deployContract("MockUSDT", [INITIAL_SUPPLY]);

    await expect(
      usdt.connect(addr1).transfer(addr2.address, 1n)
    ).to.be.revertedWith("Insufficient balance");
  });

  // ── Approve & transferFrom ────────────────────────────────────────

  it("Should approve and allow transferFrom", async function () {
    const [owner, spender, recipient] = await ethers.getSigners();
    const usdt = await ethers.deployContract("MockUSDT", [INITIAL_SUPPLY]);

    const amount = 100n * 10n ** DECIMALS;
    await usdt.approve(spender.address, amount);
    expect(await usdt.allowance(owner.address, spender.address)).to.equal(amount);

    await expect(usdt.connect(spender).transferFrom(owner.address, recipient.address, amount))
      .to.emit(usdt, "Transfer")
      .withArgs(owner.address, recipient.address, amount);

    expect(await usdt.balanceOf(recipient.address)).to.equal(amount);
    expect(await usdt.allowance(owner.address, spender.address)).to.equal(0n);
  });

  it("Should fail transferFrom if allowance exceeded", async function () {
    const [owner, spender, recipient] = await ethers.getSigners();
    const usdt = await ethers.deployContract("MockUSDT", [INITIAL_SUPPLY]);

    await usdt.approve(spender.address, 50n);

    await expect(
      usdt.connect(spender).transferFrom(owner.address, recipient.address, 100n)
    ).to.be.revertedWith("Allowance exceeded");
  });
});
