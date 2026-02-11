import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
  user_phone?: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (data) {
        const userIds = [...new Set(data.filter(l => l.user_id).map(l => l.user_id!))];
        const { data: profiles } = await supabase.from('profiles').select('id, phone').in('id', userIds);
        const phoneMap: Record<string, string> = {};
        profiles?.forEach(p => { phoneMap[p.id] = p.phone; });

        setLogs(data.map(l => ({ ...l, user_phone: l.user_id ? phoneMap[l.user_id] || '—' : 'System' })) as AuditLog[]);
      }
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const actionLabel = (action: string) => {
    const labels: Record<string, string> = {
      update_vaccine: 'Cập nhật vắc-xin',
      update_dose_rule: 'Cập nhật liều tiêm',
      lock_user: 'Khoá tài khoản',
      unlock_user: 'Mở khoá tài khoản',
      approve_payment: 'Duyệt thanh toán',
      reject_payment: 'Từ chối thanh toán',
      update_profile: 'Cập nhật hồ sơ',
      change_phone: 'Đổi SĐT',
    };
    return labels[action] || action;
  };

  const filteredLogs = logs.filter(l =>
    l.action.includes(search) || l.table_name.includes(search) || (l.user_phone || '').includes(search)
  );

  return (
    <AdminLayout title="Nhật ký hệ thống" description="Theo dõi toàn bộ thao tác trong hệ thống">
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm theo hành động, bảng, SĐT..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Người thực hiện</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Bảng</TableHead>
                    <TableHead>Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Không có nhật ký nào</TableCell>
                    </TableRow>
                  ) : filteredLogs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(l.created_at), 'dd/MM HH:mm:ss', { locale: vi })}
                      </TableCell>
                      <TableCell className="text-sm">{l.user_phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{actionLabel(l.action)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.table_name}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate text-muted-foreground">
                        {l.new_values ? JSON.stringify(l.new_values).slice(0, 80) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
