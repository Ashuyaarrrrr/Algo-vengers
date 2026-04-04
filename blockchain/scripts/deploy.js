// scripts/deploy.js  ── CommonJS
// ─────────────────────────────────────────────────────────────────
// Usage:
//   Terminal 1:  npx hardhat node
//   Terminal 2:  npx hardhat run scripts/deploy.js --network localhost
// ─────────────────────────────────────────────────────────────────
"use strict";

require("dotenv").config();
const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const line = "=".repeat(60);
  console.log(line);
  console.log("  HerbChain — Deployment Script");
  console.log(line);
  console.log("  Network  :", hre.network.name);
  console.log("  Deployer :", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("  Balance  :", hre.ethers.formatEther(balance), "ETH");
  console.log(line);

  // ── 1. Deploy Provenance (top-level contract — includes ALL functionality) ─
  console.log("\n[1/1] Deploying Provenance contract...");
  const Provenance = await hre.ethers.getContractFactory("Provenance");
  const provenance = await Provenance.deploy();
  await provenance.waitForDeployment();

  const contractAddress = await provenance.getAddress();
  console.log("  ✅  Provenance deployed at:", contractAddress);

  // ── 2. Grant all roles for testing ──────────────
  console.log("\n[Setup] Granting all roles to target wallet for local testing...");

  const TARGET_WALLET = "0x1758817E5150cd335309fe3BFBC14210CB43F723";
  console.log(`  Target Wallet: ${TARGET_WALLET}`);

  // Fetch roles directly from contract
  const COLLECTOR_ROLE    = await provenance.COLLECTOR_ROLE();
  const PROCESSOR_ROLE    = await provenance.PROCESSOR_ROLE();
  const LAB_ROLE          = await provenance.LAB_ROLE();
  const MANUFACTURER_ROLE = await provenance.MANUFACTURER_ROLE();
  const DISTRIBUTOR_ROLE  = await provenance.DISTRIBUTOR_ROLE();
  const RETAILER_ROLE     = await provenance.RETAILER_ROLE();

  const roleGrants = [
    ["COLLECTOR_ROLE",    COLLECTOR_ROLE],
    ["PROCESSOR_ROLE",    PROCESSOR_ROLE],
    ["LAB_ROLE",          LAB_ROLE],
    ["MANUFACTURER_ROLE", MANUFACTURER_ROLE],
    ["DISTRIBUTOR_ROLE",  DISTRIBUTOR_ROLE],
    ["RETAILER_ROLE",     RETAILER_ROLE],
  ];

  for (const [name, role] of roleGrants) {
    // Grant role to the TARGET_WALLET instead of deployer
    const tx = await provenance.grantSupplyChainRole(role, TARGET_WALLET);
    await tx.wait();

    // ✅ Verify role immediately
    const hasRole = await provenance.hasRole(role, TARGET_WALLET);

    console.log(`  ✅  ${name} granted to ${TARGET_WALLET} → ${hasRole ? "SUCCESS" : "FAILED"}`);
  }

  // ── 2b. Fund the target wallet with test ETH (gas money) ───────────────────
  const walletBalance = await hre.ethers.provider.getBalance(TARGET_WALLET);
  const tenEth = hre.ethers.parseEther("10");

  if (walletBalance < tenEth) {
    const needed = hre.ethers.parseEther("100");
    console.log(`\n[Fund] Wallet has only ${hre.ethers.formatEther(walletBalance)} ETH — sending 100 ETH for gas...`);
    const fundTx = await deployer.sendTransaction({ to: TARGET_WALLET, value: needed });
    await fundTx.wait();
    const newBalance = await hre.ethers.provider.getBalance(TARGET_WALLET);
    console.log(`  ✅  Funded! New balance: ${hre.ethers.formatEther(newBalance)} ETH`);
  } else {
    console.log(`\n[Fund] Wallet already has ${hre.ethers.formatEther(walletBalance)} ETH — skipping fund step.`);
  }

  // ── 3. Copy ABI to frontend src/contracts/ ──────────────────────────────────
  const artifactPath = path.join(
    __dirname, "..", "artifacts", "contracts", "Provenance.sol", "Provenance.json"
  );
  const frontendContractsDir = path.join(
    __dirname, "..", "..", "src", "contracts"
  );

  fs.mkdirSync(frontendContractsDir, { recursive: true });

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abiOutput = {
    contractName: "Provenance",
    address: contractAddress,
    network: hre.network.name,
    abi: artifact.abi,
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "ProvenanceABI.json"),
    JSON.stringify(abiOutput, null, 2)
  );
  console.log("\n  ✅  ABI copied to src/contracts/ProvenanceABI.json");

  // ── 4. Write deployed address to frontend .env ───────────────────────────────
  const envPath   = path.join(__dirname, "..", "..", ".env");
  let   envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

  // Replace or append VITE_HERB_REGISTRY_ADDRESS
  const envKey = "VITE_HERB_REGISTRY_ADDRESS";
  const envLine = `${envKey}=${contractAddress}`;
  if (envContent.includes(envKey)) {
    envContent = envContent.replace(new RegExp(`${envKey}=.*`), envLine);
  } else {
    envContent += `\n${envLine}`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log("  ✅  Updated .env with contract address");

  // ── 5. Summary ──────────────────────────────────────────────────────────────
  const finalBalance = await hre.ethers.provider.getBalance(TARGET_WALLET);
  console.log("\n" + line);
  console.log("  Deployment Summary");
  console.log(line);
  console.log("  Provenance Contract:", contractAddress);
  console.log("  Admin (Deployer)   :", deployer.address);
  console.log("  Your Wallet        :", TARGET_WALLET);
  console.log("  Wallet Balance     :", hre.ethers.formatEther(finalBalance), "ETH");
  console.log(line);
  console.log("\n  👉  MetaMask Setup:");
  console.log("      Network: Hardhat Localhost");
  console.log("      RPC URL: http://127.0.0.1:8545");
  console.log("      Chain ID: 31337");
  console.log("      Currency: ETH");
  console.log("\n  🦊  Import this private key into MetaMask to use the deployer account:");
  console.log("      0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("      (Hardhat Account #0 — 10000 ETH, already has ADMIN role)");
  console.log("\n  Done! 🌿\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
