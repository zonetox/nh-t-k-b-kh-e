import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Baby, Syringe, CreditCard, Loader2, Download,
  AlertTriangle, Activity, TrendingUp, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

interface DailyMetric {
  metric_date: string;
  total_users: number;
  total_babies: number;
  total_vaccine_schedules: number;
  completed_vaccines: number;
  pending_vaccines: number;
  overdue_vaccines: number;
  total_payments: number;
  total_revenue: number;
}

interface SystemHealth {
  failedJobs: number;
  pendingPayments: number;
  errorsLast24h: number;
}

const chartConfig = {
  total_users: { label: 'Người dùng', color: 'hsl(var(--primary))' },
  total_babies: { label: 'Trẻ em', color: 'hsl(340, 82%, 52%)' },
  completed_vaccines: { label: 'Đã tiêm', color: 'hsl(142, 71%, 45%)' },
  overdue_vaccines: { label: 'Quá hạn', color: 'hsl(0, 84%, 60%)' },
  total_revenue: { label: 'Doanh thu', color: 'hsl(var(--primary))' },
};

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useAdmin();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [health, setHealth] = useState<SystemHealth>({ failedJobs: 0, pendingPayments: 0, errorsLast24h: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [metricsRes, healthRes] = await Promise.all([
      supabase.from('system_metrics_daily').select('*').order('metric_date', { ascending: true }).limit(30),
      Promise.all([
        supabase.from('notification_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('system_errors').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      ]),
    ]);

    if (metricsRes.data) setMetrics(metricsRes.data as DailyMetric[]);
    setHealth({
      failedJobs: healthRes[0].count || 0,
      pendingPayments: healthRes[1].count || 0,
      errorsLast24h: healthRes[2].count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const exportCSV = async (type: 'users' | 'babies' | 'vaccinations' | 'payments') => {
    if (!isSuperAdmin) {
      toast({ title: 'Không có quyền', description: 'Chỉ Super Admin mới được xuất dữ liệu.', variant: 'destructive' });
      return;
    }
    setExporting(type);
    try {
      let csvContent = '';
      let filename = '';

      if (type === 'users') {
        const { data } = await supabase.from('profiles').select('id, phone, display_name, is_active, created_at, last_login_at');
        if (!data?.length) throw new Error('Không có dữ liệu');
        csvContent = 'ID,SĐT,Tên,Trạng thái,Ngày tạo,Đăng nhập cuối\n' +
          data.map(r => `${r.id},${r.phone},${r.display_name || ''},${r.is_active ? 'Active' : 'Inactive'},${r.created_at},${r.last_login_at || ''}`).join('\n');
        filename = 'users.csv';
      } else if (type === 'babies') {
        const { data } = await supabase.from('babies').select('id, name, dob, gender, created_at').is('deleted_at', null);
        if (!data?.length) throw new Error('Không có dữ liệu');
        csvContent = 'ID,Tên,Ngày sinh,Giới tính,Ngày tạo\n' +
          data.map(r => `${r.id},${r.name},${r.dob},${r.gender || ''},${r.created_at}`).join('\n');
        filename = 'babies.csv';
      } else if (type === 'vaccinations') {
        const { data } = await supabase.from('vaccine_schedules').select('id, baby_id, vaccine_id, dose_number, scheduled_date, status');
        if (!data?.length) throw new Error('Không có dữ liệu');
        csvContent = 'ID,Baby ID,Vaccine ID,Liều,Ngày hẹn,Trạng thái\n' +
          data.map(r => `${r.id},${r.baby_id},${r.vaccine_id},${r.dose_number},${r.scheduled_date},${r.status}`).join('\n');
        filename = 'vaccinations.csv';
      } else if (type === 'payments') {
        const { data } = await supabase.from('payments').select('id, user_id, amount, status, created_at, reviewed_at');
        if (!data?.length) throw new Error('Không có dữ liệu');
        csvContent = 'ID,User ID,Số tiền,Trạng thái,Ngày tạo,Ngày duyệt\n' +
          data.map(r => `${r.id},${r.user_id},${r.amount},${r.status},${r.created_at},${r.reviewed_at || ''}`).join('\n');
        filename = 'payments.csv';
      }

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Đã xuất ${filename}` });
    } catch (err: any) {
      toast({ title: 'Lỗi xuất dữ liệu', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const hasWarning = health.failedJobs > 0 || health.pendingPayments > 5 || health.errorsLast24h > 10;

  return (
    <AdminLayout title="Phân tích hệ thống" description="Giám sát tăng trưởng, vận hành và sức khỏe hệ thống">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* System Health */}
          <Card className={hasWarning ? 'border-destructive/50' : 'border-green-500/50'}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5" />
                Sức khỏe hệ thống
                {hasWarning ? (
                  <Badge variant="destructive" className="ml-2">Cần chú ý</Badge>
                ) : (
                  <Badge className="ml-2 bg-green-500">Bình thường</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  {health.failedJobs > 0 ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                  <div>
                    <p className="text-sm text-muted-foreground">Thông báo lỗi</p>
                    <p className="text-xl font-bold">{health.failedJobs}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {health.pendingPayments > 5 ? <Clock className="h-5 w-5 text-orange-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                  <div>
                    <p className="text-sm text-muted-foreground">Thanh toán chờ duyệt</p>
                    <p className="text-xl font-bold">{health.pendingPayments}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {health.errorsLast24h > 10 ? <AlertCircle className="h-5 w-5 text-destructive" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                  <div>
                    <p className="text-sm text-muted-foreground">Lỗi 24h qua</p>
                    <p className="text-xl font-bold">{health.errorsLast24h}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {latestMetric && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Người dùng', value: latestMetric.total_users, icon: Users, color: 'text-blue-500' },
                { label: 'Trẻ em', value: latestMetric.total_babies, icon: Baby, color: 'text-pink-500' },
                { label: 'Lịch tiêm', value: latestMetric.total_vaccine_schedules, icon: Syringe, color: 'text-primary' },
                { label: 'Đã tiêm', value: latestMetric.completed_vaccines, icon: CheckCircle, color: 'text-green-500' },
                { label: 'Quá hạn', value: latestMetric.overdue_vaccines, icon: AlertTriangle, color: 'text-destructive' },
                { label: 'Doanh thu', value: `${(latestMetric.total_revenue / 1000).toFixed(0)}K`, icon: CreditCard, color: 'text-orange-500' },
              ].map(card => (
                <Card key={card.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{card.label}</span>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Charts */}
          {metrics.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Tăng trưởng người dùng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric_date" tickFormatter={(v) => format(new Date(v), 'dd/MM')} fontSize={11} />
                      <YAxis fontSize={11} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="total_users" stroke="var(--color-total_users)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="total_babies" stroke="var(--color-total_babies)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Syringe className="h-4 w-4" /> Tiến độ tiêm chủng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <BarChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric_date" tickFormatter={(v) => format(new Date(v), 'dd/MM')} fontSize={11} />
                      <YAxis fontSize={11} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="completed_vaccines" fill="var(--color-completed_vaccines)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="overdue_vaccines" fill="var(--color-overdue_vaccines)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Doanh thu tích lũy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric_date" tickFormatter={(v) => format(new Date(v), 'dd/MM')} fontSize={11} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} fontSize={11} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="total_revenue" stroke="var(--color-total_revenue)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {metrics.length <= 1 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Chưa có đủ dữ liệu để hiển thị biểu đồ.</p>
                <p className="text-xs mt-1">Dữ liệu sẽ được tổng hợp mỗi ngày lúc 02:00 AM.</p>
              </CardContent>
            </Card>
          )}

          {/* Data Export */}
          {isSuperAdmin && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" /> Xuất dữ liệu (CSV)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'users' as const, label: 'Người dùng' },
                    { key: 'babies' as const, label: 'Trẻ em' },
                    { key: 'vaccinations' as const, label: 'Lịch tiêm' },
                    { key: 'payments' as const, label: 'Thanh toán' },
                  ].map(item => (
                    <Button
                      key={item.key}
                      variant="outline"
                      size="sm"
                      onClick={() => exportCSV(item.key)}
                      disabled={exporting !== null}
                      className="gap-2"
                    >
                      {exporting === item.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                      {item.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default Analytics;
