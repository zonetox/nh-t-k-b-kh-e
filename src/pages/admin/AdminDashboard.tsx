import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Baby, Syringe, CreditCard, Loader2 } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalBabies: number;
  totalVaccines: number;
  pendingPayments: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, babiesRes, vaccinesRes, paymentsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('babies').select('id', { count: 'exact', head: true }),
          supabase.from('vaccines').select('id', { count: 'exact', head: true }),
          supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalBabies: babiesRes.count || 0,
          totalVaccines: vaccinesRes.count || 0,
          pendingPayments: paymentsRes.count || 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Người dùng', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Trẻ em', value: stats?.totalBabies || 0, icon: Baby, color: 'text-pink-500' },
    { label: 'Loại vắc-xin', value: stats?.totalVaccines || 0, icon: Syringe, color: 'text-primary' },
    { label: 'Thanh toán chờ duyệt', value: stats?.pendingPayments || 0, icon: CreditCard, color: 'text-orange-500' },
  ];

  return (
    <AdminLayout title="Tổng quan" description="Trung tâm điều hành hệ thống">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
