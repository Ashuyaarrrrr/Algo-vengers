/**
 * WalletConnect.tsx — MetaMask wallet connection component
 * ══════════════════════════════════════════════════════════
 * Shows wallet status, handles connect / network switch.
 * Can be embedded in any dashboard header or sidebar.
 */

import React from "react";
import { useWallet } from "@/hooks/useWallet";
import { shortBatchId } from "@/hooks/useSupplyChain";

// ─── WalletConnect Button ─────────────────────────────────────────────────────

interface WalletConnectProps {
  /** If false (default) shows compact badge, if true shows full card */
  expanded?: boolean;
}

export function WalletConnect({ expanded = false }: WalletConnectProps) {
  const { account, chainId, isConnected, isCorrectNetwork, isConnecting, connect, switchNetwork, disconnect } =
    useWallet();

  const shortAddr = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : null;
  const networkName = chainId === 31337
    ? "Hardhat Local"
    : chainId === 80001
    ? "Polygon Mumbai"
    : chainId
    ? `Chain ${chainId}`
    : "Unknown";

  // ── Compact badge variant ──────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        {!isConnected ? (
          <button
            onClick={connect}
            disabled={isConnecting}
            style={styles.connectBtn}
          >
            {isConnecting ? (
              <><Spinner /> Connecting…</>
            ) : (
              <><MetaMaskIcon /> Connect Wallet</>
            )}
          </button>
        ) : !isCorrectNetwork ? (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <StatusBadge color="#f59e0b">⚠ Wrong Network</StatusBadge>
            <button onClick={switchNetwork} style={styles.switchBtn}>
              Switch to Hardhat
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <StatusBadge color="#10b981">● {shortAddr}</StatusBadge>
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>{networkName}</span>
            <button onClick={disconnect} style={styles.disconnectBtn} title="Disconnect">✕</button>
          </div>
        )}
      </div>
    );
  }

  // ── Expanded card variant ──────────────────────────────────────────────────
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <MetaMaskIcon size={24} />
        <span style={styles.cardTitle}>Wallet</span>
        {isConnected && <StatusBadge color={isCorrectNetwork ? "#10b981" : "#f59e0b"}>
          {isCorrectNetwork ? "Connected" : "Wrong Network"}
        </StatusBadge>}
      </div>

      {!isConnected ? (
        <>
          <p style={styles.hint}>Connect your MetaMask wallet to interact with the blockchain.</p>
          <button onClick={connect} disabled={isConnecting} style={styles.connectBtnFull}>
            {isConnecting ? <><Spinner /> Connecting…</> : <><MetaMaskIcon /> Connect MetaMask</>}
          </button>
        </>
      ) : (
        <>
          <div style={styles.infoRow}>
            <span style={styles.label}>Address</span>
            <span style={styles.value} title={account ?? ""}>{shortAddr}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Network</span>
            <span style={styles.value}>{networkName}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Chain ID</span>
            <span style={styles.value}>{chainId}</span>
          </div>

          {!isCorrectNetwork && (
            <button onClick={switchNetwork} style={styles.switchBtnFull}>
              ⚡ Switch to Hardhat Localhost
            </button>
          )}

          <button onClick={disconnect} style={styles.disconnectBtnFull}>
            Disconnect
          </button>
        </>
      )}
    </div>
  );
}

// ─── TransactionStatus ────────────────────────────────────────────────────────

interface TransactionStatusProps {
  status:  "idle" | "pending" | "success" | "error";
  txHash:  string | null;
  error:   string | null;
  chainId?: number;
  /** Show the batch ID returned from createBatch */
  batchId?: string | null;
}

