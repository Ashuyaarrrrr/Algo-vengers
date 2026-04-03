import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_LABELS } from '@/lib/demo-data';
import {
  Leaf, FlaskConical, Factory, Package, ShieldCheck,
  LayoutDashboard, LogOut, Menu, X, ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const NAV_BY_ROLE = {
  farmer: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Collection', path: '/farmer/collect', icon: Leaf },
    { label: 'History', path: '/farmer/history', icon: Leaf },
  ],
  lab: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Pending Tests', path: '/lab/pending', icon: FlaskConical },
    { label: 'All Tests', path: '/lab/tests', icon: FlaskConical },
  ],
  processor: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Batches', path: '/processor/batches', icon: Factory },
    { label: 'New Process', path: '/processor/process', icon: Factory },
  ],
  manufacturer: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Formulate', path: '/manufacturer/formulate', icon: Package },
    { label: 'QR Codes', path: '/manufacturer/qr-codes', icon: Package },
  ],
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Network', path: '/admin/network', icon: ShieldCheck },
    { label: 'Compliance', path: '/admin/compliance', icon: ShieldCheck },
    { label: 'Users', path: '/admin/users', icon: ShieldCheck },
  ],
};

const ROLE_ICONS = {
  farmer: Leaf,
  lab: FlaskConical,
  processor: Factory,
  manufacturer: Package,
  admin: ShieldCheck,
};

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_BY_ROLE[user.role] || [];
  const RoleIcon = ROLE_ICONS[user.role];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-2 font-heading font-bold text-lg">
              <Leaf className="h-6 w-6 text-primary" />
              <span>AyurTrace</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <RoleIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">{user.name}</span>
              <span className="text-muted-foreground">· {ROLE_LABELS[user.role]}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-b bg-card animate-fade-in">
          <nav className="container py-2 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
