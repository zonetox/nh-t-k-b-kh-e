import React from 'react';
import { Button } from '@/components/ui/button';
import { Baby, Plus, Calendar, Bell, Shield } from 'lucide-react';

interface EmptyBabyStateProps {
  onAddBaby: () => void;
}

const EmptyBabyState: React.FC<EmptyBabyStateProps> = ({ onAddBaby }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Icon */}
        <div className="p-6 bg-primary/10 rounded-full w-fit mx-auto mb-6">
          <Baby className="h-16 w-16 text-primary" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-3">
          Bạn chưa thêm bé nào
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          Thêm thông tin bé để hệ thống tự động tạo lịch tiêm chủng theo chuẩn Bộ Y tế
        </p>

        {/* CTA Button */}
        <Button size="lg" onClick={onAddBaby} className="gap-2 mb-8">
          <Plus className="h-5 w-5" />
          Thêm bé ngay
        </Button>

        {/* Benefits */}
        <div className="grid gap-4 text-left">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Lịch tiêm tự động</p>
              <p className="text-xs text-muted-foreground">
                Hệ thống tạo lịch tiêm chuẩn theo ngày sinh
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Bell className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Nhắc nhở thông minh</p>
              <p className="text-xs text-muted-foreground">
                Thông báo trước 7 ngày, 3 ngày và ngày tiêm
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">An toàn & bảo mật</p>
              <p className="text-xs text-muted-foreground">
                Dữ liệu được mã hóa và bảo vệ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyBabyState;
