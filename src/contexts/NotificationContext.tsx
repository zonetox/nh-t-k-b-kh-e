import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  deep_link: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationSettings {
  enable_push: boolean;
  enable_email: boolean;
  enable_zalo: boolean;
  quiet_start: string;
  quiet_end: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  settings: NotificationSettings;
  settingsLoading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<{ success: boolean; error?: string }>;
}

const defaultSettings: NotificationSettings = {
  enable_push: true,
  enable_email: false,
  enable_zalo: false,
  quiet_start: '21:00',
  quiet_end: '07:00',
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, body, deep_link, read, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      setNotifications((data || []) as Notification[]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setSettings(defaultSettings);
      setSettingsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data) {
        setSettings({
          enable_push: data.enable_push,
          enable_email: data.enable_email,
          enable_zalo: data.enable_zalo,
          quiet_start: data.quiet_start,
          quiet_end: data.quiet_end,
        });
      }
    } finally {
      setSettingsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, [fetchNotifications, fetchSettings]);

  // Realtime subscription for new notifications (filtered by user_id)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Get current user id for filter
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev]);
          }
        )
        .subscribe();

      return channel;
    };

    let channelRef: ReturnType<typeof supabase.channel> | undefined;
    setupRealtime().then(ch => { channelRef = ch; });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, [isAuthenticated]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const updateSettings = async (
    newSettings: Partial<NotificationSettings>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return { success: false, error: 'Not authenticated' };

      const merged = { ...settings, ...newSettings };

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          enable_push: merged.enable_push,
          enable_email: merged.enable_email,
          enable_zalo: merged.enable_zalo,
          quiet_start: merged.quiet_start,
          quiet_end: merged.quiet_end,
        });

      if (error) return { success: false, error: error.message };

      setSettings(merged);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Unexpected error' };
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        settings,
        settingsLoading,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead,
        updateSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};
