import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const sender = "0x10d3a31f95bDCD6351162856fA11885bE8e677d5";
  const receiver = "0x2746E95D04c1A508B1e0618E62709208ab772f7E";

  // Deploy the token
  const Token = await ethers.getContractFactory("Token");
  const initialSupply = 1000000;
  const token = await Token.deploy(initialSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token deployed to:", tokenAddress);

  // Get deployer (has all the tokens)
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Check balances before transfer
  const decimals = await token.decimals();
  const balanceBefore = await token.balanceOf(deployer.address);
  console.log("\n--- Before Transfer ---");
  console.log("Deployer balance:", ethers.formatUnits(balanceBefore, decimals), "NF");
  console.log("Sender balance:", ethers.formatUnits(await token.balanceOf(sender), decimals), "NF");
  console.log("Receiver balance:", ethers.formatUnits(await token.balanceOf(receiver), decimals), "NF");

  // Transfer 10,000 tokens to sender first (so sender has tokens)
  const amountToSender = ethers.parseUnits("10000", decimals);
  const tx1 = await token.transfer(sender, amountToSender);
  await tx1.wait();
  console.log("\n✅ Transferred 10,000 NF from deployer to sender");

  // Now impersonate the sender to transfer to receiver
  const senderSigner = await ethers.getImpersonatedSigner(sender);

  // Fund sender with ETH for gas
  await deployer.sendTransaction({ to: sender, value: ethers.parseEther("1") });

  // Transfer 5,000 tokens from sender to receiver
  const amountToReceiver = ethers.parseUnits("5000", decimals);
  const tx2 = await token.connect(senderSigner).transfer(receiver, amountToReceiver);
  await tx2.wait();
  console.log("✅ Transferred 5,000 NF from sender to receiver");

  // Check balances after transfer
  console.log("\n--- After Transfer ---");
  console.log("Sender  :", ethers.formatUnits(await token.balanceOf(sender), decimals), "NF");
  console.log("Receiver:", ethers.formatUnits(await token.balanceOf(receiver), decimals), "NF");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
