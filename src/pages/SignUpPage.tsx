import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { DEMO_USERS, type UserRole } from '@/lib/demo-data';
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

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [location, setLocation] = useState('');

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !role) return;
    
    // For demo purposes, we will assign a matching demo user ID based on role
    // if the user tries to sign up. In a real app we'd create a new user.
    const userToLogin = DEMO_USERS.find(u => u.role === role);
    if (userToLogin) {
      login(userToLogin.id);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="w-full max-w-md animate-fade-in mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-muted-foreground text-gray-500">
            Join the HerbChain network
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-600 font-medium">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Your full name"
                className="bg-gray-100/50 border-gray-200"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
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

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-600 font-medium">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)} required>
                <SelectTrigger className="bg-gray-100/50 border-gray-200 w-full text-left justify-between">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="lab">Lab Technician</SelectItem>
                  <SelectItem value="processor">Processor</SelectItem>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-600 font-medium">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Uttarakhand, India"
                className="bg-gray-100/50 border-gray-200"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full bg-[#10b981] hover:bg-[#059669] text-white">
              Create Account
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
