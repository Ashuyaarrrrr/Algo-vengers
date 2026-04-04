/**
 * blockchain.js — HerbChain Full Blockchain Integration
 * ──────────────────────────────────────────────────────
 * Connects MetaMask → ethers.js → Provenance contract
 * The Provenance contract inherits ALL functionality:
 *   RoleManager, HerbBatch, Processing, QualityTest, SupplyChain, Formulation
 */

import { ethers } from "ethers";

// Contract address from environment (updated by deploy script)
const CONTRACT_ADDRESS = import.meta.env.VITE_HERB_REGISTRY_ADDRESS;

// ── MetaMask / Provider Utilities ──────────────────────────────────────────────

/**
 * Request MetaMask accounts and return the provider + signer.
 * Throws if MetaMask is not installed.
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install it from metamask.io");
  }
  // Request account access
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  return { provider, signer };
}

/**
 * Get the currently connected account without triggering a connect prompt.
 * Returns null if not connected.
 */
export async function getConnectedAccount() {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts.length > 0 ? accounts[0] : null;
}

/**
 * Get the current chain ID.
 */
export async function getChainId() {
  if (!window.ethereum) return null;
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  return parseInt(chainId, 16);
}

/**
 * Check if the user is on the correct network (Hardhat = 31337).
 */
export async function isCorrectNetwork() {
  const chainId = await getChainId();
  return chainId === 31337;
}

/**
 * Prompt MetaMask to switch to the Hardhat localhost network.
 */
export async function switchToHardhatNetwork() {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7A69" }], // 31337 in hex
    });
  } catch (switchError) {
    // Chain not added — add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x7A69",
          chainName: "Hardhat Localhost",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: ["http://127.0.0.1:8545"],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

// ── Contract Factory ───────────────────────────────────────────────────────────

let _abiCache = null;

async function loadABI() {
  if (_abiCache) return _abiCache;
  try {
    const mod = await import("../contracts/ProvenanceABI.json");
    _abiCache = mod.default?.abi ?? mod.abi ?? mod.default;
    return _abiCache;
  } catch {
    // Fallback to old ABI file if new one not yet generated
    const mod = await import("../contracts/herbRegistryABI.json");
    _abiCache = mod.default?.abi ?? mod.abi ?? mod.default;
    return _abiCache;
  }
}

/**
 * Get the Provenance contract instance with a signer (for transactions).
 */
export async function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Run the deploy script first.");
  }
  const { signer } = await connectWallet();
  const abi = await loadABI();
  return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
}

/**
 * Get the Provenance contract instance with a read-only provider (no wallet needed).
 */
export async function getReadOnlyContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured.");
  }
  const abi = await loadABI();
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  return new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
}

// ── Role Management ────────────────────────────────────────────────────────────

// We now pass around string identifiers for roles instead of local hashes
export const CONTRACT_ROLES = {
  ADMIN:        "ADMIN",
  COLLECTOR:    "COLLECTOR",
  PROCESSOR:    "PROCESSOR",
  LAB:          "LAB",
  MANUFACTURER: "MANUFACTURER",
  DISTRIBUTOR:  "DISTRIBUTOR",
  RETAILER:     "RETAILER",
};

// Map HerbChain UI roles to contract role names
export const UI_ROLE_TO_CONTRACT_ROLE = {
  farmer:       CONTRACT_ROLES.COLLECTOR,
  processor:    CONTRACT_ROLES.PROCESSOR,
  lab:          CONTRACT_ROLES.LAB,
  manufacturer: CONTRACT_ROLES.MANUFACTURER,
  admin:        CONTRACT_ROLES.ADMIN,
};

/**
 * Fetch the exact bytes32 role hash directly from the contract.
 * @param {string} roleName (e.g., "COLLECTOR")
 */
