import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  proof_image_url: string;
  baby_ids: string[];
  reject_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_phone?: string;
}

const PaymentManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  // Review dialog
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, phone').in('id', userIds);
      const phoneMap: Record<string, string> = {};
      profiles?.forEach(p => { phoneMap[p.id] = p.phone; });
      setPayments(data.map(p => ({ ...p, user_phone: phoneMap[p.user_id] || '—' })) as Payment[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, []);

  const getSignedUrl = async (proofUrl: string): Promise<string | null> => {
    // Extract storage path from the URL
    const match = proofUrl.match(/payment-proofs\/(.+)$/);
    if (match) {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(match[1], 600); // 10 minutes
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    }
    return null;
  };

  const openReview = async (payment: Payment) => {
    setSelectedPayment(payment);
    setRejectReason('');
    setAdminNotes(payment.admin_notes || '');
    setSignedImageUrl(null);
    setReviewOpen(true);

    // Get signed URL for proof image
    const url = await getSignedUrl(payment.proof_image_url);
    setSignedImageUrl(url);
  };

  const checkRateLimit = async (): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.rpc('check_admin_rate_limit', { p_admin_id: user.id });
    if (error || data === false) {
      toast({ title: 'Quá giới hạn', description: 'Tối đa 30 hành động/phút. Vui lòng chờ.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleApprove = async () => {
    if (!selectedPayment || !user) return;
    if (!(await checkRateLimit())) return;
    setProcessing(true);

    try {
      const { error } = await supabase.rpc('approve_payment_transaction', {
        p_payment_id: selectedPayment.id,
        p_admin_id: user.id,
        p_admin_notes: adminNotes.trim() || null,
      });

      if (error) throw error;

      toast({ title: 'Đã duyệt thanh toán và kích hoạt gói' });
      setReviewOpen(false);
      fetchPayments();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !user || !rejectReason.trim()) return;
    if (!(await checkRateLimit())) return;
    setProcessing(true);

    try {
      const { error } = await supabase.from('payments').update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        reject_reason: rejectReason.trim(),
        admin_notes: adminNotes.trim() || null,
      }).eq('id', selectedPayment.id);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'reject_payment', p_table_name: 'payments', p_record_id: selectedPayment.id,
        p_old_values: JSON.stringify({ status: selectedPayment.status }),
        p_new_values: JSON.stringify({ status: 'rejected', reject_reason: rejectReason }),
      });

      toast({ title: 'Đã từ chối thanh toán' });
      setReviewOpen(false);
      fetchPayments();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (tab === 'pending') return p.status === 'pending';
    if (tab === 'approved') return p.status === 'approved';
    if (tab === 'rejected') return p.status === 'rejected';
    return true;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Chờ duyệt</Badge>;
      case 'approved': return <Badge variant="default">Đã duyệt</Badge>;
      case 'rejected': return <Badge variant="destructive">Từ chối</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Quản lý thanh toán" description="Duyệt và quản lý giao dịch thanh toán">
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">
              Chờ duyệt ({payments.filter(p => p.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Số bé</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không có giao dịch nào</TableCell>
                    </TableRow>
                  ) : filteredPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.user_phone}</TableCell>
                      <TableCell className="font-medium">{p.amount.toLocaleString('vi-VN')} ₫</TableCell>
                      <TableCell>{p.baby_ids.length}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openReview(p)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xem giao dịch</DialogTitle>
            <DialogDescription>
              {selectedPayment?.user_phone} — {selectedPayment?.amount.toLocaleString('vi-VN')} ₫
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-muted-foreground">Ảnh chuyển khoản</Label>
                <div className="mt-1 border rounded-lg overflow-hidden">
                  {signedImageUrl ? (
                    <img src={signedImageUrl} alt="Proof" className="w-full max-h-64 object-contain bg-muted" />
                  ) : (
                    <div className="flex items-center justify-center h-32 bg-muted">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú admin</Label>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Ghi chú nội bộ..." disabled={selectedPayment.status !== 'pending'} />
              </div>
              {selectedPayment.status === 'pending' && (
                <div className="space-y-2">
                  <Label>Lý do từ chối (nếu từ chối)</Label>
                  <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." />
                </div>
              )}
              {selectedPayment.reject_reason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Lý do từ chối:</p>
                  <p className="text-sm">{selectedPayment.reject_reason}</p>
                </div>
              )}
            </div>
          )}
          {selectedPayment?.status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason.trim()} className="gap-1">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Từ chối
              </Button>
              <Button onClick={handleApprove} disabled={processing} className="gap-1">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Duyệt & Kích hoạt
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PaymentManagement;
