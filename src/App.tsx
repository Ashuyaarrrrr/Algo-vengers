import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

// 🔥 ADD THESE IMPORTS
import AuthCallback from "./pages/AuthCallback";
import CompleteProfile from "./pages/CompleteProfile";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify/:qrCode" element={<ConsumerVerifyPage />} />

          {/* 🔥 ADD THESE ROUTES (MOST IMPORTANT) */}
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

export default App;