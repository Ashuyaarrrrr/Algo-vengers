import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { DEMO_USERS } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    // For demo purposes, we will assign a demo user ID based on matching the username roughly
    // Or default to 'farmer-1' if not found.
    const userToLogin = DEMO_USERS.find(u => 
      u.name.toLowerCase().includes(username.toLowerCase()) || 
      u.id.includes(username.toLowerCase())
    ) || DEMO_USERS[0];

    login(userToLogin.id);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="w-full max-w-md animate-fade-in mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-gray-500">
            Sign in to your HerbChain account
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-600 font-medium">Username</Label>
              <Input
                id="username"
                placeholder="jbj"
                className="bg-[#eff5ff] border-gray-200"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-600 font-medium">Password</Label>
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

            <Button type="submit" className="w-full bg-[#10b981] hover:bg-[#059669] text-white">
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <div>
              <Link to="/signup" className="text-sm text-gray-500 hover:text-gray-700">
                Don't have an account? Create one
              </Link>
            </div>
            <div>
              <Link to="/verify/ASHVITAL-001-2026" className="text-sm text-[#10b981] hover:text-[#059669]">
                Or scan a product as a consumer →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
