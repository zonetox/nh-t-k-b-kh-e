import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BabyProvider } from "@/contexts/BabyContext";
import { VaccineProvider } from "@/contexts/VaccineContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AdminProvider } from "@/contexts/AdminContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/admin/AdminRoute";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Account from "./pages/Account";
import BabiesPage from "./pages/BabiesPage";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import VaccineManagement from "./pages/admin/VaccineManagement";
import UserManagement from "./pages/admin/UserManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import Analytics from "./pages/admin/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AdminProvider>
            <BabyProvider>
              <VaccineProvider>
                <NotificationProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                  
                  {/* Protected routes */}
                  <Route 
                    path="/account" 
                    element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/babies" 
                    element={
                      <ProtectedRoute>
                        <BabiesPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
                  <Route path="/admin/vaccines" element={<AdminRoute requiredRoles={['medical_admin']}><VaccineManagement /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute requiredRoles={['support_admin']}><UserManagement /></AdminRoute>} />
                  <Route path="/admin/payments" element={<AdminRoute requiredRoles={['finance_admin']}><PaymentManagement /></AdminRoute>} />
                  <Route path="/admin/audit-logs" element={<AdminRoute requiredRoles={['super_admin']}><AuditLogs /></AdminRoute>} />
                  
                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </NotificationProvider>
              </VaccineProvider>
            </BabyProvider>
          </AdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
