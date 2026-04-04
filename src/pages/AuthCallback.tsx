import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';

/**
 * This page is landed on after:
 *   - Email/password login (navigated from LoginPage)
 *   - Google OAuth redirect (from Supabase)
 *
 * Auth state is resolved by the onAuthStateChange listener in App.tsx,
 * which sets the store and triggers navigation. This page just waits.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return; // still loading — wait

    if (!user) {
      // Auth resolved but no session — send to login
      navigate('/login', { replace: true });
      return;
    }

    if (!user.isProfileComplete) {
      // Authenticated but no profile yet — complete profile
      navigate('/complete-profile', { replace: true });
    } else {
      // Fully authenticated — go to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [isInitialized, user]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Signing you in...</p>
    </div>
  );
}