import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  phone: string;
  display_name: string | null;
  is_admin: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth actions
  register: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  
  // Profile actions
  updateProfile: (data: { display_name?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changePhone: (oldPassword: string, newPhone: string) => Promise<{ success: boolean; error?: string }>;
  
  // Refresh
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to convert phone to email format (Supabase workaround)
const phoneToEmail = (phone: string): string => {
  // Normalize phone: remove spaces, dashes
  const normalized = phone.replace(/[\s-]/g, '');
  return `${normalized}@phone.local`;
};

// Helper to validate Vietnamese phone
const isValidVietnamesePhone = (phone: string): boolean => {
  const normalized = phone.replace(/[\s-]/g, '');
  // Vietnamese phone: starts with 0, 10-11 digits
  return /^0\d{9,10}$/.test(normalized);
};

// Password validation
const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }
  if (password.length > 64) {
    return { valid: false, message: 'Mật khẩu không được quá 64 ký tự' };
  }
  return { valid: true };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            const profileData = await fetchProfile(currentSession.user.id);
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then(setProfile);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Register
  const register = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate phone
      if (!isValidVietnamesePhone(phone)) {
        return { success: false, error: 'Số điện thoại không hợp lệ (VD: 0901234567)' };
      }

      // Validate password
      const passwordCheck = isValidPassword(password);
      if (!passwordCheck.valid) {
        return { success: false, error: passwordCheck.message };
      }

      const email = phoneToEmail(phone);
      const normalizedPhone = phone.replace(/[\s-]/g, '');

      // Check if phone already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingProfile) {
        return { success: false, error: 'Số điện thoại đã được đăng ký' };
      }

      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: normalizedPhone,
          },
        },
      });

      if (error) {
        console.error('Register error:', error);
        if (error.message.includes('already registered')) {
          return { success: false, error: 'Số điện thoại đã được đăng ký' };
        }
        return { success: false, error: 'Đăng ký thất bại. Vui lòng thử lại.' };
      }

      if (!data.user) {
        return { success: false, error: 'Đăng ký thất bại. Vui lòng thử lại.' };
      }

      // Update profile with phone (trigger should have created it)
      await supabase
        .from('profiles')
        .update({ phone: normalizedPhone })
        .eq('id', data.user.id);

      toast({
        title: 'Đăng ký thành công!',
        description: 'Chào mừng bạn đến với Nhật Ký Tiêm Chủng',
      });

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Đăng ký thất bại. Vui lòng thử lại.' };
    }
  };

  // Login
  const login = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate phone
      if (!isValidVietnamesePhone(phone)) {
        return { success: false, error: 'Số điện thoại không hợp lệ' };
      }

      const email = phoneToEmail(phone);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Số điện thoại hoặc mật khẩu không đúng' };
        }
        return { success: false, error: 'Đăng nhập thất bại. Vui lòng thử lại.' };
      }

      if (!data.user) {
        return { success: false, error: 'Đăng nhập thất bại. Vui lòng thử lại.' };
      }

      // Update last_login_at
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      toast({
        title: 'Đăng nhập thành công!',
        description: 'Chào mừng bạn quay trở lại',
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Đăng nhập thất bại. Vui lòng thử lại.' };
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast({
        title: 'Đã đăng xuất',
        description: 'Hẹn gặp lại bạn!',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Logout all sessions
  const logoutAll = async (): Promise<void> => {
    try {
      if (user) {
        await supabase.rpc('revoke_all_user_sessions', { p_user_id: user.id });
      }
      await supabase.auth.signOut({ scope: 'global' });
      setUser(null);
      setSession(null);
      setProfile(null);

      toast({
        title: 'Đã đăng xuất tất cả thiết bị',
      });
    } catch (error) {
      console.error('Logout all error:', error);
    }
  };

  // Update profile
  const updateProfile = async (data: { display_name?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'Chưa đăng nhập' };
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Update profile error:', error);
        return { success: false, error: 'Cập nhật thất bại. Vui lòng thử lại.' };
      }

      // Refresh profile
      const newProfile = await fetchProfile(user.id);
      setProfile(newProfile);

      toast({
        title: 'Cập nhật thành công!',
      });

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Cập nhật thất bại. Vui lòng thử lại.' };
    }
  };

  // Change password
  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || !profile) {
        return { success: false, error: 'Chưa đăng nhập' };
      }

      // Validate new password
      const passwordCheck = isValidPassword(newPassword);
      if (!passwordCheck.valid) {
        return { success: false, error: passwordCheck.message };
      }

      // Verify old password by re-authenticating
      const email = phoneToEmail(profile.phone);
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (verifyError) {
        return { success: false, error: 'Mật khẩu hiện tại không đúng' };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Change password error:', error);
        return { success: false, error: 'Đổi mật khẩu thất bại. Vui lòng thử lại.' };
      }

      // Revoke all other sessions
      await supabase.rpc('revoke_all_user_sessions', { p_user_id: user.id });

      toast({
        title: 'Đổi mật khẩu thành công!',
        description: 'Các thiết bị khác đã bị đăng xuất',
      });

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Đổi mật khẩu thất bại. Vui lòng thử lại.' };
    }
  };

  // Change phone
  const changePhone = async (oldPassword: string, newPhone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || !profile) {
        return { success: false, error: 'Chưa đăng nhập' };
      }

      // Validate new phone
      if (!isValidVietnamesePhone(newPhone)) {
        return { success: false, error: 'Số điện thoại mới không hợp lệ' };
      }

      const normalizedPhone = newPhone.replace(/[\s-]/g, '');

      // Check if new phone already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .neq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        return { success: false, error: 'Số điện thoại mới đã được sử dụng' };
      }

      // Verify old password
      const email = phoneToEmail(profile.phone);
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (verifyError) {
        return { success: false, error: 'Mật khẩu không đúng' };
      }

      // Update email in auth (phone mapped to email)
      const newEmail = phoneToEmail(normalizedPhone);
      const { error: authError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (authError) {
        console.error('Change phone auth error:', authError);
        return { success: false, error: 'Đổi số điện thoại thất bại. Vui lòng thử lại.' };
      }

      // Update phone in profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          phone: normalizedPhone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Change phone profile error:', profileError);
        return { success: false, error: 'Đổi số điện thoại thất bại. Vui lòng thử lại.' };
      }

      // Revoke all other sessions
      await supabase.rpc('revoke_all_user_sessions', { p_user_id: user.id });

      // Refresh profile
      const newProfile = await fetchProfile(user.id);
      setProfile(newProfile);

      toast({
        title: 'Đổi số điện thoại thành công!',
        description: 'Các thiết bị khác đã bị đăng xuất',
      });

      return { success: true };
    } catch (error) {
      console.error('Change phone error:', error);
      return { success: false, error: 'Đổi số điện thoại thất bại. Vui lòng thử lại.' };
    }
  };

  // Refresh profile
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      const newProfile = await fetchProfile(user.id);
      setProfile(newProfile);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user && !!session,
    register,
    login,
    logout,
    logoutAll,
    updateProfile,
    changePassword,
    changePhone,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
