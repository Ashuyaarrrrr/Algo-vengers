-- ============================================================
-- HerbChain — Shipments Table + Distributor/Retailer Support
-- Run this in your Supabase SQL Editor if not already done
-- ============================================================

-- 1. Create shipments table (for distributor → retailer shipments)
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  retailer_address TEXT,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'shipped',
  shipped_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tx_hash TEXT,
  blockchain_synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shipments viewable by authenticated users"
  ON shipments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert shipments"
  ON shipments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update shipments"
  ON shipments FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 2. Notify schema reload
NOTIFY pgrst, 'reload schema';
