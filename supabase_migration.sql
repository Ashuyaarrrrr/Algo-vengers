-- supabase_migration.sql
-- Run this in your Supabase SQL Editor to fix the missing column issue

-- 1. Add the missing isSustainable column to the collections table
ALTER TABLE collections ADD COLUMN IF NOT EXISTS "isSustainable" BOOLEAN DEFAULT true;

-- 2. Reload the schema cache so Supabase immediately recognizes the new column
NOTIFY pgrst, 'reload schema';
