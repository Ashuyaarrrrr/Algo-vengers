import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UserRole = 'farmer' | 'lab' | 'processor' | 'manufacturer' | 'admin';

const ROLE_REDIRECT: Record<UserRole, string> = {
  farmer: '/dashboard',
  lab: '/dashboard',
  processor: '/dashboard',
  manufacturer: '/dashboard',
  admin: '/dashboard',
};

export default function CompleteProfile() {
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole | ''>('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async () => {
    setErrorMsg('');

    if (!role) {
      setErrorMsg('Please select a role before continuing.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get the authenticated user
      console.log('🔍 Getting current user...');
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Auth error: ${authError.message}`);
      }

      const user = authData?.user;
      if (!user) {
        console.error('❌ No user found in session');
        throw new Error('No authenticated user found. Please log in again.');
      }

      console.log('✅ User found:', user.id, user.email);

      // Step 2: Upsert profile (handles both new and returning users safely)
      // Only include columns that exist in the profiles table schema
      console.log('💾 Upserting profile with role:', role);
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role,
            location,
          },
          { onConflict: 'id' }
        );


      if (profileError) {
        console.error('❌ Profile upsert error:', profileError);
        throw new Error(`Failed to save profile: ${profileError.message}`);
      }

      console.log('✅ Profile saved successfully');

      // Step 3: Update local auth store
      setUser({
        id: user.id,
        email: user.email,
        role,
        isProfileComplete: true,
      });

      // Step 4: Navigate based on role
      const redirectPath = ROLE_REDIRECT[role] ?? '/dashboard';
      console.log('➡️ Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });

    } catch (err: any) {
      console.error('💥 CompleteProfile error:', err);
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      // Always reset loading — no matter what happens
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow border">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Tell us about your role in the supply chain</p>
        </div>

        <div className="space-y-5">

          {/* Error message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Role */}
          <div>
            <Label className="text-gray-700 font-medium">Your Role *</Label>
            <Select onValueChange={(val) => setRole(val as UserRole)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose your role in the supply chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farmer">🌿 Farmer</SelectItem>
                <SelectItem value="lab">🔬 Lab Technician</SelectItem>
                <SelectItem value="processor">⚙️ Processor</SelectItem>
                <SelectItem value="manufacturer">🏭 Manufacturer</SelectItem>
                <SelectItem value="admin">🛡️ Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <Label className="text-gray-700 font-medium">Location</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Uttarakhand, India"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-11"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving Profile...
              </span>
            ) : (
              'Create Profile →'
            )}
          </Button>

        </div>
      </div>
    </div>
  );
}