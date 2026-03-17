import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Token", function () {
  const INITIAL_SUPPLY = 1000000n;
  const DECIMALS = 18n;
  const TOTAL_SUPPLY = INITIAL_SUPPLY * 10n ** DECIMALS;

  // ── Deployment ────────────────────────────────────────────────────

  it("Should deploy with correct name and symbol", async function () {
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);
    expect(await token.name()).to.equal("Nacjia Fog");
    expect(await token.symbol()).to.equal("NF");
    expect(await token.decimals()).to.equal(DECIMALS);
  });

  it("Should assign total supply to deployer", async function () {
    const [owner] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
    expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
  });

  it("Should set totalSupply to zero when initialSupply is zero", async function () {
    const token = await ethers.deployContract("Token", [0n]);
    expect(await token.totalSupply()).to.equal(0n);
  });

  // ── Transfer ──────────────────────────────────────────────────────

  it("Should transfer tokens between accounts", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    const amount = 1000n * 10n ** DECIMALS;
    await expect(token.transfer(recipient.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY - amount);
  });

  it("Should allow transfer of zero tokens", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    await expect(token.transfer(recipient.address, 0n))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, recipient.address, 0n);
  });

  it("Should fail if sender has insufficient balance", async function () {
    const [, addr1, addr2] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    // addr1 has 0 tokens, should fail
    await expect(
      token.connect(addr1).transfer(addr2.address, 1n)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("Should transfer the entire balance", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    await token.transfer(recipient.address, TOTAL_SUPPLY);
    expect(await token.balanceOf(owner.address)).to.equal(0n);
    expect(await token.balanceOf(recipient.address)).to.equal(TOTAL_SUPPLY);
  });

  // ── Approve & Allowance ───────────────────────────────────────────

  it("Should approve and check allowance", async function () {
    const [owner, spender] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    const amount = 500n * 10n ** DECIMALS;
    await expect(token.approve(spender.address, amount))
      .to.emit(token, "Approval")
      .withArgs(owner.address, spender.address, amount);

    expect(await token.allowance(owner.address, spender.address)).to.equal(amount);
  });

  it("Should overwrite approval with a new value", async function () {
    const [, spender] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    await token.approve(spender.address, 1000n);
    await token.approve(spender.address, 500n);
    expect(await token.allowance((await ethers.getSigners())[0].address, spender.address)).to.equal(500n);
  });

  it("Should allow approval of zero tokens", async function () {
    const [owner, spender] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    await token.approve(spender.address, 1000n);
    await token.approve(spender.address, 0n);
    expect(await token.allowance(owner.address, spender.address)).to.equal(0n);
  });

  // ── transferFrom ──────────────────────────────────────────────────

  it("Should transferFrom after approval", async function () {
    const [owner, spender, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    const amount = 200n * 10n ** DECIMALS;
    await token.approve(spender.address, amount);

    await expect(token.connect(spender).transferFrom(owner.address, recipient.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.allowance(owner.address, spender.address)).to.equal(0n);
  });

  it("Should reduce allowance after partial transferFrom", async function () {
    const [owner, spender, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    const approved = 1000n * 10n ** DECIMALS;
    const spent = 400n * 10n ** DECIMALS;
    await token.approve(spender.address, approved);
    await token.connect(spender).transferFrom(owner.address, recipient.address, spent);

    expect(await token.allowance(owner.address, spender.address)).to.equal(approved - spent);
  });

  it("Should fail transferFrom if allowance exceeded", async function () {
    const [owner, spender, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    const approved = 100n * 10n ** DECIMALS;
    const attempted = 200n * 10n ** DECIMALS;
    await token.approve(spender.address, approved);

    await expect(
      token.connect(spender).transferFrom(owner.address, recipient.address, attempted)
    ).to.be.revertedWith("Allowance exceeded");
  });

  it("Should fail transferFrom if owner has insufficient balance", async function () {
    const [owner, spender, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    // Transfer all tokens away, then try transferFrom
    await token.transfer(recipient.address, TOTAL_SUPPLY);
    await token.approve(spender.address, TOTAL_SUPPLY);

    await expect(
      token.connect(spender).transferFrom(owner.address, recipient.address, 1n)
    ).to.be.revertedWith("Insufficient balance");
  });
});