export async function getRoleHash(roleName) {
  if (roleName === "ADMIN") return ethers.ZeroHash;
  const contract = await getReadOnlyContract();
  switch (roleName) {
    case "COLLECTOR": return await contract.COLLECTOR_ROLE();
    case "PROCESSOR": return await contract.PROCESSOR_ROLE();
    case "LAB": return await contract.LAB_ROLE();
    case "MANUFACTURER": return await contract.MANUFACTURER_ROLE();
    case "DISTRIBUTOR": return await contract.DISTRIBUTOR_ROLE();
    case "RETAILER": return await contract.RETAILER_ROLE();
    default: throw new Error(`Unknown role: ${roleName}`);
  }
}

/**
 * Check if an address holds a specific role dynamically retrieved from the contract.
 */
export async function hasRole(roleName, address) {
  try {
    const contract = await getReadOnlyContract();
    const roleHash = await getRoleHash(roleName);
    
    console.log(`[blockchain] Checking ${roleName} role for wallet: ${address}`);
    const hasRole = await contract.hasSupplyChainRole(roleHash, address);
    console.log(`[blockchain] Role check result -> ${hasRole}`);
    
    return hasRole;
  } catch (err) {
    console.error("[blockchain] hasRole error:", err);
    // Explicitly log the error stack and address so the dev can see it in terminal or console
    console.error(`Attempted Address: ${address}, Contract at: ${CONTRACT_ADDRESS}`);
    return false;
  }
}

/**
 * Grant a role to an address (admin only).
 */
export async function grantRole(roleName, address) {
  const contract = await getContract();
  const roleHash = await getRoleHash(roleName);
  
  console.log(`[blockchain] Granting ${roleName} to ${address}...`);
  const tx = await contract.grantSupplyChainRole(roleHash, address);
  return await tx.wait();
}

/**
 * Revoke a role from an address (admin only).
 */
export async function revokeRole(roleName, address) {
  const contract = await getContract();
  const roleHash = await getRoleHash(roleName);
  
  const tx = await contract.revokeSupplyChainRole(roleHash, address);
  return await tx.wait();
}

// ── Herb Batch Functions ───────────────────────────────────────────────────────

/**
 * Create a new herb batch on-chain.
 * Requires COLLECTOR_ROLE.
 * @returns {Promise<{batchId: string, txHash: string}>}
 */
export async function createHerbBatch({
  herbName,
  geoLatitude,
  geoLongitude,
  harvestDate,       // Unix timestamp
  isSustainable,
  herbSpecies,
  quantity,          // uint256 (integer kg/g)
  unit,
  weather,
  temperature,       // int256 (°C)
  initialQuality,
  ipfsHash,
}) {
  const contract = await getContract();
  const tx = await contract.createBatch(
    herbName,
    geoLatitude,
    geoLongitude,
    harvestDate,
    isSustainable,
    herbSpecies,
    quantity,
    unit,
    weather,
    temperature,
    initialQuality,
    ipfsHash
  );
  const receipt = await tx.wait();

  // Extract batchId from BatchCreated event
  const event = receipt.logs
    .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
    .find(e => e?.name === "BatchCreated");

  const batchId = event ? event.args.batchId : null;
  return { batchId, txHash: receipt.hash };
}

/**
 * Get a batch from the blockchain.
 */
export async function getBatch(batchId) {
  const contract = await getReadOnlyContract();
  return await contract.getBatch(batchId);
}

/**
 * Get all batch IDs from the contract.
 */
export async function getAllBatchIds() {
  const contract = await getReadOnlyContract();
  return await contract.getAllBatchIds();
}

/**
 * Get the total batch count.
 */
export async function getTotalBatches() {
  const contract = await getReadOnlyContract();
  return await contract.totalBatches();
}

// ── Processing Functions ───────────────────────────────────────────────────────

const PROCESS_TYPE_MAP = {
  "Drying":     0,
  "Grinding":   1,
  "Storage":    2,
  "Extraction": 3,
  "Sorting":    4,
  "Packaging":  5,
};

/**
 * Add a processing step to a batch on-chain.
 * Requires PROCESSOR_ROLE.
 */
