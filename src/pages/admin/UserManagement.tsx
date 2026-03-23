import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Lock, Unlock, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface UserProfile {
  id: string;
  phone: string;
  display_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_premium: boolean;
  trial_ends_at: string;
  last_login_at: string | null;
  created_at: string;
  baby_count?: number;
}

interface BabyInfo {
  id: string;
  name: string;
  dob: string;
  gender: string | null;
}

interface SubscriptionInfo {
  id: string;
  baby_id: string;
  status: string;
  type: string;
  start_date: string;
  end_date: string;
}

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // User detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userBabies, setUserBabies] = useState<BabyInfo[]>([]);
  const [userSubs, setUserSubs] = useState<SubscriptionInfo[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch baby counts
      const { data: babies } = await supabase.from('babies').select('user_id');
      const babyCounts: Record<string, number> = {};
      babies?.forEach(b => { babyCounts[b.user_id] = (babyCounts[b.user_id] || 0) + 1; });
      
      setUsers(data.map(u => ({ ...u, baby_count: babyCounts[u.id] || 0 })) as unknown as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const viewUserDetail = async (user: UserProfile) => {
    setSelectedUser(user);
    setDetailOpen(true);
    setLoadingDetail(true);

    const [babiesRes, subsRes] = await Promise.all([
      supabase.from('babies').select('id, name, dob, gender').eq('user_id', user.id),
      supabase.from('subscriptions').select('*').eq('user_id', user.id),
    ]);

    setUserBabies((babiesRes.data || []) as BabyInfo[]);
    setUserSubs((subsRes.data || []) as SubscriptionInfo[]);
    setLoadingDetail(false);
  };

  const toggleUserActive = async (user: UserProfile) => {
    const newStatus = !user.is_active;
    const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', user.id);
    
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
      return;
    }

    await supabase.rpc('log_admin_action', {
      p_action: newStatus ? 'unlock_user' : 'lock_user',
      p_table_name: 'profiles', p_record_id: user.id,
      p_old_values: JSON.stringify({ is_active: user.is_active }),
      p_new_values: JSON.stringify({ is_active: newStatus }),
    });

    if (!newStatus) {
      await supabase.rpc('revoke_all_user_sessions', { p_user_id: user.id });
    }

    toast({ title: newStatus ? 'Đã mở khoá tài khoản' : 'Đã khoá tài khoản' });
    fetchUsers();
  };

  const filteredUsers = users.filter(u =>
    u.phone.includes(search) || (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Quản lý người dùng" description="Xem và quản lý tài khoản người dùng">
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm theo SĐT hoặc tên..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Số bé</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Gói</TableHead>
                    <TableHead>Đăng nhập cuối</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.display_name || '—'}</TableCell>
                      <TableCell>{u.phone}</TableCell>
                      <TableCell>{u.baby_count}</TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? 'default' : 'destructive'}>
                          {u.is_active ? 'Hoạt động' : 'Bị khoá'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.is_admin ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Admin</Badge>
                        ) : u.is_premium ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Premium</Badge>
                        ) : (
                          <Badge variant="secondary" className="opacity-50">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.last_login_at ? format(new Date(u.last_login_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(u.created_at), 'dd/MM/yyyy', { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => viewUserDetail(u)} title="Xem chi tiết">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleUserActive(u)}
                            title={u.is_active ? 'Khoá tài khoản' : 'Mở khoá'}>
                            {u.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>{selectedUser?.phone} — {selectedUser?.display_name || 'Chưa đặt tên'}</DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <h4 className="font-semibold text-sm mb-2">Danh sách bé ({userBabies.length})</h4>
                {userBabies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa thêm bé nào</p>
                ) : (
                  <div className="space-y-1">
                    {userBabies.map(b => (
                      <div key={b.id} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <span>{b.name}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(b.dob), 'dd/MM/yyyy')} • {b.gender === 'male' ? 'Nam' : b.gender === 'female' ? 'Nữ' : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Gói đăng ký ({userSubs.length})</h4>
                {userSubs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có gói nào</p>
                ) : (
                  <div className="space-y-1">
                    {userSubs.map(s => (
                      <div key={s.id} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                        <span className="text-muted-foreground">
                          {format(new Date(s.start_date), 'dd/MM/yyyy')} → {format(new Date(s.end_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
