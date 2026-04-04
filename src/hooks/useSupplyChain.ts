/**
 * useSupplyChain.ts — React hook for HerbChain supply chain operations
 * ════════════════════════════════════════════════════════════════════
 * Provides typed, toast-notified wrappers around every contract call.
 * Tracks transaction status (idle | pending | success | error) for each op.
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import * as bc from "@/lib/blockchain";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TxStatus = "idle" | "pending" | "success" | "error";

export interface TxState {
  status:  TxStatus;
  txHash:  string | null;
  error:   string | null;
}

const IDLE: TxState = { status: "idle", txHash: null, error: null };

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSupplyChain() {
  const [txState, setTxState] = useState<TxState>(IDLE);

  // ── Internal helpers ──────────────────────────────────────────────────────

  function setPending() {
    setTxState({ status: "pending", txHash: null, error: null });
  }

  function setSuccess(txHash: string) {
    setTxState({ status: "success", txHash, error: null });
  }

  function setError(error: string) {
    setTxState({ status: "error", txHash: null, error });
  }

  function reset() {
    setTxState(IDLE);
  }

  /**
   * Store a transaction hash in a Supabase column for a given row.
   * Silently logs the error without crashing the UI.
   */
  async function saveTxHashToDb(
    table: string,
    column: string,
    value: string,
    txHash: string
  ) {
    const { error } = await supabase
      .from(table)
      .update({ tx_hash: txHash, blockchain_synced: true, synced_at: new Date().toISOString() })
      .eq(column, value);
    if (error) {
      console.warn(`[useSupplyChain] Could not save txHash to ${table}:`, error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Collector: createBatch
  // ═══════════════════════════════════════════════════════════════════════════

  const createBatch = useCallback(async (params: {
    herbName:       string;
    geoLatitude:    string;
    geoLongitude:   string;
    harvestDate:    number;     // Unix timestamp (seconds)
    isSustainable:  boolean;
    herbSpecies:    string;
    quantity:       number;
    unit:           string;
    weather:        string;
    temperature:    number;
    initialQuality: string;
    ipfsHash:       string;
    /** Optional: Supabase collection ID to link tx hash */
    supabaseCollectionId?: string;
  }) => {
    setPending();
    const tid = toast.loading("⛓️  Recording batch on blockchain…", { duration: 60_000 });
    try {
      const { batchId, txHash } = await bc.createHerbBatch(params);
      toast.dismiss(tid);
      toast.success(`✅ Batch created on-chain!\nBatch ID: ${batchId?.slice(0, 12)}…`, { duration: 6000 });
      setSuccess(txHash);

      // Link to Supabase if collection ID provided
      if (params.supabaseCollectionId && txHash) {
        await saveTxHashToDb("collections", "id", params.supabaseCollectionId, txHash);
      }

      return { batchId, txHash };
    } catch (err: any) {
      toast.dismiss(tid);
      const msg = parseContractError(err);
      toast.error(`❌ createBatch failed: ${msg}`);
      setError(msg);
      return null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2/4/6/8/9 — Any role: transferOwnership
  // ═══════════════════════════════════════════════════════════════════════════

  const transferOwnership = useCallback(async (params: {
    batchId:   string;
    to:        string;
    location:  string;
    notes:     string;
    ipfsHash:  string;
    /** Human-readable label for toast messages */
    fromRole?: string;
    toRole?:   string;
  }) => {
    setPending();
    const label = params.fromRole && params.toRole
      ? `${params.fromRole} → ${params.toRole}`
      : "Transfer";
    const tid = toast.loading(`⛓️  ${label}: recording transfer…`, { duration: 60_000 });
    try {
      const { txHash } = await bc.transferOwnership(params);
      toast.dismiss(tid);
      toast.success(`✅ ${label} recorded on-chain!`, { duration: 5000 });
      setSuccess(txHash);
      return { txHash };
    } catch (err: any) {
      toast.dismiss(tid);
      const msg = parseContractError(err);
      toast.error(`❌ Transfer failed: ${msg}`);
      setError(msg);
      return null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Processor: addProcessingStep
  // ═══════════════════════════════════════════════════════════════════════════

  const addProcessingStep = useCallback(async (params: {
    batchId:           string;
    processType:       string;  // "Drying" | "Grinding" | "Storage" | "Extraction" | "Sorting" | "Packaging"
    storageConditions: string;
    notes:             string;
    temperature:       number;
    humidity:          number;
    facilityId:        string;
    ipfsHash:          string;
  }) => {
    setPending();
    const tid = toast.loading(`⛓️  Recording ${params.processType} step…`, { duration: 60_000 });
    try {
      const { txHash } = await bc.addProcessingStep(params);
      toast.dismiss(tid);
      toast.success(`✅ ${params.processType} step recorded on-chain!`);
      setSuccess(txHash);
      return { txHash };
    } catch (err: any) {
      toast.dismiss(tid);
      const msg = parseContractError(err);
      toast.error(`❌ Processing step failed: ${msg}`);
      setError(msg);
      return null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5 — Lab: recordQualityTest
  // ═══════════════════════════════════════════════════════════════════════════

  const recordQualityTest = useCallback(async (params: {
    batchId:          string;
    moistureContent:  number;  // scaled x100 (e.g. 850 = 8.50%)
    pesticideLevel:   number;  // ppb
    dnaAuthenticated: boolean;
    passed:           boolean;
    remarks:          string;
    ipfsHash:         string;
    /** Optional: Supabase lab_reports row ID */
    supabaseReportId?: string;
  }) => {
    setPending();
    const verdict = params.passed ? "PASS" : "FAIL";
    const tid = toast.loading(`⛓️  Submitting QA test (${verdict})…`, { duration: 60_000 });
    try {
      const { txHash } = await bc.recordQualityTest(params);
      toast.dismiss(tid);
      const icon = params.passed ? "✅" : "⚠️";
      toast.success(`${icon} Quality test (${verdict}) recorded on-chain!`);
      setSuccess(txHash);

      if (params.supabaseReportId && txHash) {
        await saveTxHashToDb("lab_reports", "id", params.supabaseReportId, txHash);
      }

      return { txHash };
    } catch (err: any) {
      toast.dismiss(tid);
      const msg = parseContractError(err);
      toast.error(`❌ Quality test failed: ${msg}`);
      setError(msg);
      return null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7 — Manufacturer: recordFormulation
  // ═══════════════════════════════════════════════════════════════════════════

  const recordFormulation = useCallback(async (params: {
    productName:  string;
    dosage:       string;
    herbNames:    string[];
    percentages:  number[];   // must sum to 100
    ipfsHash:     string;
    /** Optional: Supabase formulation row ID */
    supabaseFormulationId?: string;
  }) => {
    setPending();
    const tid = toast.loading("⛓️  Recording formulation on-chain…", { duration: 60_000 });
    try {
      const { formulationId, txHash } = await bc.recordFormulation(params);
      toast.dismiss(tid);
      toast.success(`✅ Formulation recorded!\nID: ${formulationId?.slice(0, 12)}…`, { duration: 6000 });
      setSuccess(txHash);

      if (params.supabaseFormulationId && txHash) {
        await saveTxHashToDb("formulations", "id", params.supabaseFormulationId, txHash);
      }

      return { formulationId, txHash };
    } catch (err: any) {
      toast.dismiss(tid);
      const msg = parseContractError(err);
      toast.error(`❌ Formulation failed: ${msg}`);
      setError(msg);
      return null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // READ: getBatchProvenance
  // ═══════════════════════════════════════════════════════════════════════════

  const getBatchProvenance = useCallback(async (batchId: string) => {
    try {
      return await bc.getBatchProvenance(batchId);
    } catch (err: any) {
      const msg = parseContractError(err);
      toast.error(`❌ Could not fetch provenance: ${msg}`);
      return null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // READ: checkUserRole
  // ═══════════════════════════════════════════════════════════════════════════

  const checkUserRole = useCallback(async (roleName: string, address: string): Promise<boolean> => {
    try {
      return await bc.hasRole(roleName, address);
    } catch {
      return false;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: grantRole
  // ═══════════════════════════════════════════════════════════════════════════

  const grantRole = useCallback(async (roleName: string, address: string) => {
    setPending();
    const tid = toast.loading(`⛓️  Granting ${roleName} to ${address.slice(0, 8)}…`, { duration: 60_000 });
    try {
      const receipt = await bc.grantRole(roleName, address);
      toast.dismiss(tid);
      toast.success(`✅ ${roleName} granted to ${address.slice(0, 8)}…`);
      setSuccess(receipt.hash);
      return receipt;
    } catch (err: any) {
      toast.dismiss(tid);
      const msg = parseContractError(err);
      toast.error(`❌ Grant role failed: ${msg}`);
      setError(msg);
      return null;
    }
  }, []);

  return {
    // State
    txState,
    reset,
    isPending: txState.status === "pending",

    // Write operations
    createBatch,
    transferOwnership,
    addProcessingStep,
    recordQualityTest,
    recordFormulation,
    grantRole,

    // Read operations
    getBatchProvenance,
    checkUserRole,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Parse a human-readable error message from ethers / contract reverts.
 */
export function parseContractError(err: any): string {
  if (!err) return "Unknown error";

  // MetaMask user rejection
  if (err.code === 4001 || err.code === "ACTION_REJECTED") {
    return "Transaction rejected by user";
  }

  // ethers v6 revert reason
  if (err.reason) return err.reason;

  // ethers v6 revert data decoded
  if (err.data) {
    try {
      const decoded = JSON.parse(err.data);
      if (decoded.message) return decoded.message;
    } catch { /* not JSON */ }
  }

  // OpenZeppelin revert strings appear inside err.message
  const match = err.message?.match(/reverted with reason string '([^']+)'/);
  if (match) return match[1];

  // Fallback
  return err.shortMessage ?? err.message ?? String(err);
}

/**
 * Convert a bytes32 batch ID to a short display string.
 */
export function shortBatchId(batchId: string | null): string {
  if (!batchId) return "—";
  return `${batchId.slice(0, 10)}…${batchId.slice(-6)}`;
}

/**
 * Returns a Etherscan / explorer URL for a tx hash.
 * Defaults to Hardhat localhost (no explorer, but shows hash).
 */
export function explorerUrl(txHash: string | null, chainId = 31337): string | null {
  if (!txHash) return null;
  if (chainId === 80001) return `https://mumbai.polygonscan.com/tx/${txHash}`;
  if (chainId === 137)   return `https://polygonscan.com/tx/${txHash}`;
  return null; // localhost has no explorer
}
