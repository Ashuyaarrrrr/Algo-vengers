import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS } from '@/lib/demo-data';
import {
  Leaf, FlaskConical, Factory, Package, ShieldCheck,
  LayoutDashboard, LogOut, Menu, X, Truck, ShoppingBag,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletConnect } from '@/components/WalletConnect';

const NAV_BY_ROLE: Record<string, { label: string; path: string; icon: React.ElementType }[]> = {
  farmer: [
    { label: 'Dashboard',      path: '/dashboard',       icon: LayoutDashboard },
    { label: 'New Collection', path: '/farmer/collect',  icon: Leaf },
    { label: 'History',        path: '/farmer/history',  icon: Leaf },
  ],
  lab: [
    { label: 'Dashboard',      path: '/dashboard',       icon: LayoutDashboard },
    { label: 'Pending Tests',  path: '/lab/pending',     icon: FlaskConical },
    { label: 'All Tests',      path: '/lab/tests',       icon: FlaskConical },
  ],
  processor: [
    { label: 'Dashboard',      path: '/dashboard',       icon: LayoutDashboard },
    { label: 'Batches',        path: '/processor/batches', icon: Factory },
    { label: 'New Process',    path: '/processor/process', icon: Factory },
  ],
  manufacturer: [
    { label: 'Dashboard',      path: '/dashboard',             icon: LayoutDashboard },
    { label: 'Formulate',      path: '/manufacturer/formulate', icon: Package },
    { label: 'QR Codes',       path: '/manufacturer/qr-codes', icon: Package },
  ],
  distributor: [
    { label: 'Dashboard',      path: '/dashboard',        icon: LayoutDashboard },
    { label: 'Ship Batch',     path: '/distributor/ship', icon: Truck },
  ],
  retailer: [
    { label: 'Dashboard',      path: '/dashboard',          icon: LayoutDashboard },
    { label: 'Verify Batch',   path: '/retailer/receive',   icon: ShoppingBag },
  ],
  admin: [
    { label: 'Dashboard',   path: '/dashboard',        icon: LayoutDashboard },
    { label: 'Network',     path: '/admin/network',    icon: ShieldCheck },
    { label: 'Compliance',  path: '/admin/compliance', icon: ShieldCheck },
    { label: 'Users',       path: '/admin/users',      icon: ShieldCheck },
  ],
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  farmer:       Leaf,
  lab:          FlaskConical,
  processor:    Factory,
  manufacturer: Package,
  distributor:  Truck,
  retailer:     ShoppingBag,
  admin:        ShieldCheck,
};

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems  = NAV_BY_ROLE[user.role as string] || [];
  const RoleIcon  = ROLE_ICONS[user.role as string] || Leaf;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between gap-2">

          {/* Logo + hamburger */}
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-2 font-heading font-bold text-lg">
              <Leaf className="h-6 w-6 text-primary" />
              <span>HerbChain</span>
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
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: wallet + user info + logout */}
          <div className="flex items-center gap-2">
            {/* MetaMask wallet connect */}
            <WalletConnect />

            {/* User info (hidden on very small screens) */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm ml-1">
              <RoleIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">{(user as any).name ?? user.email}</span>
              <span className="text-muted-foreground hidden md:inline">
                · {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Mobile nav drawer ────────────────────────────────────── */}
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
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {/* Wallet connect in mobile drawer too */}
            <div className="px-3 py-2">
              <WalletConnect />
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
