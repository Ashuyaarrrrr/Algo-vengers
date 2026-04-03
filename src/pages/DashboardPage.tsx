import { useAuthStore } from '@/lib/auth-store';
import { Navigate } from 'react-router-dom';
import FarmerDashboard from '@/components/dashboards/FarmerDashboard';
import LabDashboard from '@/components/dashboards/LabDashboard';
import ProcessorDashboard from '@/components/dashboards/ProcessorDashboard';
import ManufacturerDashboard from '@/components/dashboards/ManufacturerDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  const dashboards = {
    farmer: FarmerDashboard,
    lab: LabDashboard,
    processor: ProcessorDashboard,
    manufacturer: ManufacturerDashboard,
    admin: AdminDashboard,
  };

  const Dashboard = dashboards[user.role];
  return <Dashboard />;
}
