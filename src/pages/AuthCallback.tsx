import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';

export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log("🔥 Getting session...");

        // ✅ IMPORTANT: getSession instead of getUser
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log("SESSION:", session, error);

        const user = session?.user;

        if (!user) {
          console.log("❌ No session user");
          navigate('/login');
          return;
        }

        console.log("✅ User:", user.id);

        // 🔥 PROFILE CHECK
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setUser({
          id: user.id,
          email: user.email,
          isProfileComplete: !!profile,
        });

        if (!profile) {
          console.log("➡️ NEW USER");
          window.location.href = '/complete-profile';
        } else {
          console.log("➡️ EXISTING USER");
          window.location.href = '/dashboard';
        }

      } catch (err) {
        console.error("💥 ERROR:", err);
        navigate('/login');
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Signing you in...</p>
    </div>
  );
}