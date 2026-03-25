import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Settings2, BellRing } from 'lucide-react';

const SystemSettings: React.FC = () => {
  const [vapidKey, setVapidKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', 'vapid_public_key')
        .maybeSingle();

      if (error) throw error;
      if (data && typeof data.value === 'string') {
        setVapidKey(data.value);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVapid = async () => {
    if (!vapidKey) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('system_configs')
        .upsert({
          key: 'vapid_public_key',
          value: vapidKey,
          description: 'VAPID Public Key for Web Push Notifications',
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã lưu VAPID Public Key.',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu cấu hình.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Cấu hình hệ thống</h1>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              <CardTitle>Thông báo đẩy (Push Notifications)</CardTitle>
            </div>
            <CardDescription>
              Cấu hình các thông số cần thiết để kích hoạt tính năng thông báo đẩy trên trình duyệt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vapid-key">VAPID Public Key</Label>
              <Input
                id="vapid-key"
                placeholder="Nhập VAPID Public Key từ Firebase Console..."
                value={vapidKey}
                onChange={(e) => setVapidKey(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1 italic">
                Lưu ý: Bạn có thể lấy Key này trong phần Project Settings | Cloud Messaging | Web Push certificates của Firebase Console.
              </p>
            </div>
            <Button 
              className="w-full sm:w-auto gap-2" 
              onClick={handleSaveVapid}
              disabled={isSaving || !vapidKey}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu cấu hình
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemSettings;
