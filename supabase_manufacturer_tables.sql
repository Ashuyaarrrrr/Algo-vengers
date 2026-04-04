-- ============================================================
-- Manufacturer Module: Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Formulations table
CREATE TABLE IF NOT EXISTS formulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Formulations viewable by everyone" ON formulations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert formulations" ON formulations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update formulations" ON formulations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 2. Formulation ingredients
CREATE TABLE IF NOT EXISTS formulation_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulation_id UUID REFERENCES formulations(id) ON DELETE CASCADE,
  herb_name TEXT NOT NULL,
  percentage NUMERIC NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE formulation_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Formulation ingredients viewable by everyone" ON formulation_ingredients
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert formulation ingredients" ON formulation_ingredients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulation_id UUID REFERENCES formulations(id) ON DELETE SET NULL,
  product_code TEXT UNIQUE NOT NULL,
  mfg_date DATE NOT NULL,
  exp_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. QR Codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  qr_url TEXT NOT NULL,
  qr_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QR codes viewable by everyone" ON qr_codes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert QR codes" ON qr_codes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update QR codes" ON qr_codes
  FOR UPDATE USING (auth.uid() IS NOT NULL);
