const hre = require("hardhat");

async function main() {
  const addr = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d"; // From .env
  const target = "0x1758817E5150cd335309fe3BFBC14210CB43F723";
  
  const p = await hre.ethers.getContractAt("Provenance", addr);
  console.log("Checking roles on address:", target);
  
  try {
    const colRole = await p.COLLECTOR_ROLE();
    console.log("COLLECTOR_ROLE hash:", colRole);
    
    const hasCol = await p.hasSupplyChainRole(colRole, target);
    console.log("Has COLLECTOR_ROLE:", hasCol);

    const checkDirect = await p.hasRole(colRole, target);
    console.log("Has Role (AccessControl):", checkDirect);
  } catch (err) {
    console.error("Error calling contract:", err);
  }
}

main().catch(console.error);
