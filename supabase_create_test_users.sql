-- ============================================================
-- HerbChain — Create Test Users (Pre-confirmed)
-- Run this in Supabase SQL Editor
-- This creates test accounts for all supply chain roles
-- Password for ALL accounts: herbchain123
-- ============================================================

-- ⚠️  IMPORTANT: This uses Supabase's internal auth schema.
-- The encrypted password below is bcrypt of "herbchain123"

DO $$
DECLARE
  farmer_id   UUID := gen_random_uuid();
  lab_id      UUID := gen_random_uuid();
  mfr_id      UUID := gen_random_uuid();
  dist_id     UUID := gen_random_uuid();
  retail_id   UUID := gen_random_uuid();
  admin_id    UUID := gen_random_uuid();
  
  -- bcrypt hash of "herbchain123" (cost 10)
  hashed_pw   TEXT := '$2a$10$PbMcwSmB6eI4A5vlM0c0oeKNhsHi5Sp7PBHkAZ.H5dFfO7JQJ7qXe';
BEGIN

  -- ── Farmer ──────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    farmer_id,
    '00000000-0000-0000-0000-000000000000',
    'farmer@herbchain.test',
    hashed_pw,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Rajesh Kumar (Test Farmer)","role":"farmer","location":"Uttarakhand, India"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  -- Upsert farmer profile
  INSERT INTO public.profiles (id, email, name, role, location)
  SELECT id, 'farmer@herbchain.test', 'Rajesh Kumar (Test Farmer)', 'farmer', 'Uttarakhand, India'
  FROM auth.users WHERE email = 'farmer@herbchain.test'
  ON CONFLICT (id) DO UPDATE SET role = 'farmer', name = 'Rajesh Kumar (Test Farmer)';

  -- ── Lab Technician ────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    lab_id,
    '00000000-0000-0000-0000-000000000000',
    'lab@herbchain.test',
    hashed_pw,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dr. Priya Nair (Test Lab)","role":"lab","location":"Bangalore, Karnataka"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, name, role, location)
  SELECT id, 'lab@herbchain.test', 'Dr. Priya Nair (Test Lab)', 'lab', 'Bangalore, Karnataka'
  FROM auth.users WHERE email = 'lab@herbchain.test'
  ON CONFLICT (id) DO UPDATE SET role = 'lab', name = 'Dr. Priya Nair (Test Lab)';

  -- ── Manufacturer ──────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    mfr_id,
    '00000000-0000-0000-0000-000000000000',
    'manufacturer@herbchain.test',
    hashed_pw,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Lakshmi Devi (Test Manufacturer)","role":"manufacturer","location":"Mumbai, Maharashtra"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, name, role, location)
  SELECT id, 'manufacturer@herbchain.test', 'Lakshmi Devi (Test Manufacturer)', 'manufacturer', 'Mumbai, Maharashtra'
  FROM auth.users WHERE email = 'manufacturer@herbchain.test'
  ON CONFLICT (id) DO UPDATE SET role = 'manufacturer', name = 'Lakshmi Devi (Test Manufacturer)';

  -- ── Distributor ───────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    dist_id,
    '00000000-0000-0000-0000-000000000000',
    'distributor@herbchain.test',
    hashed_pw,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Suresh Patel (Test Distributor)","role":"distributor","location":"Delhi, India"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, name, role, location)
  SELECT id, 'distributor@herbchain.test', 'Suresh Patel (Test Distributor)', 'distributor', 'Delhi, India'
  FROM auth.users WHERE email = 'distributor@herbchain.test'
  ON CONFLICT (id) DO UPDATE SET role = 'distributor', name = 'Suresh Patel (Test Distributor)';

  -- ── Retailer ──────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    retail_id,
    '00000000-0000-0000-0000-000000000000',
    'retailer@herbchain.test',
    hashed_pw,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Anita Singh (Test Retailer)","role":"retailer","location":"Chennai, Tamil Nadu"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, name, role, location)
  SELECT id, 'retailer@herbchain.test', 'Anita Singh (Test Retailer)', 'retailer', 'Chennai, Tamil Nadu'
  FROM auth.users WHERE email = 'retailer@herbchain.test'
  ON CONFLICT (id) DO UPDATE SET role = 'retailer', name = 'Anita Singh (Test Retailer)';

  -- ── Admin ────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@herbchain.test',
    hashed_pw,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User (Test Admin)","role":"admin","location":"New Delhi, India"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, email, name, role, location)
  SELECT id, 'admin@herbchain.test', 'Admin User (Test Admin)', 'admin', 'New Delhi, India'
  FROM auth.users WHERE email = 'admin@herbchain.test'
  ON CONFLICT (id) DO UPDATE SET role = 'admin', name = 'Admin User (Test Admin)';

  RAISE NOTICE '✅ Test users created/updated successfully!';
  RAISE NOTICE '🔑 Email: farmer@herbchain.test | Password: herbchain123';
  RAISE NOTICE '🔑 Email: lab@herbchain.test | Password: herbchain123';
  RAISE NOTICE '🔑 Email: manufacturer@herbchain.test | Password: herbchain123';
  RAISE NOTICE '🔑 Email: distributor@herbchain.test | Password: herbchain123';
  RAISE NOTICE '🔑 Email: retailer@herbchain.test | Password: herbchain123';
  RAISE NOTICE '🔑 Email: admin@herbchain.test | Password: herbchain123';

END $$;

-- Verify the users were created
SELECT 
  u.email,
  p.role,
  p.name,
  u.email_confirmed_at IS NOT NULL AS is_confirmed
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email LIKE '%@herbchain.test'
ORDER BY p.role;
