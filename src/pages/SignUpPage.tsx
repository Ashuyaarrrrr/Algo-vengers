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

type UserRole = 'farmer' | 'lab' | 'processor' | 'manufacturer' | 'admin';

export default function SignUpPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 EMAIL SIGNUP
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !role) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

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
        },
      });

      if (error) throw error;

      const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
        const timeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        });
        return Promise.race([Promise.resolve(promise), timeout]);
      };

      if (data.user) {
        // Upsert the profile explicitly with a timeout guard
        const upsertPromise = supabase.from('profiles').upsert({
          id: data.user.id,
          name: fullName || '', 
          email,
          role,
          location,
        }).then(res => res);

        const upsertRes: any = await withTimeout(upsertPromise, 10000, 'Profile creation');
        if (upsertRes.error) throw new Error(upsertRes.error.message);
      }

      // 🔥 ensure session exists (important fix)
      const { data: sessionData } = await withTimeout(supabase.auth.getSession(), 8000, 'Session check');

      if (!sessionData.session) {
        const { error: signInError } = await withTimeout(supabase.auth.signInWithPassword({
          email,
          password,
        }), 8000, 'Sign in');
        
        // If email confirmation is required, signInWithPassword will return an error
        // like "Email not confirmed". We should inform the user instead of hanging.
        if (signInError) {
           throw signInError;
        }
      }

      navigate('/dashboard');

    } catch (err: any) {
      alert(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 GOOGLE SIGNUP
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:8080/auth/callback',
      },
    });

    if (error) {
      alert(error.message);
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
              <Label>Email</Label>
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
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div>
              <Label>Role</Label>
              <Select onValueChange={(val) => setRole(val as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="lab">Lab Technician</SelectItem>
                  <SelectItem value="processor">Processor</SelectItem>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
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
              className="w-full bg-green-600 text-white"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </Button>

          </form>

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

          {/* Login */}
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/login">Already have an account? Sign in</Link>
          </p>
        </div>

      </div>
    </div>
  );
}