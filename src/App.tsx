import React, { Suspense, lazy } from "react";
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
import BottomNav from "@/components/layout/BottomNav";

// Lazy loaded Pages for Route-level Code Splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Account = lazy(() => import("./pages/Account"));
const BabiesPage = lazy(() => import("./pages/BabiesPage"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const VaccineManagement = lazy(() => import("./pages/admin/VaccineManagement"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const PaymentManagement = lazy(() => import("./pages/admin/PaymentManagement"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));

// Optimize QueryClient for 10k+ users
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (reduce bandwidth on 3G)
      gcTime: 1000 * 60 * 10, // 10 minutes cache
      refetchOnWindowFocus: false, // Prevent barrage of requests when unlocking phone
      retry: 1,
    },
  },
});

// Simple Loading Screen
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

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
                <Suspense fallback={<PageLoading />}>
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
                      <Route 
                        path="/upgrade" 
                        element={
                          <ProtectedRoute>
                            <UpgradePage />
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
                  <BottomNav />
                </Suspense>
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
