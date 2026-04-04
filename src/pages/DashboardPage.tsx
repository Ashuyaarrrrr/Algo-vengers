import { useAuthStore } from '@/lib/auth-store';
import { Navigate } from 'react-router-dom';
import FarmerDashboard from '@/components/dashboards/FarmerDashboard';
import LabDashboard from '@/components/dashboards/LabDashboard';
import ProcessorDashboard from '@/components/dashboards/ProcessorDashboard';
import ManufacturerDashboard from '@/components/dashboards/ManufacturerDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';

const DASHBOARDS = {
  farmer: FarmerDashboard,
  lab: LabDashboard,
  processor: ProcessorDashboard,
  manufacturer: ManufacturerDashboard,
  admin: AdminDashboard,
} as const;

export default function DashboardPage() {
  const { user } = useAuthStore();

  // ProtectedRoute already guards this — but defensive check anyway
  if (!user) return <Navigate to="/login" replace />;

  // If role isn't resolved yet (e.g. mid-fetch), show a brief spinner
  // rather than a crash screen
  if (!user.role) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const Dashboard = DASHBOARDS[user.role as keyof typeof DASHBOARDS];

  // Role exists but doesn't match any known dashboard
  if (!Dashboard) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium">Unknown role: "{user.role}"</p>
        <p className="text-gray-500 text-sm mt-2">Please contact support or re-complete your profile.</p>
      </div>
    );
  }

  return <Dashboard />;
}
