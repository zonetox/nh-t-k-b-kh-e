import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  if (profile && !profile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <h1 className="text-xl font-semibold text-destructive">Tài khoản bị khóa</h1>
          <p className="mt-2 text-muted-foreground">
            Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ để được trợ giúp.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
