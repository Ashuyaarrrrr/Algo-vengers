// scripts/fund.js  ── CommonJS
// ────────────────────────────────────────────────────────────────────
//  Sends 100 ETH from the Hardhat deployer (account #0) to your
//  MetaMask wallet so you can pay gas fees on the local network.
//
//  Usage:
//    npx hardhat run scripts/fund.js --network localhost
// ────────────────────────────────────────────────────────────────────

"use strict";

require("dotenv").config();
const hre = require("hardhat");

// ── Target wallet: your MetaMask address ──────────────────────────────────
// This is read from .env (FUNDED_WALLET) or falls back to the hardcoded address.
const TARGET_WALLET =
  process.env.FUNDED_WALLET || "0x1758817E5150cd335309fe3BFBC14210CB43F723";

const ETH_TO_SEND = "100"; // plenty for thousands of test transactions

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const balanceBefore = await hre.ethers.provider.getBalance(TARGET_WALLET);
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);

  const line = "=".repeat(60);
  console.log(line);
  console.log("  HerbChain — Fund Wallet Script");
  console.log(line);
  console.log("  Deployer        :", deployer.address);
  console.log("  Deployer Balance:", hre.ethers.formatEther(deployerBalance), "ETH");
  console.log("  Target Wallet   :", TARGET_WALLET);
  console.log("  Target Balance  :", hre.ethers.formatEther(balanceBefore), "ETH (before)");
  console.log(line);

  if (balanceBefore >= hre.ethers.parseEther("10")) {
    console.log(`\n  ⚡  Wallet already has ${hre.ethers.formatEther(balanceBefore)} ETH — no action needed.\n`);
    return;
  }

  console.log(`\n  Sending ${ETH_TO_SEND} ETH to ${TARGET_WALLET}...`);

  const tx = await deployer.sendTransaction({
    to:    TARGET_WALLET,
    value: hre.ethers.parseEther(ETH_TO_SEND),
  });
  await tx.wait();

  const balanceAfter = await hre.ethers.provider.getBalance(TARGET_WALLET);

  console.log("  ✅  Transfer complete!");
  console.log("  TX Hash  :", tx.hash);
  console.log("  New Balance:", hre.ethers.formatEther(balanceAfter), "ETH");
  console.log(line);
  console.log("  🦊  MetaMask should now show ETH on Hardhat Localhost.");
  console.log("      If the balance doesn't update, click the MetaMask");
  console.log("      account icon → Refresh List.\n");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exitCode = 1;
});
