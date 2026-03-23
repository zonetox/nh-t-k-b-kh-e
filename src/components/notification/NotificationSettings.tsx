import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Bell } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';

const NotificationSettings: React.FC = () => {
  const { settings, settingsLoading, updateSettings } = useNotification();
  const { toast } = useToast();

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    const result = await updateSettings({ [key]: value });
    if (!result.success) {
      toast({ title: 'Lỗi', description: result.error, variant: 'destructive' });
    }
  };

  const handleTimeChange = async (key: 'quiet_start' | 'quiet_end', value: string) => {
    const result = await updateSettings({ [key]: value });
    if (!result.success) {
      toast({ title: 'Lỗi', description: result.error, variant: 'destructive' });
    }
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Cài đặt thông báo
        </CardTitle>
        <CardDescription>
          Tùy chỉnh cách nhận thông báo nhắc lịch tiêm
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Thông báo đẩy (Push)</Label>
              <p className="text-xs text-muted-foreground">Nhận thông báo trên thiết bị</p>
            </div>
            <Switch
              checked={settings.enable_push}
              onCheckedChange={(v) => handleToggle('enable_push', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-xs text-muted-foreground">Nhận nhắc nhở qua email</p>
            </div>
            <Switch
              checked={settings.enable_email}
              onCheckedChange={(v) => handleToggle('enable_email', v)}
            />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div>
              <Label className="text-sm font-medium">Zalo OA</Label>
              <p className="text-xs text-muted-foreground">Sắp ra mắt</p>
            </div>
            <Switch checked={false} disabled />
          </div>
        </div>

        {/* Quiet hours */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium">Giờ yên tĩnh (Không gửi thông báo)</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Thông báo sẽ được trì hoãn nếu rơi vào khoảng thời gian này
          </p>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Từ</Label>
              <Input
                type="time"
                value={settings.quiet_start}
                onChange={(e) => handleTimeChange('quiet_start', e.target.value)}
                className="w-32"
              />
            </div>
            <span className="mt-5 text-muted-foreground">—</span>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Đến</Label>
              <Input
                type="time"
                value={settings.quiet_end}
                onChange={(e) => handleTimeChange('quiet_end', e.target.value)}
                className="w-32"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
