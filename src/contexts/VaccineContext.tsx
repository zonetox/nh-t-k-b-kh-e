import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBaby } from '@/contexts/BabyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarMonths, differenceInCalendarDays, parseISO } from 'date-fns';

import { Database } from '@/integrations/supabase/types';

type PublicTables = Database['public']['Tables'];
type VaccineRow = PublicTables['vaccines']['Row'];
type HistoryRow = PublicTables['vaccine_history']['Row'];
type ImageRow = PublicTables['vaccine_history_images']['Row'];

export interface VaccineSchedule extends Omit<PublicTables['vaccine_schedules']['Row'], 'status'> {
  status: 'pending' | 'upcoming' | 'overdue' | 'done' | 'skipped';
  vaccines: {
    id: string;
    name: string;
    short_name: string | null;
    description: string | null;
    type: string;
    total_doses: number;
  };
  vaccine_history: (HistoryRow & {
    vaccine_history_images: ImageRow[];
  })[] | null;
}

export interface AddManualScheduleInput {
  vaccine_id: string;
  scheduled_date: string;
  dose_number: number;
}

export interface MarkAsDoneInput {
  injected_date: string;
  batch_number?: string;
  location?: string;
  notes?: string;
  image_urls?: string[];
}

interface VaccineContextType {
  schedules: VaccineSchedule[];
  isLoading: boolean;
  
  // Computed data
  upcomingSchedules: VaccineSchedule[];
  overdueSchedules: VaccineSchedule[];
  doneSchedules: VaccineSchedule[];
  pendingSchedules: VaccineSchedule[];
  
  // Stats
  stats: {
    total: number;
    done: number;
    upcoming: number;
    overdue: number;
    pending: number;
    completionRate: number;
  };
  
  // Actions
  refresh: () => Promise<void>;
  markAsDone: (scheduleId: string, data: MarkAsDoneInput) => Promise<{ success: boolean; error?: string }>;
  markAsSkipped: (scheduleId: string, skippedReason?: string) => Promise<{ success: boolean; error?: string }>;
  undoMarkAsDone: (scheduleId: string) => Promise<{ success: boolean; error?: string }>;
  undoSkipped: (scheduleId: string) => Promise<{ success: boolean; error?: string }>;
  addManualSchedule: (data: AddManualScheduleInput) => Promise<{ success: boolean; error?: string }>;
  
  // Timeline grouping
  getSchedulesByAgeMonth: () => Record<number, VaccineSchedule[]>;
}

const VaccineContext = createContext<VaccineContextType | undefined>(undefined);

