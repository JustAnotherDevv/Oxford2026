const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log("Deploying with:", deployer.address);

  // 1. HonkVerifier (real proof verification)
  const HonkVerifier = await ethers.getContractFactory("HonkVerifier");
  const verifier = await HonkVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddr = await verifier.getAddress();
  console.log("HonkVerifier:", verifierAddr);

  // 2. MockERC20
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("MockERC20:", tokenAddr);

  // 3. MockKYBRegistry
  const MockKYBRegistry = await ethers.getContractFactory("MockKYBRegistry");
  const kyb = await MockKYBRegistry.deploy();
  await kyb.waitForDeployment();
  const kybAddr = await kyb.getAddress();
  console.log("MockKYBRegistry:", kybAddr);

  // 4. PrivatePool
  const PrivatePool = await ethers.getContractFactory("PrivatePool");
  const pool = await PrivatePool.deploy(verifierAddr, tokenAddr, kybAddr);
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("PrivatePool:", poolAddr);

  // 5. Approve first 5 Hardhat accounts for KYB + mint tokens
  const mintAmount = ethers.parseEther("1000000");
  const numAccounts = Math.min(5, signers.length);
  for (let i = 0; i < numAccounts; i++) {
    const addr = signers[i].address;
    await kyb.approve(addr);
    await token.mint(addr, mintAmount);
    console.log(`KYB approved + minted ${ethers.formatEther(mintAmount)} MTK for account ${i}: ${addr}`);
  }

  console.log("\n--- Copy to frontend/.env ---");
  console.log(`VITE_PRIVATE_POOL_ADDRESS=${poolAddr}`);
  console.log(`VITE_TOKEN_ADDRESS=${tokenAddr}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
