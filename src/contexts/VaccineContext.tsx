import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBaby } from '@/contexts/BabyContext';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarMonths, parseISO } from 'date-fns';
export interface VaccineSchedule {
  id: string;
  baby_id: string;
  vaccine_id: string;
  dose_number: number;
  scheduled_date: string;
  status: 'pending' | 'upcoming' | 'overdue' | 'done' | 'skipped';
  skipped_reason?: string | null;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
  vaccines: {
    id: string;
    name: string;
    short_name: string | null;
    description: string | null;
    type: string;
    total_doses: number;
  };
  vaccine_history?: {
    id: string;
    injected_date: string;
    batch_number: string | null;
    location: string | null;
    notes: string | null;
  } | null;
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
  
  // Timeline grouping
  getSchedulesByAgeMonth: () => Record<number, VaccineSchedule[]>;
}

const VaccineContext = createContext<VaccineContextType | undefined>(undefined);

export const VaccineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<VaccineSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { selectedBaby } = useBaby();
  const { toast } = useToast();

  // Fetch schedules for selected baby
  const fetchSchedules = useCallback(async () => {
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
            notes
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

      // If no schedules, try to regenerate
      if (!data || data.length === 0) {
        console.log('No schedules found, regenerating...');
        const { error: rpcError } = await supabase.rpc('generate_vaccine_schedules_for_baby', {
          p_baby_id: selectedBaby.id
        });
        
        if (rpcError) {
          console.error('Error regenerating schedules:', rpcError);
        } else {
          // Fetch again after regeneration
          const { data: newData } = await supabase
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
                notes
              )
            `)
            .eq('baby_id', selectedBaby.id)
            .order('scheduled_date', { ascending: true });
          
          if (newData) {
            setSchedules(newData as unknown as VaccineSchedule[]);
          }
        }
      } else {
        setSchedules(data as unknown as VaccineSchedule[]);
      }
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

  // Computed schedules by status
  const upcomingSchedules = schedules.filter(s => s.status === 'upcoming');
  const overdueSchedules = schedules.filter(s => s.status === 'overdue');
  const doneSchedules = schedules.filter(s => s.status === 'done');
  const pendingSchedules = schedules.filter(s => s.status === 'pending');

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

  // Mark as done via Edge Function (transactional)
  const markAsDone = async (
    scheduleId: string, 
    data: MarkAsDoneInput
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        return { success: false, error: 'Vui lòng đăng nhập lại' };
      }

      const response = await supabase.functions.invoke('mark-vaccine-done', {
        body: {
          schedule_id: scheduleId,
          injected_date: data.injected_date,
          batch_number: data.batch_number,
          location: data.location,
          notes: data.notes,
          image_urls: data.image_urls,
        },
      });

      if (response.error) {
        console.error('Error in markAsDone:', response.error);
        return { success: false, error: response.error.message || 'Không thể lưu thông tin tiêm chủng' };
      }

      const result = response.data;
      if (!result.success) {
        return { success: false, error: result.error || 'Không thể lưu thông tin tiêm chủng' };
      }

      // Optimistic update
      setSchedules(prev => 
        prev.map(s => 
          s.id === scheduleId 
            ? { ...s, status: 'done' as const, vaccine_history: result.history }
            : s
        )
      );

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

      // Optimistic update
      setSchedules(prev => 
        prev.map(s => 
          s.id === scheduleId 
            ? { ...s, status: 'skipped' as const, skipped_reason: skippedReason || null }
            : s
        )
      );

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

  // Undo mark as done
  const undoMarkAsDone = async (
    scheduleId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Find the schedule
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule || !schedule.vaccine_history) {
        return { success: false, error: 'Không tìm thấy thông tin' };
      }

      // Delete images first
      await supabase
        .from('vaccine_history_images')
        .delete()
        .eq('history_id', schedule.vaccine_history.id);

      // Delete history
      const { error: deleteError } = await supabase
        .from('vaccine_history')
        .delete()
        .eq('id', schedule.vaccine_history.id);

      if (deleteError) {
        console.error('Error deleting history:', deleteError);
        return { success: false, error: 'Không thể xóa thông tin tiêm chủng' };
      }

      // Recalculate status based on date (7 days for upcoming)
      const today = new Date();
      const scheduledDate = new Date(schedule.scheduled_date);
      const daysDiff = Math.floor((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let newStatus: 'pending' | 'upcoming' | 'overdue' = 'pending';
      if (daysDiff < 0) {
        newStatus = 'overdue';
      } else if (daysDiff <= 7) {
        newStatus = 'upcoming';
      }

      // Update schedule status
      const { error: updateError } = await supabase
        .from('vaccine_schedules')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', scheduleId);

      if (updateError) {
        console.error('Error updating schedule:', updateError);
        return { success: false, error: 'Không thể cập nhật trạng thái' };
      }

      // Optimistic update
      setSchedules(prev => 
        prev.map(s => 
          s.id === scheduleId 
            ? { ...s, status: newStatus, vaccine_history: null }
            : s
        )
      );

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
      const scheduledDate = new Date(schedule.scheduled_date);
      const daysDiff = Math.floor((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
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

      // Optimistic update
      setSchedules(prev => 
        prev.map(s => 
          s.id === scheduleId 
            ? { ...s, status: newStatus, skipped_reason: null }
            : s
        )
      );

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
    refresh: fetchSchedules,
    markAsDone,
    markAsSkipped,
    undoMarkAsDone,
    undoSkipped,
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
