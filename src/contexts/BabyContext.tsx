import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Baby {
  id: string;
  user_id: string;
  name: string;
  dob: string;
  gender: 'male' | 'female' | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateBabyInput {
  name: string;
  dob: string;
  gender: 'male' | 'female';
}

interface UpdateBabyInput {
  name?: string;
  gender?: 'male' | 'female';
  avatar_url?: string;
}

interface BabyContextType {
  babies: Baby[];
  selectedBaby: Baby | null;
  isLoading: boolean;
  
  // Actions
  selectBaby: (babyId: string) => void;
  createBaby: (data: CreateBabyInput) => Promise<{ success: boolean; error?: string; baby?: Baby }>;
  updateBaby: (babyId: string, data: UpdateBabyInput) => Promise<{ success: boolean; error?: string }>;
  deleteBaby: (babyId: string) => Promise<{ success: boolean; error?: string }>;
  refreshBabies: () => Promise<void>;
  uploadAvatar: (babyId: string, file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
}

const BabyContext = createContext<BabyContextType | undefined>(undefined);

const SELECTED_BABY_KEY = 'selectedBabyId';

export const BabyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch babies
  const fetchBabies = useCallback(async () => {
    if (!user) {
      setBabies([]);
      setSelectedBaby(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('babies')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching babies:', error);
        return;
      }

      const babiesData = (data || []) as Baby[];
      setBabies(babiesData);

      // Restore selected baby from localStorage or select first
      const savedBabyId = localStorage.getItem(SELECTED_BABY_KEY);
      const savedBaby = babiesData.find(b => b.id === savedBabyId);
      
      if (savedBaby) {
        setSelectedBaby(savedBaby);
      } else if (babiesData.length > 0) {
        setSelectedBaby(babiesData[0]);
        localStorage.setItem(SELECTED_BABY_KEY, babiesData[0].id);
      } else {
        setSelectedBaby(null);
        localStorage.removeItem(SELECTED_BABY_KEY);
      }
    } catch (error) {
      console.error('Error in fetchBabies:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchBabies();
    } else {
      setBabies([]);
      setSelectedBaby(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchBabies]);

  // Select baby
  const selectBaby = useCallback((babyId: string) => {
    const baby = babies.find(b => b.id === babyId);
    if (baby) {
      setSelectedBaby(baby);
      localStorage.setItem(SELECTED_BABY_KEY, babyId);
    }
  }, [babies]);

  // Create baby
  const createBaby = async (data: CreateBabyInput): Promise<{ success: boolean; error?: string; baby?: Baby }> => {
    if (!user) {
      return { success: false, error: 'Chưa đăng nhập' };
    }

    // Validate
    if (!data.name.trim()) {
      return { success: false, error: 'Vui lòng nhập tên bé' };
    }

    const dobDate = new Date(data.dob);
    if (isNaN(dobDate.getTime())) {
      return { success: false, error: 'Ngày sinh không hợp lệ' };
    }

    if (dobDate > new Date()) {
      return { success: false, error: 'Ngày sinh không thể trong tương lai' };
    }

    try {
      const { data: newBaby, error } = await supabase
        .from('babies')
        .insert({
          user_id: user.id,
          name: data.name.trim(),
          dob: data.dob,
          gender: data.gender,
        })
        .select()
        .single();

      if (error) {
        console.error('Create baby error:', error);
        return { success: false, error: 'Không thể thêm bé. Vui lòng thử lại.' };
      }

      const baby = newBaby as Baby;
      
      // Generate vaccine schedules immediately (Eager trigger)
      const { error: genError } = await supabase.rpc('generate_vaccine_schedules_for_baby', {
        p_baby_id: baby.id
      });
      
      if (genError) {
        console.error('Error generating vaccine schedules:', genError);
      }
      
      // Auto-select the new baby
      setSelectedBaby(baby);
      localStorage.setItem(SELECTED_BABY_KEY, baby.id);

      // Refresh babies list to update local state
      await fetchBabies();

      toast({
        title: 'Thêm bé thành công!',
        description: `Đã tạo hồ sơ cho bé ${baby.name} và lịch tiêm chủng chuẩn`,
      });

      return { success: true, baby };
    } catch (error) {
      console.error('Create baby error:', error);
      return { success: false, error: 'Không thể thêm bé. Vui lòng thử lại.' };
    }
  };

  // Update baby
  const updateBaby = async (babyId: string, data: UpdateBabyInput): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Chưa đăng nhập' };
    }

    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, error: 'Tên bé không được để trống' };
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (data.name) updateData.name = data.name.trim();
      if (data.gender) updateData.gender = data.gender;
      if (data.avatar_url) updateData.avatar_url = data.avatar_url;

      const { error } = await supabase
        .from('babies')
        .update(updateData)
        .eq('id', babyId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Update baby error:', error);
        return { success: false, error: 'Không thể cập nhật. Vui lòng thử lại.' };
      }

      // Refresh babies
      await fetchBabies();

      toast({
        title: 'Cập nhật thành công!',
      });

      return { success: true };
    } catch (error) {
      console.error('Update baby error:', error);
      return { success: false, error: 'Không thể cập nhật. Vui lòng thử lại.' };
    }
  };

  // Delete baby
  const deleteBaby = async (babyId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Chưa đăng nhập' };
    }

    try {
      // Soft delete
      const { error } = await supabase
        .from('babies')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', babyId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete baby error:', error);
        return { success: false, error: 'Không thể xóa bé. Vui lòng thử lại.' };
      }

      // Update local state
      const newBabies = babies.filter(b => b.id !== babyId);
      setBabies(newBabies);

      // If deleted baby was selected, select another
      if (selectedBaby?.id === babyId) {
        if (newBabies.length > 0) {
          setSelectedBaby(newBabies[0]);
          localStorage.setItem(SELECTED_BABY_KEY, newBabies[0].id);
        } else {
          setSelectedBaby(null);
          localStorage.removeItem(SELECTED_BABY_KEY);
        }
      }

      toast({
        title: 'Đã xóa hồ sơ bé',
      });

      return { success: true };
    } catch (error) {
      console.error('Delete baby error:', error);
      return { success: false, error: 'Không thể xóa bé. Vui lòng thử lại.' };
    }
  };

  // Upload Avatar
  const uploadAvatar = async (babyId: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Chưa đăng nhập' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${babyId}_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Upload avatar error:', uploadError);
        return { success: false, error: 'Không thể tải ảnh lên' };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update baby record
      await updateBaby(babyId, { avatar_url: publicUrl });

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { success: false, error: 'Không thể tải ảnh lên' };
    }
  };

  // Refresh
  const refreshBabies = async () => {
    await fetchBabies();
  };

  const value: BabyContextType = {
    babies,
    selectedBaby,
    isLoading,
    selectBaby,
    createBaby,
    updateBaby,
    deleteBaby,
    refreshBabies,
    uploadAvatar,
  };

  return <BabyContext.Provider value={value}>{children}</BabyContext.Provider>;
};

export const useBaby = (): BabyContextType => {
  const context = useContext(BabyContext);
  if (context === undefined) {
    throw new Error('useBaby must be used within a BabyProvider');
  }
  return context;
};
