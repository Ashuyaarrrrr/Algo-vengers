-- ============================================================
-- HerbChain — Email Auth Fix SQL
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- ── 1. Ensure profiles table has all required columns ────────────

-- Add email column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add name column if missing (some setups used "full_name")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Add location column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Add role column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- ── 2. Enable RLS on profiles ────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ── 3. Drop all old/conflicting policies on profiles ────────────
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- ── 4. Create clean, correct RLS policies ────────────────────────

-- SELECT: users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- INSERT: authenticated users can create their own profile
-- The WITH CHECK ensures they can only insert their own ID
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: authenticated users can update only their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 5. Create a database trigger for automatic profile creation ───
-- This ensures profiles are created even if the frontend fails

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, location)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', NULL),
    COALESCE(NEW.raw_user_meta_data->>'location', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    location = COALESCE(EXCLUDED.location, profiles.location);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. Fix distributor/retailer roles in existing data ───────────
-- (No changes needed to schema, roles are stored as text)

-- ── 7. Notify PostgREST to reload schema ─────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── Done! ────────────────────────────────────────────────────────
-- Summary of what this SQL does:
-- 1. Adds missing columns to profiles table
-- 2. Enables RLS with correct policies (INSERT/SELECT/UPDATE)
-- 3. Creates a trigger to auto-create profiles on signup
--    (so even if frontend profile creation fails, the DB trigger catches it)
-- 4. Reloads schema cache
