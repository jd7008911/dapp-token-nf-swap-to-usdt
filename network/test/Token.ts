import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Token", function () {
  const INITIAL_SUPPLY = 1000000n;
  const DECIMALS = 18n;
  const TOTAL_SUPPLY = INITIAL_SUPPLY * 10n ** DECIMALS;

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

  it("Should fail if sender has insufficient balance", async function () {
    const [, addr1, addr2] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    // addr1 has 0 tokens, should fail
    await expect(
      token.connect(addr1).transfer(addr2.address, 1n)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("Should approve and check allowance", async function () {
    const [owner, spender] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", [INITIAL_SUPPLY]);

    const amount = 500n * 10n ** DECIMALS;
    await expect(token.approve(spender.address, amount))
      .to.emit(token, "Approval")
      .withArgs(owner.address, spender.address, amount);

    expect(await token.allowance(owner.address, spender.address)).to.equal(amount);
  });

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
});
