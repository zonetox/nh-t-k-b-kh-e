import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Loader2 } from 'lucide-react';

type AppRole = 'super_admin' | 'medical_admin' | 'finance_admin' | 'support_admin';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin, hasRole, isLoading: rolesLoading } = useAdmin();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequired = requiredRoles.some(role => hasRole(role) || hasRole('super_admin'));
    if (!hasRequired) {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

export default AdminRoute;
