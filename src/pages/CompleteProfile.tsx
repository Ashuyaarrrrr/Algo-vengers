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
      console.log('🔍 Resolving user identity...');

      // Helper to prevent infinite hangs on Supabase promises
      const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
        const timeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        });
        return Promise.race([Promise.resolve(promise), timeout]);
      };

      // Step 1: Always verify the active session directly to prevent desyncs
      console.log('🔄 Fetching active session from Supabase...');
      const sessionRes = await withTimeout(
        supabase.auth.getSession(),
        8000,
        'Session verification'
      );

      if (sessionRes.error) {
        throw new Error(`Session error: ${sessionRes.error.message}`);
      }

      const sessionUser = sessionRes.data?.session?.user;
      if (!sessionUser) {
        throw new Error('Your session has expired or is invalid. Please log in again.');
      }

      const userId = sessionUser.id;
      const userEmail = sessionUser.email;
      const userName = sessionUser.user_metadata?.full_name;
      console.log('✅ User resolved:', userId);

      // Step 2: Upsert profile — safe for both new users and re-submits
      console.log('💾 Saving profile, role:', role);
      const upsertPromise = supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            name: userName || userEmail?.split('@')[0] || 'User',
            role,
            location,
          },
          { onConflict: 'id' }
        ).then(res => res);

      const { error: profileError } = await withTimeout(
        upsertPromise,
        10000,
        'Profile save'
      ) as any;

      if (profileError) {
        console.error('❌ Profile upsert error code:', profileError.code, profileError.message);
        // Provide actionable messages for common errors
        if (profileError.code === '42501') {
          throw new Error('Permission denied. Please check that RLS policies allow INSERT and UPDATE for authenticated users.');
        }
        throw new Error(`Failed to save profile: ${profileError.message}`);
      }

      console.log('✅ Profile saved successfully');

      // Step 3: Update local auth store so dashboard renders immediately
      useAuthStore.getState().setUser({
        id: userId,
        email: userEmail,
        role,
        isProfileComplete: true,
      });

      // Step 4: Navigate to dashboard
      console.log('➡️ Navigating to dashboard...');
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      console.error('💥 CompleteProfile submit error:', err);
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      // Always reset loading — guaranteed by finally block
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