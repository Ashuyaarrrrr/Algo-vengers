import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Sign in with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Login failed — no user returned. Please try again.');
      }

      console.log('✅ Login success:', data.user.id);

      // Step 2: Fetch profile to determine where to redirect
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('⚠️ Profile fetch warning:', profileError.message);
        // Profile fetch failed — redirect to complete-profile as fallback
        navigate('/complete-profile', { replace: true });
        return;
      }

      // Step 3: Update local auth store immediately so no flicker
      useAuthStore.getState().setUser({
        id: data.user.id,
        email: data.user.email,
        role: profile?.role,
        isProfileComplete: !!profile?.role,
      });

      // Step 4: Route based on profile existence
      if (profile?.role) {
        console.log(`➡️ Redirecting to dashboard (role: ${profile.role})`);
        navigate('/dashboard', { replace: true });
      } else {
        console.log('➡️ No role found — redirecting to complete-profile');
        navigate('/complete-profile', { replace: true });
      }

    } catch (err: any) {
      console.error('💥 Login error:', err);
      let message = err.message || 'Failed to sign in';
      
      // Make Supabase error messages user-friendly
      if (message.includes('Invalid login credentials')) {
        message = 'Incorrect email or password. Please try again.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Please confirm your email address first. Check your inbox for the confirmation link.';
      } else if (message.includes('Too many requests')) {
        message = 'Too many login attempts. Please wait a few minutes and try again.';
      }
      
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 GOOGLE SIGNIN — DO NOT MODIFY
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="w-full max-w-md animate-fade-in mx-auto">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500">
            Sign in to your HerbChain account
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          
          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-600 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                className="bg-[#eff5ff] border-gray-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-600 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="•••"
                className="bg-[#eff5ff] border-gray-200 tracking-widest"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing In...
                </span>
              ) : 'Sign In'}
            </Button>
          </form>

          <div className="my-6 text-center text-gray-400 text-sm">
            OR
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
          
          <div className="mt-6 text-center space-y-2">
            <div>
              <Link 
                to="/signup" 
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Don't have an account? Create one
              </Link>
            </div>

            <div>
              <Link 
                to="/verify/ASHVITAL-001-2026" 
                className="text-sm text-[#10b981] hover:text-[#059669]"
              >
                Or scan a product as a consumer →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}