export function TransactionStatus({ status, txHash, error, chainId = 31337, batchId }: TransactionStatusProps) {
  if (status === "idle") return null;

  const configs: Partial<Record<typeof status, { bg: string; border: string; icon: string; title: string }>> = {
    pending: { bg: "#1e2a3a",     border: "#3b82f6",     icon: "⏳", title: "Transaction Pending" },
    success: { bg: "#052e16",     border: "#22c55e",     icon: "✅", title: "Transaction Confirmed" },
    error:   { bg: "#2d0a0a",     border: "#ef4444",     icon: "❌", title: "Transaction Failed" },
  };

  const cfg = configs[status];

  return (
    <div style={{
      marginTop: "16px",
      padding: "14px 16px",
      borderRadius: "10px",
      border: `1px solid ${cfg.border}`,
      backgroundColor: cfg.bg,
      fontSize: "13px",
      lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 600, marginBottom: "6px", color: "#e5e7eb" }}>
        {cfg.icon} {cfg.title}
      </div>

      {status === "pending" && (
        <div style={{ color: "#93c5fd" }}>
          <Spinner /> Waiting for blockchain confirmation…
        </div>
      )}

      {status === "success" && txHash && (
        <div style={{ color: "#86efac" }}>
          <div><strong>Tx Hash:</strong> <code style={{ fontSize: "11px" }}>{txHash.slice(0, 20)}…</code></div>
          {batchId && (
            <div style={{ marginTop: "4px" }}>
              <strong>Batch ID:</strong>{" "}
              <code style={{ fontSize: "11px" }}>{shortBatchId(batchId)}</code>
            </div>
          )}
          {chainId !== 31337 && txHash && (
            <a
              href={`https://polygonscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#60a5fa", textDecoration: "underline" }}
            >
              View on explorer ↗
            </a>
          )}
        </div>
      )}

      {status === "error" && error && (
        <div style={{ color: "#fca5a5" }}>{error}</div>
      )}
    </div>
  );
}

// ─── ProvenanceTimeline ────────────────────────────────────────────────────────

interface Transfer {
  from:          string;
  to:            string;
  location:      string;
  notes:         string;
  timestamp:     bigint | number;
  transferIndex: bigint | number;
}

interface ProvenanceTimelineProps {
  batchId?:    string;
  herbName?:   string;
  collector?:  string;
  isSustainable?: boolean;
  hasPassedLatestQualityTest?: boolean;
  processingSteps?: any[];
  qualityTests?: any[];
  transfers?: Transfer[];
}

export function ProvenanceTimeline({
  batchId, herbName, collector, isSustainable,
  hasPassedLatestQualityTest, processingSteps = [], qualityTests = [], transfers = []
}: ProvenanceTimelineProps) {

  const roleNames: Record<number, string> = {
    0: "Farmer / Collector",
    1: "Processor",
    2: "Lab",
    3: "Manufacturer",
    4: "Distributor",
    5: "Retailer",
  };

  return (
    <div style={styles.timeline}>
      <h3 style={{ color: "#e5e7eb", marginBottom: "16px", fontSize: "16px" }}>
        🌿 Supply Chain Journey — {herbName ?? "Herb Batch"}
      </h3>

      {batchId && (
        <div style={styles.infoRow}>
          <span style={styles.label}>Batch ID</span>
          <code style={{ ...styles.value, fontSize: "11px" }}>{shortBatchId(batchId)}</code>
        </div>
      )}
      {collector && (
        <div style={styles.infoRow}>
          <span style={styles.label}>Collector</span>
          <span style={styles.value}>{collector.slice(0, 8)}…{collector.slice(-4)}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "8px", marginBottom: "20px" }}>
        {isSustainable !== undefined && (
          <StatusBadge color={isSustainable ? "#10b981" : "#6b7280"}>
            {isSustainable ? "🌱 Sustainable" : "Not Sustainable"}
          </StatusBadge>
        )}
        {hasPassedLatestQualityTest !== undefined && (
          <StatusBadge color={hasPassedLatestQualityTest ? "#10b981" : "#ef4444"}>
            {hasPassedLatestQualityTest ? "✅ QA Passed" : "❌ QA Failed"}
          </StatusBadge>
        )}
        <StatusBadge color="#3b82f6">{processingSteps.length} processing steps</StatusBadge>
        <StatusBadge color="#8b5cf6">{qualityTests.length} QA tests</StatusBadge>
      </div>

      {/* Transfers timeline */}
      <div style={{ position: "relative" }}>
        {/* Initial creation node */}
        <TimelineNode
          index={0}
          icon="🌾"
          role="Collector"
          detail={collector ? `${collector.slice(0, 8)}…` : "—"}
          time="Creation"
          color="#10b981"
        />

        {transfers.map((t, i) => (
          <TimelineNode
            key={i}
            index={i + 1}
            icon={getTransferIcon(i)}
            role={roleNames[i + 1] ?? `Step ${i + 1}`}
            detail={t.location}
            notes={t.notes}
            time={formatTs(t.timestamp)}
            color={getTransferColor(i)}
          />
        ))}
      </div>

      {/* Processing + QA summary at bottom */}
      {processingSteps.length > 0 && (
        <details style={{ marginTop: "16px" }}>
          <summary style={{ color: "#60a5fa", cursor: "pointer" }}>
            ⚙️ Processing Steps ({processingSteps.length})
          </summary>
          {processingSteps.map((s, i) => (
            <div key={i} style={{ padding: "6px 12px", borderLeft: "2px solid #3b82f6", marginTop: "6px", fontSize: "12px", color: "#d1d5db" }}>
              [{i}] {PROCESS_TYPE_NAMES[Number(s.processType)] ?? s.processType} — {s.storageConditions}
            </div>
          ))}
        </details>
      )}

      {qualityTests.length > 0 && (
        <details style={{ marginTop: "12px" }}>
          <summary style={{ color: "#a78bfa", cursor: "pointer" }}>
            🔬 Quality Tests ({qualityTests.length})
          </summary>
          {qualityTests.map((t, i) => (
            <div key={i} style={{ padding: "6px 12px", borderLeft: `2px solid ${t.passed ? "#22c55e" : "#ef4444"}`, marginTop: "6px", fontSize: "12px", color: "#d1d5db" }}>
              [{i}] {t.passed ? "✅ PASSED" : "❌ FAILED"} — Moisture: {(Number(t.moistureContent)/100).toFixed(2)}% | Pesticide: {Number(t.pesticideLevel)} ppb
              {t.remarks && <div style={{ color: "#9ca3af" }}>{t.remarks}</div>}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

// ─── Internal Sub-components ─────────────────────────────────────────────────

function TimelineNode({ index, icon, role, detail, notes, time, color }: {
  index: number; icon: string; role: string; detail: string;
  notes?: string; time: string; color: string;
}) {
  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          backgroundColor: color + "22", border: `2px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", flexShrink: 0,
        }}>{icon}</div>
        <div style={{ width: "2px", flex: 1, backgroundColor: color + "44", minHeight: "20px" }} />
      </div>
      <div style={{ paddingBottom: "8px" }}>
        <div style={{ fontWeight: 600, color: "#e5e7eb", fontSize: "13px" }}>{role}</div>
        <div style={{ color: "#9ca3af", fontSize: "12px" }}>{detail}</div>
        {notes && <div style={{ color: "#6b7280", fontSize: "11px", fontStyle: "italic" }}>{notes}</div>}
        <div style={{ color: "#4b5563", fontSize: "11px" }}>{time}</div>
      </div>
    </div>
  );
}

function StatusBadge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: "999px",
      fontSize: "11px", fontWeight: 500,
      backgroundColor: color + "22", color, border: `1px solid ${color + "55"}`,
    }}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: "12px", height: "12px",
      border: "2px solid currentColor", borderTopColor: "transparent",
      borderRadius: "50%", animation: "spin 0.6s linear infinite",
      marginRight: "6px",
    }} />
  );
}

