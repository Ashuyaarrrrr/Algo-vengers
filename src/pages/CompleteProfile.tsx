import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function CompleteProfile() {
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole | ''>('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!role) {
      alert('Please select a role');
      return;
    }

    setLoading(true);

    // ✅ Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('User not found');
      setLoading(false);
      return;
    }

    // ✅ FIX: use 'profiles' table instead of 'users'
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      name: user.user_metadata?.full_name || '',
      role,
      location,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // ✅ Role-based redirect
    if (role === 'farmer') navigate('/farmer-dashboard');
    else if (role === 'lab') navigate('/lab-dashboard');
    else if (role === 'processor') navigate('/processor-dashboard');
    else if (role === 'manufacturer') navigate('/manufacturer-dashboard');
    else navigate('/admin-dashboard');

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow border">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Complete Your Profile
        </h2>

        <div className="space-y-5">

          {/* Role */}
          <div>
            <Label>Select Your Role</Label>
            <Select onValueChange={(val) => setRole(val as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your role" />
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
              placeholder="e.g. Uttarakhand, India"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>

        </div>
      </div>
    </div>
  );
}