export async function addProcessingStep({
  batchId,
  processType,       // string like "Drying"
  storageConditions,
  notes,
  temperature,       // int256
  humidity,          // uint256
  facilityId,
  ipfsHash,
}) {
  const contract = await getContract();
  const processTypeEnum = PROCESS_TYPE_MAP[processType] ?? 0;
  const tx = await contract.addProcessingStep(
    batchId,
    processTypeEnum,
    storageConditions,
    notes,
    temperature,
    humidity,
    facilityId,
    ipfsHash
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

/**
 * Get all processing steps for a batch.
 */
export async function getProcessingSteps(batchId) {
  const contract = await getReadOnlyContract();
  return await contract.getProcessingSteps(batchId);
}

// ── Quality Test Functions ─────────────────────────────────────────────────────

/**
 * Record a quality test result on-chain.
 * Requires LAB_ROLE.
 */
export async function recordQualityTest({
  batchId,
  moistureContent,   // uint256 (scaled x100, e.g. 1250 = 12.50%)
  pesticideLevel,    // uint256 ppb
  dnaAuthenticated,  // bool
  passed,            // bool
  remarks,
  ipfsHash,
}) {
  const contract = await getContract();
  const tx = await contract.recordQualityTest(
    batchId,
    moistureContent,
    pesticideLevel,
    dnaAuthenticated,
    passed,
    remarks,
    ipfsHash
  );
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

/**
 * Get all quality tests for a batch.
 */
export async function getQualityTests(batchId) {
  const contract = await getReadOnlyContract();
  return await contract.getQualityTests(batchId);
}

// ── Formulation Functions ──────────────────────────────────────────────────────

/**
 * Record a product formulation on-chain.
 * Requires MANUFACTURER_ROLE.
 */
export async function recordFormulation({
  productName,
  dosage,
  herbNames,         // string[]
  percentages,       // uint256[]
  ipfsHash,
}) {
  const contract = await getContract();
  const tx = await contract.recordFormulation(
    productName,
    dosage,
    herbNames,
    percentages,
    ipfsHash
  );
  const receipt = await tx.wait();

  // Extract formulationId from FormulationCreated event
  const event = receipt.logs
    .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
    .find(e => e?.name === "FormulationCreated");

  const formulationId = event ? event.args.formulationId : null;
  return { formulationId, txHash: receipt.hash };
}

/**
 * Get a formulation from the blockchain.
 */
export async function getFormulation(formulationId) {
  const contract = await getReadOnlyContract();
  return await contract.getFormulation(formulationId);
}

// ── Provenance (Consumer Verification) ────────────────────────────────────────

/**
 * Get full provenance for a batch (for consumer QR scan).
 * Uses viewBatchProvenance (read-only, no state change).
 */
export async function getBatchProvenance(batchId) {
  const contract = await getReadOnlyContract();
  return await contract.viewBatchProvenance(batchId);
}

/**
 * Get batch summary (lightweight for QR display).
 */
export async function getBatchSummary(batchId) {
  const contract = await getReadOnlyContract();
  return await contract.getBatchSummary(batchId);
}

// ── Transfer Ownership ─────────────────────────────────────────────────────────

/**
 * Transfer custody of a batch to another supply chain participant.
 */
export async function transferOwnership({
  batchId,
  to,
  location,
  notes,
  ipfsHash,
}) {
  const contract = await getContract();
  const tx = await contract.transferOwnership(batchId, to, location, notes, ipfsHash);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

// ── Network Status ─────────────────────────────────────────────────────────────

/**
 * Get live blockchain network info.
 */
export async function getNetworkInfo() {
  try {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const [blockNumber, network] = await Promise.all([
      provider.getBlockNumber(),
      provider.getNetwork(),
    ]);
    const block = await provider.getBlock(blockNumber);
    return {
      blockNumber,
      chainId: Number(network.chainId),
      timestamp: block?.timestamp ?? 0,
      isConnected: true,
    };
  } catch {
    return { isConnected: false, blockNumber: 0, chainId: 0 };
  }
}

// ── Helper: bytes32 ↔ hex string ───────────────────────────────────────────────

export function bytes32ToHex(bytes32) {
  return typeof bytes32 === "string" ? bytes32 : ethers.hexlify(bytes32);
}

export function hexToBytes32(hex) {
  return ethers.zeroPadValue(hex, 32);
}