import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, CreditCard, ShieldCheck, Zap, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const UpgradePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const qrUrl = React.useMemo(() => {
    const bankId = 'tcb';
    const accountNo = '19028231554011';
    const amount = '99000';
    const addInfo = encodeURIComponent(`VITE ${profile?.phone || ''}`);
    const accountName = encodeURIComponent('LE TAN LOI');
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
  }, [profile?.phone]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpgrade = async () => {
    if (!profile) return;
    
    setIsUploading(true);
    try {
      let proofUrl = '';

      // 1. Upload proof if exists
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) throw new Error('Không thể tải ảnh minh chứng lên');

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);
        
        proofUrl = publicUrl;
      }

      // 2. Call RPC to auto-upgrade
      const { error: rpcError } = await supabase.rpc('request_auto_upgrade' as any, {
        p_amount: 99000,
        p_proof_url: proofUrl,
        p_baby_ids: [] // Can be extended to specific babies if needed
      });

      if (rpcError) throw rpcError;

      setIsSuccess(true);
      await refreshProfile();
      
      toast({
        title: 'Nâng cấp thành công!',
        description: 'Tài khoản của bạn đã được chuyển sang chế độ Premium ngay lập tức.',
      });
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi nâng cấp',
        description: error.message || 'Có lỗi xảy ra, vui lòng thử lại sau.',
      });
    } finally {
      setIsUploading(false);
    }
  };

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
                  <span>Thông tin chuyển khoản & Quét mã QR</span>
                </div>
                
                <div className="flex flex-col items-center gap-4 bg-white p-4 rounded-xl border border-dashed border-primary/30">
                  <img 
                    src={qrUrl} 
                    alt="VietQR Payment" 
                    className="w-full max-w-[240px] aspect-square object-contain"
                  />
                  <div className="text-center space-y-1">
                    <p className="font-bold text-primary">LE TAN LOI</p>
                    <p className="font-mono text-sm leading-none">1902 8231 5540 11</p>
                    <p className="text-xs text-muted-foreground">Techcombank (Ngân hàng Kỹ thương)</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Xác nhận chuyển khoản</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  
                  {file ? (
                    <div className="flex items-center gap-2 p-2 bg-background rounded border text-sm">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setFile(null)}>Xóa</Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full border-dashed border-2 h-16 flex flex-col gap-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5 opacity-50" />
                      <span className="text-xs">Tải lên ảnh chụp màn hình chuyển khoản (nếu có)</span>
                    </Button>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Nội dung:</span>
                    <span className="font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">VITE {profile?.phone}</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  * Hệ thống sẽ <strong>tự động kích hoạt Premium</strong> ngay khi bạn nhấn nút phía dưới. 
                  Chúng tôi sẽ kiểm tra đối soát thông tin chuyển khoản sau đó.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpgrade} 
                disabled={isUploading || isSuccess}
                className={cn("w-full h-12 text-lg font-semibold gap-2", isSuccess && "bg-green-600 hover:bg-green-700")}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSuccess ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Zap className="h-5 w-5 fill-current" />
                )}
                {isSuccess ? 'ĐÃ KÍCH HOẠT THÀNH CÔNG' : 'XÁC NHẬN ĐÃ CHUYỂN KHOẢN'}
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