function MetaMaskIcon({ size = 16 }: { size?: number }) {
  return (
    <span style={{ fontSize: `${size}px`, marginRight: "4px" }}>🦊</span>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PROCESS_TYPE_NAMES = ["Drying", "Grinding", "Storage", "Extraction", "Sorting", "Packaging"];

function getTransferIcon(i: number): string {
  return ["⚙️", "🔬", "🏭", "🚛", "🏪"][i] ?? "📦";
}

function getTransferColor(i: number): string {
  return ["#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#10b981"][i] ?? "#6b7280";
}

function formatTs(ts: bigint | number): string {
  const n = Number(ts);
  if (!n) return "—";
  return new Date(n * 1000).toLocaleString();
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  connectBtn: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "6px 14px", borderRadius: "8px",
    background: "linear-gradient(135deg, #f97316, #ea580c)",
    color: "#fff", fontWeight: 600, fontSize: "13px",
    border: "none", cursor: "pointer",
  } as React.CSSProperties,

  connectBtnFull: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    width: "100%", padding: "10px 16px", borderRadius: "10px",
    background: "linear-gradient(135deg, #f97316, #ea580c)",
    color: "#fff", fontWeight: 600, fontSize: "14px",
    border: "none", cursor: "pointer", marginTop: "12px",
  } as React.CSSProperties,

  switchBtn: {
    padding: "4px 10px", borderRadius: "6px",
    background: "#1d4ed8", color: "#bfdbfe",
    border: "1px solid #3b82f6", cursor: "pointer", fontSize: "12px",
  } as React.CSSProperties,

  switchBtnFull: {
    width: "100%", padding: "9px 16px", borderRadius: "10px",
    background: "#1e3a5f", color: "#60a5fa",
    border: "1px solid #3b82f6", cursor: "pointer", fontSize: "13px",
    fontWeight: 600, marginTop: "10px",
  } as React.CSSProperties,

  disconnectBtn: {
    padding: "3px 8px", borderRadius: "6px",
    background: "transparent", color: "#6b7280",
    border: "1px solid #374151", cursor: "pointer", fontSize: "12px",
  } as React.CSSProperties,

  disconnectBtnFull: {
    width: "100%", padding: "8px 16px", borderRadius: "10px",
    background: "transparent", color: "#6b7280",
    border: "1px solid #374151", cursor: "pointer", fontSize: "13px",
    marginTop: "8px",
  } as React.CSSProperties,

  card: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "14px",
    padding: "18px",
    maxWidth: "340px",
  } as React.CSSProperties,

  cardHeader: {
    display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px",
  } as React.CSSProperties,

  cardTitle: {
    fontWeight: 700, fontSize: "15px", color: "#e5e7eb", flex: 1,
  } as React.CSSProperties,

  hint: {
    fontSize: "13px", color: "#6b7280", marginBottom: "4px",
  } as React.CSSProperties,

  infoRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "6px 0", borderBottom: "1px solid #1f2937",
  } as React.CSSProperties,

  label: {
    fontSize: "12px", color: "#6b7280",
  } as React.CSSProperties,

  value: {
    fontSize: "13px", color: "#d1d5db", fontWeight: 500,
  } as React.CSSProperties,

  timeline: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "14px",
    padding: "20px",
  } as React.CSSProperties,
};

// Inject spin animation
if (typeof document !== "undefined" && !document.getElementById("wallet-spin-style")) {
  const style = document.createElement("style");
  style.id = "wallet-spin-style";
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
