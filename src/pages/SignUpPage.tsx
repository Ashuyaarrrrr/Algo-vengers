import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

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

type UserRole = 'farmer' | 'lab' | 'processor' | 'manufacturer' | 'distributor' | 'retailer' | 'admin';

export default function SignUpPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 🔥 EMAIL SIGNUP
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password || !role) {
      setErrorMsg('Please fill all required fields (email, password, role)');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            location,
            username,
          },
          // This ensures the user is auto-confirmed so they can login right away
          // If email confirmation is required in Supabase settings, remove this
          // emailRedirectTo: undefined,
        },
      });

      if (error) throw error;

      // Step 2: Check if user was created
      if (!data.user) {
        throw new Error('Account creation failed. Please try again.');
      }

      console.log('✅ User created:', data.user.id);
      console.log('📬 Session after signup:', data.session ? 'exists' : 'null (email confirmation required)');

      // Step 3: If we have a session (email confirmation disabled), create profile & redirect
      if (data.session) {
        console.log('🔐 Session available — creating profile...');
        
        // Profile is also created by DB trigger, but upsert here for immediate consistency
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          name: fullName || username || email.split('@')[0],
          email,
          role,
          location,
        }, { onConflict: 'id' });

        if (profileError) {
          // Profile creation failed, but auth user exists
          // The DB trigger should have created a minimal profile
          console.warn('⚠️ Profile upsert warning:', profileError.message);
          // Don't throw — the trigger should have handled it
        }

        console.log('➡️ Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });

      } else {
        // Email confirmation is required
        // The DB trigger will create the profile when the user confirms their email
        console.log('📬 Email confirmation required');
        setSuccessMsg(
          `✅ Account created! Please check your email (${email}) and click the confirmation link, then come back to sign in.`
        );
      }

    } catch (err: any) {
      console.error('💥 Signup error:', err);
      let message = err.message || 'Something went wrong';
      
      // Make error messages more user-friendly
      if (message.includes('User already registered') || message.includes('already been registered')) {
        message = 'This email is already registered. Please sign in instead.';
      } else if (message.includes('Password should be')) {
        message = 'Password must be at least 6 characters long.';
      } else if (message.includes('Unable to validate email')) {
        message = 'Please enter a valid email address.';
      }
      
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 GOOGLE SIGNUP — DO NOT MODIFY
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-500">Join the HerbChain network</p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-xl shadow border">
          
          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              {successMsg}
              <div className="mt-3">
                <Link to="/login" className="font-medium underline">
                  Go to Login →
                </Link>
              </div>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSignUp} className="space-y-5">

              {/* Full Name */}
              <div>
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ashu Vimal"
                />
              </div>

              {/* Email */}
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ashu@gmail.com"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ashu123"
                />
              </div>

              {/* Password */}
              <div>
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <Label>Role *</Label>
                <Select onValueChange={(val) => setRole(val as UserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">🌿 Farmer</SelectItem>
                    <SelectItem value="lab">🔬 Lab Technician</SelectItem>
                    <SelectItem value="processor">⚙️ Processor</SelectItem>
                    <SelectItem value="manufacturer">🏭 Manufacturer</SelectItem>
                    <SelectItem value="distributor">🚚 Distributor</SelectItem>
                    <SelectItem value="retailer">🏪 Retailer</SelectItem>
                    <SelectItem value="admin">🛡️ Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Uttarakhand, India"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Create Account'}
              </Button>

            </form>
          )}

          {!successMsg && (
            <>
              {/* Divider */}
              <div className="my-6 text-center text-gray-400 text-sm">
                OR
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                Continue with Google
              </Button>
            </>
          )}

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/login">Already have an account? Sign in</Link>
          </p>
        </div>

      </div>
    </div>
  );
}