export const VaccineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<VaccineSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { selectedBaby } = useBaby();
  const { isTrialActive, isPremium } = useAuth();
  const { toast } = useToast();

  // Fetch schedules for selected baby
  const fetchSchedules = useCallback(async (force = false) => {
    if (!selectedBaby) {
      setSchedules([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('vaccine_schedules')
        .select(`
          *,
          vaccines (
            id,
            name,
            short_name,
            description,
            type,
            total_doses
          ),
          vaccine_history (
            id,
            injected_date,
            batch_number,
            location,
            notes,
            vaccine_history_images (
              id,
              image_url
            )
          )
        `)
        .eq('baby_id', selectedBaby.id)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching schedules:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải lịch tiêm',
          variant: 'destructive',
        });
        return;
      }

      const today = new Date();
      const computedData = (data || []).map((schedule: any) => {
        // Normalize vaccine_history (could be an object due to isOneToOne: true in PostgREST)
        if (schedule.vaccine_history && !Array.isArray(schedule.vaccine_history)) {
          schedule.vaccine_history = [schedule.vaccine_history];
        } else if (!schedule.vaccine_history) {
          schedule.vaccine_history = [];
        }

        if (['pending', 'upcoming', 'overdue'].includes(schedule.status)) {
          const scheduledDate = parseISO(schedule.scheduled_date);
          const todayDate = new Date();
          const daysDiff = differenceInCalendarDays(scheduledDate, todayDate);
          
          let computedStatus = schedule.status;
          if (daysDiff < 0) {
            computedStatus = 'overdue';
          } else if (daysDiff <= 7) {
            computedStatus = 'upcoming';
          } else {
            computedStatus = 'pending';
          }
          return { ...schedule, status: computedStatus };
        }
        return schedule;
      });

      setSchedules(computedData as unknown as VaccineSchedule[]);
    } catch (error) {
      console.error('Error in fetchSchedules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBaby, toast]);

  // Fetch when baby changes
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Computed schedules by status (memoized to avoid re-filtering on every render)
  const { upcomingSchedules, overdueSchedules, doneSchedules, pendingSchedules } = React.useMemo(() => {
    const upcoming: VaccineSchedule[] = [];
    const overdue: VaccineSchedule[] = [];
    const done: VaccineSchedule[] = [];
    const pending: VaccineSchedule[] = [];
    for (const s of schedules) {
      switch (s.status) {
        case 'upcoming': upcoming.push(s); break;
        case 'overdue': overdue.push(s); break;
        case 'done': done.push(s); break;
        case 'pending': pending.push(s); break;
      }
    }
    return { upcomingSchedules: upcoming, overdueSchedules: overdue, doneSchedules: done, pendingSchedules: pending };
  }, [schedules]);

  // Stats
  const stats = {
    total: schedules.length,
    done: doneSchedules.length,
    upcoming: upcomingSchedules.length,
    overdue: overdueSchedules.length,
    pending: pendingSchedules.length,
    completionRate: schedules.length > 0 
      ? Math.round((doneSchedules.length / schedules.length) * 100) 
      : 0,
  };

  const addManualSchedule = async (data: AddManualScheduleInput): Promise<{ success: boolean; error?: string }> => {
    if (!selectedBaby) return { success: false, error: 'Chưa chọn bé' };
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('vaccine_schedules')
        .insert({
          baby_id: selectedBaby.id,
          vaccine_id: data.vaccine_id,
          scheduled_date: data.scheduled_date,
          dose_number: data.dose_number,
          status: 'pending',
          is_manual: true,
        });

      if (error) {
        console.error('Error adding manual schedule:', error);
        return { success: false, error: 'Không thể thêm mũi tiêm' };
      }

      await fetchSchedules(true);
      toast({
        title: 'Thành công',
        description: 'Đã thêm mũi tiêm vào lịch',
      });
      return { success: true };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: 'Đã xảy ra lỗi' };
    } finally {
      setIsLoading(false);
    }
  };

  // Mark as done via Edge Function (transactional)
  const markAsDone = async (
    scheduleId: string, 
    data: MarkAsDoneInput
  ): Promise<{ success: boolean; error?: string }> => {
    const canEdit = isTrialActive || isPremium;
    
    if (!canEdit) {
      toast({
        title: 'Cần nâng cấp thành viên',
        description: 'Vui lòng nâng cấp gói thành viên để tiếp tục quản lý lịch tiêm',
        variant: 'destructive',
      });
      return { success: false, error: 'Subscription required' };
    }

    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const userId = sessionData.user?.id;
      if (!userId) {
        return { success: false, error: 'Vui lòng đăng nhập lại' };
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('mark_vaccine_done_atomic', {
        p_schedule_id: scheduleId,
        p_user_id: userId,
        p_injected_date: data.injected_date,
        p_batch_number: data.batch_number || null,
        p_location: data.location || null,
        p_notes: data.notes || null,
        p_image_paths: data.image_urls?.length ? data.image_urls : [],
      });

      if (rpcError) {
        console.error('Error in markAsDone:', rpcError);
        return { success: false, error: rpcError.message || 'Không thể lưu thông tin tiêm chủng (Database conflict)' };
      }

      const result = rpcData as any;
      if (!result || !result.id) {
        return { success: false, error: 'Thất bại khi cập nhật dữ liệu' };
      }
      // Optimistic update using array format [history]
      setSchedules(prev => 
        prev.map(s => 
          s.id === scheduleId 
            ? { ...s, status: 'done' as const, vaccine_history: [result] }
            : s
        )
      );

      // Still refresh to ensure everything (like future dates) is synced correctly
      await fetchSchedules(true);

      toast({
        title: 'Đã ghi nhận!',
        description: 'Thông tin tiêm chủng đã được lưu',
      });

      return { success: true };
    } catch (error) {
      console.error('Error in markAsDone:', error);
      return { success: false, error: 'Đã xảy ra lỗi' };
    }
  };

  // Mark as skipped with reason
  const markAsSkipped = async (
    scheduleId: string, 
    skippedReason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const canEdit = isTrialActive || isPremium;
    
    if (!canEdit) {
      toast({
        title: 'Cần nâng cấp thành viên',
        description: 'Vui lòng nâng cấp gói thành viên để tiếp tục quản lý lịch tiêm',
        variant: 'destructive',
      });
      return { success: false, error: 'Subscription required' };
    }

    try {
      const { error } = await supabase
        .from('vaccine_schedules')
        .update({ 
          status: 'skipped', 
          skipped_reason: skippedReason || null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', scheduleId);

      if (error) {
        console.error('Error marking as skipped:', error);
        return { success: false, error: 'Không thể cập nhật trạng thái' };
      }

      // Refresh to get updated status from server
      await fetchSchedules(true);

      toast({
        title: 'Đã bỏ qua',
        description: 'Mũi tiêm đã được đánh dấu bỏ qua',
      });

      return { success: true };
    } catch (error) {
      console.error('Error in markAsSkipped:', error);
      return { success: false, error: 'Đã xảy ra lỗi' };
    }
  };

  // Undo mark as done (atomic via RPC)
  const undoMarkAsDone = async (
    scheduleId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: rpcError } = await supabase.rpc('undo_vaccine_completion', {
        p_schedule_id: scheduleId,
      });

      if (rpcError) {
        console.error('Error in undo_vaccine_completion:', rpcError);
        return { success: false, error: rpcError.message || 'Không thể hoàn tác' };
      }

      // Refresh to get correct status from server
      await fetchSchedules(true);

      toast({
        title: 'Đã hoàn tác',
        description: 'Đã xóa thông tin tiêm chủng',
      });

      return { success: true };
    } catch (error) {
      console.error('Error in undoMarkAsDone:', error);
      return { success: false, error: 'Đã xảy ra lỗi' };
    }
  };

  // Undo skipped status
  const undoSkipped = async (
    scheduleId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) {
        return { success: false, error: 'Không tìm thấy thông tin' };
      }

      // Recalculate status based on date (7 days for upcoming)
      const today = new Date();
      const scheduledDate = parseISO(schedule.scheduled_date);
      const daysDiff = differenceInCalendarDays(scheduledDate, today);
      
      let newStatus: 'pending' | 'upcoming' | 'overdue' = 'pending';
      if (daysDiff < 0) {
        newStatus = 'overdue';
      } else if (daysDiff <= 7) {
        newStatus = 'upcoming';
      }

      const { error } = await supabase
        .from('vaccine_schedules')
        .update({ 
          status: newStatus, 
          skipped_reason: null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', scheduleId);

      if (error) {
        console.error('Error undoing skipped:', error);
        return { success: false, error: 'Không thể cập nhật trạng thái' };
      }

      // Refresh to get updated status from server
      await fetchSchedules(true);

      toast({
        title: 'Đã hoàn tác',
        description: 'Mũi tiêm đã được khôi phục',
      });

      return { success: true };
    } catch (error) {
      console.error('Error in undoSkipped:', error);
      return { success: false, error: 'Đã xảy ra lỗi' };
    }
  };

  // Group by age month using differenceInCalendarMonths
  const getSchedulesByAgeMonth = useCallback(() => {
    if (!selectedBaby) return {};
    
    const dob = parseISO(selectedBaby.dob);
    
    return schedules.reduce((acc, schedule) => {
      const scheduledDate = parseISO(schedule.scheduled_date);
      const ageMonths = differenceInCalendarMonths(scheduledDate, dob);
      
      const monthKey = Math.max(0, ageMonths);
      
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(schedule);
      
      return acc;
    }, {} as Record<number, VaccineSchedule[]>);
  }, [schedules, selectedBaby]);

  const value: VaccineContextType = {
    schedules,
    isLoading,
    upcomingSchedules,
    overdueSchedules,
    doneSchedules,
    pendingSchedules,
    stats,
    refresh: () => fetchSchedules(true),
    markAsDone,
    markAsSkipped,
    undoMarkAsDone,
    undoSkipped,
    addManualSchedule,
    getSchedulesByAgeMonth,
  };

  return <VaccineContext.Provider value={value}>{children}</VaccineContext.Provider>;
};

export const useVaccine = (): VaccineContextType => {
  const context = useContext(VaccineContext);
  if (context === undefined) {
    throw new Error('useVaccine must be used within a VaccineProvider');
  }
  return context;
};
