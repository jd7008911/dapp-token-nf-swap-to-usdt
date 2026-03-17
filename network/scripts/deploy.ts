import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // 1. Deploy NF Token
  const Token = await ethers.getContractFactory("Token");
  const initialSupply = 1000000;
  const nf = await Token.deploy(initialSupply);
  await nf.waitForDeployment();
  const nfAddress = await nf.getAddress();
  console.log("NF Token deployed to:", nfAddress);

  // 2. Deploy Mock USDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdtSupply = 1000000; // 1M USDT
  const usdt = await MockUSDT.deploy(usdtSupply);
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  // 3. Deploy NFSwap (rate: 1 NF = 0.01 USDT = 10000 in 6 decimals)
  const NFSwap = await ethers.getContractFactory("NFSwap");
  const rate = 10000;
  const swap = await NFSwap.deploy(nfAddress, usdtAddress, rate);
  await swap.waitForDeployment();
  const swapAddress = await swap.getAddress();
  console.log("NFSwap deployed to:", swapAddress);

  // 4. Fund the swap pool
  const nfFund = ethers.parseUnits("100000", 18);   // 100K NF
  const usdtFund = ethers.parseUnits("100000", 6);  // 100K USDT
  await nf.transfer(swapAddress, nfFund);
  await usdt.transfer(swapAddress, usdtFund);
  console.log("Swap pool funded: 100,000 NF + 100,000 USDT");

  // 5. Write addresses to frontend config
  const configPath = path.join(import.meta.dirname, "../../web/src/contracts/deployed.json");
  fs.writeFileSync(configPath, JSON.stringify({
    tokenAddress: nfAddress,
    usdtAddress: usdtAddress,
    swapAddress: swapAddress,
  }, null, 2));
  console.log("All addresses written to frontend/src/contracts/deployed.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });