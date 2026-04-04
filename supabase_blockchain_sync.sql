-- ════════════════════════════════════════════════════════════════
--  HerbChain — Blockchain Sync Tables Migration
--  Run this once in your Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════

-- ── Blockchain Batches (synced from BatchCreated events) ────────
CREATE TABLE IF NOT EXISTS blockchain_batches (
  id              BIGSERIAL PRIMARY KEY,
  batch_id        TEXT UNIQUE NOT NULL,   -- bytes32 hex from contract
  herb_name       TEXT NOT NULL,
  collector       TEXT NOT NULL,          -- wallet address (lowercase)
  harvest_date    TIMESTAMPTZ,
  is_sustainable  BOOLEAN DEFAULT false,
  tx_hash         TEXT,
  block_number    BIGINT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Collection Events (synced from CollectionRecorded events) ───
CREATE TABLE IF NOT EXISTS blockchain_collections (
  id           BIGSERIAL PRIMARY KEY,
  batch_id     TEXT UNIQUE REFERENCES blockchain_batches(batch_id) ON DELETE CASCADE,
  collector    TEXT NOT NULL,
  herb_species TEXT,
  recorded_at  TIMESTAMPTZ,
  tx_hash      TEXT,
  block_number BIGINT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Processing Steps (synced from ProcessingStepAdded events) ───
CREATE TABLE IF NOT EXISTS blockchain_processing_steps (
  id           BIGSERIAL PRIMARY KEY,
  batch_id     TEXT REFERENCES blockchain_batches(batch_id) ON DELETE CASCADE,
  step_index   INT NOT NULL,
  process_type TEXT,
  processor    TEXT NOT NULL,            -- wallet address
  recorded_at  TIMESTAMPTZ,
  tx_hash      TEXT,
  block_number BIGINT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, step_index)
);

-- ── Quality Tests (synced from QualityTestRecorded events) ──────
CREATE TABLE IF NOT EXISTS blockchain_quality_tests (
  id               BIGSERIAL PRIMARY KEY,
  batch_id         TEXT REFERENCES blockchain_batches(batch_id) ON DELETE CASCADE,
  lab_address      TEXT NOT NULL,
  passed           BOOLEAN NOT NULL,
  pesticide_level  INT DEFAULT 0,
  moisture_content INT DEFAULT 0,
  recorded_at      TIMESTAMPTZ,
  tx_hash          TEXT UNIQUE,
  block_number     BIGINT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Ownership Transfers (synced from OwnershipTransferred events) ──
CREATE TABLE IF NOT EXISTS blockchain_transfers (
  id           BIGSERIAL PRIMARY KEY,
  batch_id     TEXT REFERENCES blockchain_batches(batch_id) ON DELETE CASCADE,
  from_addr    TEXT NOT NULL,
  to_addr      TEXT NOT NULL,
  location     TEXT,
  recorded_at  TIMESTAMPTZ,
  tx_hash      TEXT UNIQUE,
  block_number BIGINT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Formulations (synced from FormulationCreated events) ────────
CREATE TABLE IF NOT EXISTS blockchain_formulations (
  id             BIGSERIAL PRIMARY KEY,
  formulation_id TEXT UNIQUE NOT NULL,   -- bytes32 hex from contract
  product_name   TEXT NOT NULL,
  manufacturer   TEXT NOT NULL,
  recorded_at    TIMESTAMPTZ,
  tx_hash        TEXT,
  block_number   BIGINT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Add blockchain columns to existing application tables ────────

-- profiles: link wallet address to user account
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_address        TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blockchain_role_granted BOOLEAN DEFAULT false;

-- collections: track on-chain submission
ALTER TABLE collections ADD COLUMN IF NOT EXISTS tx_hash           TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS blockchain_synced BOOLEAN DEFAULT false;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS synced_at         TIMESTAMPTZ;

-- lab_tests: track on-chain submission
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS tx_hash             TEXT;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS blockchain_synced   BOOLEAN DEFAULT false;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS synced_at           TIMESTAMPTZ;

-- processing_steps: track on-chain submission
ALTER TABLE processing_steps ADD COLUMN IF NOT EXISTS tx_hash      TEXT;
ALTER TABLE processing_steps ADD COLUMN IF NOT EXISTS blockchain_synced BOOLEAN DEFAULT false;
ALTER TABLE processing_steps ADD COLUMN IF NOT EXISTS synced_at    TIMESTAMPTZ;

-- formulations: track on-chain formulation ID
ALTER TABLE formulations ADD COLUMN IF NOT EXISTS blockchain_id    TEXT;
ALTER TABLE formulations ADD COLUMN IF NOT EXISTS tx_hash          TEXT;
ALTER TABLE formulations ADD COLUMN IF NOT EXISTS blockchain_synced BOOLEAN DEFAULT false;
ALTER TABLE formulations ADD COLUMN IF NOT EXISTS synced_at        TIMESTAMPTZ;

-- ── Indexes for fast lookups ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blockchain_batches_collector   ON blockchain_batches(collector);
CREATE INDEX IF NOT EXISTS idx_blockchain_transfers_batch     ON blockchain_transfers(batch_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transfers_to        ON blockchain_transfers(to_addr);
CREATE INDEX IF NOT EXISTS idx_blockchain_quality_batch       ON blockchain_quality_tests(batch_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_processing_batch    ON blockchain_processing_steps(batch_id);

-- ── RLS Policies ─────────────────────────────────────────────────
-- All blockchain_ tables are read-only for authenticated users.
-- The sync service uses the service_role key and bypasses RLS.

ALTER TABLE blockchain_batches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_collections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_processing_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_quality_tests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transfers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_formulations     ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "blockchain_batches_read"          ON blockchain_batches          FOR SELECT TO authenticated USING (true);
CREATE POLICY "blockchain_collections_read"      ON blockchain_collections      FOR SELECT TO authenticated USING (true);
CREATE POLICY "blockchain_processing_steps_read" ON blockchain_processing_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "blockchain_quality_tests_read"    ON blockchain_quality_tests    FOR SELECT TO authenticated USING (true);
CREATE POLICY "blockchain_transfers_read"        ON blockchain_transfers        FOR SELECT TO authenticated USING (true);
CREATE POLICY "blockchain_formulations_read"     ON blockchain_formulations     FOR SELECT TO authenticated USING (true);
