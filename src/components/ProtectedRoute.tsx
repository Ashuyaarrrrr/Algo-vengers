import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import type { UserRole } from '@/lib/demo-data';

interface Props {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isInitialized } = useAuthStore();

  // Wait for Supabase to resolve auth state before deciding to redirect
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Role check → redirect to dashboard if not allowed
  if (allowedRoles && user.role && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children (for wrapping) or Outlet (for layout routes)
  return children ? <>{children}</> : <Outlet />;
}
