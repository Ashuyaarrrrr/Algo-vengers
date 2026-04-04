-- ============================================================
-- Fix: Collections RLS — allow any authenticated user to SELECT
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the restrictive farmer-only SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view their own collections" ON collections;
DROP POLICY IF EXISTS "Farmers can view their own collections" ON collections;
DROP POLICY IF EXISTS "Collections are viewable by owner" ON collections;

-- Allow ALL authenticated users to read collections
-- (Manufacturers, Labs, and Processors all need to see batch IDs)
CREATE POLICY IF NOT EXISTS "Collections viewable by authenticated users"
  ON collections FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── Also verify INSERT / UPDATE policies still cover farmers ──
-- (Only add if missing — won't error if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'collections'
      AND cmd = 'INSERT'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can insert collections"
        ON collections FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL);
    $policy$;
  END IF;
END $$;
