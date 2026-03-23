import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const UpgradePage: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại Dashboard</span>
          </Link>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Nâng cấp tài khoản Thành viên</h1>
          <p className="text-muted-foreground">
            Duy trì việc quản lý lịch tiêm chủng trọn vẹn và an tâm cho bé yêu.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
          <Card className="relative border-primary shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0">
              <Badge className="rounded-none rounded-bl-lg px-4 py-1">PHỔ BIẾN NHẤT</Badge>
            </div>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Gói Thành Viên Hàng Năm</CardTitle>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">99.000đ</span>
                <span className="text-muted-foreground">/năm</span>
              </div>
              <CardDescription className="pt-2">
                Chỉ khoảng 8.000đ mỗi tháng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-primary/10 p-1 rounded-full text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm">Quản lý không giới hạn số lượng bé</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-primary/10 p-1 rounded-full text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm">Nhắc lịch tiêm tự động qua Email/Zalo/Web</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-primary/10 p-1 rounded-full text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm">Lưu trữ hình ảnh sổ tiêm vĩnh viễn</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-primary/10 p-1 rounded-full text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm">Báo cáo thống kê tiêm chủng chi tiết</p>
                </div>
              </div>

              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <CreditCard className="h-4 w-4" />
                  <span>Thông tin chuyển khoản</span>
                </div>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                  <p>Ngân hàng: **MB BANK (Quân Đội)**</p>
                  <p>Số TK: **0918731411**</p>
                  <p>Chủ TK: **PHAN THANH LOI**</p>
                  <p>Nội dung: **VITE {profile?.phone}**</p>
                </div>
                <p className="text-xs text-muted-foreground text-center italic">
                  * Sau khi chuyển khoản, Admin sẽ phê duyệt tài khoản của bạn trong vòng 15-30 phút.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full h-12 text-lg font-semibold gap-2">
                <Zap className="h-5 w-5 fill-current" />
                ĐÃ CHUYỂN KHOẢN
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ/Trust */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div className="p-4 flex flex-col items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary opacity-50" />
            <h4 className="font-semibold text-sm">Bảo mật dữ liệu</h4>
            <p className="text-xs text-muted-foreground">Thông tin con bạn được mã hóa và bảo vệ tuyệt đối.</p>
          </div>
          <div className="p-4 flex flex-col items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary opacity-50" />
            <h4 className="font-semibold text-sm">Hỗ trợ 24/7</h4>
            <p className="text-xs text-muted-foreground">Chúng tôi luôn đồng hành cùng mẹ trong hành trình tiêm chủng.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
