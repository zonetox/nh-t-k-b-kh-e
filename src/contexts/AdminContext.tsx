import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'super_admin' | 'medical_admin' | 'finance_admin' | 'support_admin';

interface AdminContextType {
  roles: AppRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isMedicalAdmin: boolean;
  isFinanceAdmin: boolean;
  isSupportAdmin: boolean;
  hasRole: (role: AppRole) => boolean;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } else {
        setRoles((data || []).map(r => r.role as AppRole));
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRoles();
    } else {
      setRoles([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchRoles]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  const value: AdminContextType = {
    roles,
    isAdmin: roles.length > 0,
    isSuperAdmin: roles.includes('super_admin'),
    isMedicalAdmin: roles.includes('medical_admin') || roles.includes('super_admin'),
    isFinanceAdmin: roles.includes('finance_admin') || roles.includes('super_admin'),
    isSupportAdmin: roles.includes('support_admin') || roles.includes('super_admin'),
    hasRole,
    isLoading,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
