import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // App.tsx onAuthStateChange will automatically handle navigation
      // and route to /complete-profile or /dashboard based on profile existence.
    } catch (err: any) {
      alert(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert(error.message);
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
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
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