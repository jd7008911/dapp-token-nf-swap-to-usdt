import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const { ethers } = await network.connect();

  // Read deployed contract address
  const deployedPath = path.join(import.meta.dirname, "../frontend/src/contracts/deployed.json");
  const { tokenAddress } = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));

  const token = await ethers.getContractAt("Token", tokenAddress);
  const [deployer] = await ethers.getSigners();
  const decimals = await token.decimals();

  const recipient = "0xbC432e6482cFEcc8B198aD082f9209113748A3a5";
  const amount = ethers.parseUnits("100000", decimals); // 100,000 NF

  console.log("Token at:", tokenAddress);
  console.log("From:", deployer.address);
  console.log("To:", recipient);
  console.log("Amount: 100,000 NF");

  const tx = await token.transfer(recipient, amount);
  await tx.wait();

  console.log("\n✅ Transfer complete!");
  console.log("Recipient balance:", ethers.formatUnits(await token.balanceOf(recipient), decimals), "NF");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
