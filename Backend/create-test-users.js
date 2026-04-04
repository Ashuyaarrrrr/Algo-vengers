/**
 * HerbChain — Create Test Users Script
 * Creates pre-confirmed test accounts for all supply chain roles
 * using Supabase Admin API (bypasses email confirmation)
 * 
 * Usage: node create-test-users.js
 * 
 * IMPORTANT: You need to add your SUPABASE_SERVICE_ROLE_KEY to the .env file first!
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// ─── CONFIG ────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://hxatmdggoxpvccjfexpx.supabase.co';

// Get service role key from environment or fallback
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment!');
  console.error('');
  console.error('To fix this:');
  console.error('1. Go to Supabase Dashboard → Project Settings → API');
  console.error('2. Copy the "service_role" key (not the anon key)');
  console.error('3. Add it to your .env file as:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here');
  console.error('4. Run this script again');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

// ─── TEST USERS ─────────────────────────────────────────────────────────────
const TEST_USERS = [
  {
    email: 'farmer@herbchain.test',
    password: 'herbchain123',
    role: 'farmer',
    name: 'Rajesh Kumar (Test Farmer)',
    location: 'Uttarakhand, India',
  },
  {
    email: 'lab@herbchain.test',
    password: 'herbchain123',
    role: 'lab',
    name: 'Dr. Priya Nair (Test Lab)',
    location: 'Bangalore, Karnataka',
  },
  {
    email: 'manufacturer@herbchain.test',
    password: 'herbchain123',
    role: 'manufacturer',
    name: 'Lakshmi Devi (Test Manufacturer)',
    location: 'Mumbai, Maharashtra',
  },
  {
    email: 'distributor@herbchain.test',
    password: 'herbchain123',
    role: 'distributor',
    name: 'Suresh Patel (Test Distributor)',
    location: 'Delhi, India',
  },
  {
    email: 'retailer@herbchain.test',
    password: 'herbchain123',
    role: 'retailer',
    name: 'Anita Singh (Test Retailer)',
    location: 'Chennai, Tamil Nadu',
  },
  {
    email: 'admin@herbchain.test',
    password: 'herbchain123',
    role: 'admin',
    name: 'Admin User (Test Admin)',
    location: 'New Delhi, India',
  },
];

// ─── MAIN ───────────────────────────────────────────────────────────────────
async function createTestUsers() {
  console.log('🌿 HerbChain — Creating Test Users');
  console.log('═══════════════════════════════════════');
  console.log('');

  const results = [];

  for (const user of TEST_USERS) {
    console.log(`👤 Creating ${user.role.toUpperCase()} user: ${user.email}`);

    try {
      // Step 1: Create auth user (admin API creates pre-confirmed users)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Mark email as already confirmed!
        user_metadata: {
          full_name: user.name,
          role: user.role,
          location: user.location,
        },
      });

      if (authError) {
        // If user already exists, try to update them
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
          console.log(`   ⚠️  User already exists — attempting to update profile...`);
          
          // List users to find the existing one
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === user.email);
          
          if (existingUser) {
            // Update profile
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .upsert({
                id: existingUser.id,
                email: user.email,
                name: user.name,
                role: user.role,
                location: user.location,
              }, { onConflict: 'id' });

            if (profileError) {
              console.log(`   ❌ Profile update failed: ${profileError.message}`);
            } else {
              console.log(`   ✅ Profile updated for existing user`);
              results.push({ ...user, status: 'updated', id: existingUser.id });
            }
          }
          continue;
        }
        
        console.log(`   ❌ Auth creation failed: ${authError.message}`);
        results.push({ ...user, status: 'failed', error: authError.message });
        continue;
      }

      console.log(`   ✅ Auth user created: ${authData.user.id}`);

      // Step 2: Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          location: user.location,
        }, { onConflict: 'id' });

      if (profileError) {
        console.log(`   ❌ Profile creation failed: ${profileError.message}`);
        results.push({ ...user, status: 'partial', id: authData.user.id, error: profileError.message });
      } else {
        console.log(`   ✅ Profile created with role: ${user.role}`);
        results.push({ ...user, status: 'success', id: authData.user.id });
      }

    } catch (err) {
      console.log(`   ❌ Unexpected error: ${err.message}`);
      results.push({ ...user, status: 'failed', error: err.message });
    }

    console.log('');
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════');
  
  const successful = results.filter(r => r.status === 'success' || r.status === 'updated');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`✅ Successfully created/updated: ${successful.length}/${TEST_USERS.length}`);
  
  if (successful.length > 0) {
    console.log('');
    console.log('🔑 TEST CREDENTIALS (all use password: herbchain123)');
    console.log('─────────────────────────────────────────────────────');
    for (const user of successful) {
      console.log(`  ${user.role.padEnd(14)} → ${user.email}`);
    }
  }
  
  if (failed.length > 0) {
    console.log('');
    console.log('❌ Failed:');
    for (const user of failed) {
      console.log(`  ${user.role}: ${user.error}`);
    }
  }

  console.log('');
  console.log('💡 All test users can log in at: http://localhost:8080/login');
  console.log('   Password for all accounts: herbchain123');
}

createTestUsers().catch(console.error);
