import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import ConsumerVerifyPage from "./pages/ConsumerVerifyPage";
import FarmerCollectPage from "./pages/FarmerCollectPage";
import FarmerHistoryPage from "./pages/FarmerHistoryPage";
import LabPendingPage from "./pages/LabPendingPage";
import LabTestsPage from "./pages/LabTestsPage";
import ProcessorBatchesPage from "./pages/ProcessorBatchesPage";
import ProcessorProcessPage from "./pages/ProcessorProcessPage";
import ManufacturerFormulatePage from "./pages/ManufacturerFormulatePage";
import ManufacturerQRPage from "./pages/ManufacturerQRPage";
import AdminNetworkPage from "./pages/AdminNetworkPage";
import AdminCompliancePage from "./pages/AdminCompliancePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import CompleteProfile from "./pages/CompleteProfile";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/auth-store";

const queryClient = new QueryClient();

/**
 * Auth initializer lives inside BrowserRouter so it can use useNavigate.
 * It is the SINGLE source of truth for resolving auth state on app load
 * and on every auth event (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
 */
function AuthInitializer() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // 🔥 CRITICAL FIX: Do NOT return a promise to onAuthStateChange!
        // Returning a Promise that makes PostgREST calls (which rely on getSession)
        // will cause a GoTrue WebLock deadlock and hang the entire app infinitely.
        void (async () => {
          console.log(`🔐 Auth event: ${event}`, session?.user?.id ?? 'no session');

          try {
          if (session?.user) {
            // Fetch profile from database
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileError) {
              console.error('⚠️ Profile fetch error:', profileError.message);
            }

            console.log('📋 Profile:', profile ? `role=${profile.role}` : 'none');

            // Update store
            useAuthStore.getState().setUser({
              id: session.user.id,
              email: session.user.email,
              role: profile?.role,
              isProfileComplete: !!profile,
            });

            // Only auto-navigate when on the callback/login page.
            // NEVER redirect away from /complete-profile — the user is
            // actively filling the form and a mid-submit redirect would
            // unmount the component and reset loading state.
            const navigablePages = ['/auth/callback', '/login', '/signup', '/'];
            const currentPath = window.location.pathname;
            const canAutoNavigate = navigablePages.includes(currentPath);

            if (canAutoNavigate) {
              if (!profile) {
                console.log('➡️ No profile — redirecting to complete-profile');
                navigate('/complete-profile', { replace: true });
              } else {
                console.log('➡️ Profile found — redirecting to dashboard');
                navigate('/dashboard', { replace: true });
              }
            }

          } else {
            useAuthStore.getState().logout();

            // Only redirect to login if currently on a protected page
            const protectedPaths = ['/dashboard', '/farmer', '/lab', '/processor', '/manufacturer', '/admin'];
            const isOnProtectedPage = protectedPaths.some(p => window.location.pathname.startsWith(p));
            if (isOnProtectedPage) {
              navigate('/login', { replace: true });
            }
          }
          } catch (err) {
            console.error('💥 Auth state change error:', err);
            useAuthStore.getState().logout();
          }
        })();
      }
    );

    // Safety net: mark initialized after 4s if onAuthStateChange never fires
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().isInitialized) {
        console.warn('⏱️ Auth timeout — marking as initialized with no session');
        useAuthStore.getState().logout();
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // Run once on mount

  return null;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Auth initializer inside BrowserRouter so it can use navigate/location */}
          <AuthInitializer />

          <Routes>

            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify/:qrCode" element={<ConsumerVerifyPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/farmer/collect" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerCollectPage /></ProtectedRoute>} />
              <Route path="/farmer/history" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerHistoryPage /></ProtectedRoute>} />

              <Route path="/lab/pending" element={<ProtectedRoute allowedRoles={['lab']}><LabPendingPage /></ProtectedRoute>} />
              <Route path="/lab/tests" element={<ProtectedRoute allowedRoles={['lab']}><LabTestsPage /></ProtectedRoute>} />

              <Route path="/processor/batches" element={<ProtectedRoute allowedRoles={['processor']}><ProcessorBatchesPage /></ProtectedRoute>} />
              <Route path="/processor/process" element={<ProtectedRoute allowedRoles={['processor']}><ProcessorProcessPage /></ProtectedRoute>} />

              <Route path="/manufacturer/formulate" element={<ProtectedRoute allowedRoles={['manufacturer']}><ManufacturerFormulatePage /></ProtectedRoute>} />
              <Route path="/manufacturer/qr-codes" element={<ProtectedRoute allowedRoles={['manufacturer']}><ManufacturerQRPage /></ProtectedRoute>} />

              <Route path="/admin/network" element={<ProtectedRoute allowedRoles={['admin']}><AdminNetworkPage /></ProtectedRoute>} />
              <Route path="/admin/compliance" element={<ProtectedRoute allowedRoles={['admin']}><AdminCompliancePage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;