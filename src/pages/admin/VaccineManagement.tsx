import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Loader2, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

interface Vaccine {
  id: string;
  name: string;
  short_name: string | null;
  code: string | null;
  type: string;
  description: string | null;
  total_doses: number;
  is_mandatory: boolean;
  is_active: boolean;
  deleted_at: string | null;
}

interface DoseRule {
  id: string;
  vaccine_id: string;
  dose_number: number;
  min_age_days: number;
  max_age_days: number | null;
  recommended_age_days: number;
  min_interval_days: number | null;
  is_active: boolean;
  version: number;
  applied_from: string;
  notes: string | null;
}

const VaccineManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [doseRules, setDoseRules] = useState<DoseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVaccine, setExpandedVaccine] = useState<string | null>(null);

  const [vaccineDialogOpen, setVaccineDialogOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null);
  const [vaccineForm, setVaccineForm] = useState({
    name: '', short_name: '', code: '', type: 'standard',
    description: '', total_doses: 1, is_mandatory: false, is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const [doseDialogOpen, setDoseDialogOpen] = useState(false);
  const [editingDose, setEditingDose] = useState<DoseRule | null>(null);
  const [doseForm, setDoseForm] = useState({
    vaccine_id: '', dose_number: 1, min_age_days: 0, max_age_days: '',
    recommended_age_days: 0, min_interval_days: '', notes: '',
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Vaccine | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [vRes, dRes] = await Promise.all([
      supabase.from('vaccines').select('*').is('deleted_at', null).order('name'),
      supabase.from('vaccine_dose_rules').select('*').order('vaccine_id, dose_number'),
    ]);
    if (vRes.data) setVaccines(vRes.data as Vaccine[]);
    if (dRes.data) setDoseRules(dRes.data as DoseRule[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const checkRateLimit = async (): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.rpc('check_admin_rate_limit', { p_admin_id: user.id });
    if (error || data === false) {
      toast({ title: 'Quá giới hạn', description: 'Tối đa 30 hành động/phút.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const openAddVaccine = () => {
    setEditingVaccine(null);
    setVaccineForm({
      name: '', short_name: '', code: '', type: 'standard',
      description: '', total_doses: 1, is_mandatory: false, is_active: true,
    });
    setVaccineDialogOpen(true);
  };

  const openEditVaccine = (v: Vaccine) => {
    setEditingVaccine(v);
    setVaccineForm({
      name: v.name, short_name: v.short_name || '', code: v.code || '',
      type: v.type, description: v.description || '', total_doses: v.total_doses,
      is_mandatory: v.is_mandatory, is_active: v.is_active,
    });
    setVaccineDialogOpen(true);
  };

  const saveVaccine = async () => {
    if (!(await checkRateLimit())) return;
    setSaving(true);
    try {
      const payload = {
        name: vaccineForm.name.trim(),
        short_name: vaccineForm.short_name.trim() || null,
        code: vaccineForm.code.trim() || null,
        type: vaccineForm.type,
        description: vaccineForm.description.trim() || null,
        total_doses: vaccineForm.total_doses,
        is_mandatory: vaccineForm.is_mandatory,
        is_active: vaccineForm.is_active,
      };

      if (editingVaccine) {
        const { error } = await supabase.from('vaccines').update(payload).eq('id', editingVaccine.id);
        if (error) throw error;
        await supabase.rpc('log_admin_action', {
          p_action: 'update_vaccine', p_table_name: 'vaccines', p_record_id: editingVaccine.id,
          p_old_values: JSON.stringify(editingVaccine), p_new_values: JSON.stringify(payload),
        });
      } else {
        const { error } = await supabase.from('vaccines').insert(payload);
        if (error) throw error;
      }

      toast({ title: editingVaccine ? 'Đã cập nhật vắc-xin' : 'Đã thêm vắc-xin mới' });
      setVaccineDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!deleteTarget || !user) return;
    if (!(await checkRateLimit())) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc('soft_delete_vaccine', {
        p_vaccine_id: deleteTarget.id,
        p_admin_id: user.id,
      });
      if (error) throw error;
      toast({ title: 'Đã xoá vắc-xin (soft delete)' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const openAddDose = (vaccineId: string) => {
    const existingDoses = doseRules.filter(d => d.vaccine_id === vaccineId && d.is_active);
    setEditingDose(null);
    setDoseForm({
      vaccine_id: vaccineId, dose_number: existingDoses.length + 1,
      min_age_days: 0, max_age_days: '', recommended_age_days: 0,
      min_interval_days: '', notes: '',
    });
    setDoseDialogOpen(true);
  };

  const openEditDose = (d: DoseRule) => {
    setEditingDose(d);
    setDoseForm({
      vaccine_id: d.vaccine_id, dose_number: d.dose_number,
      min_age_days: d.min_age_days, max_age_days: d.max_age_days?.toString() || '',
      recommended_age_days: d.recommended_age_days,
      min_interval_days: d.min_interval_days?.toString() || '', notes: d.notes || '',
    });
    setDoseDialogOpen(true);
  };

  const validateDoseForm = (): string | null => {
    const { min_age_days, recommended_age_days, max_age_days } = doseForm;
    const maxAge = max_age_days ? parseInt(max_age_days) : null;

    if (min_age_days > recommended_age_days) {
      return 'Tuổi tối thiểu phải ≤ tuổi đề xuất';
    }
    if (maxAge !== null && maxAge < recommended_age_days) {
      return 'Tuổi tối đa phải ≥ tuổi đề xuất';
    }
    return null;
  };

  const saveDoseRule = async () => {
    const validationError = validateDoseForm();
    if (validationError) {
      toast({ title: 'Dữ liệu không hợp lệ', description: validationError, variant: 'destructive' });
      return;
    }
    if (!(await checkRateLimit())) return;
    setSaving(true);
    try {
      const payload = {
        vaccine_id: doseForm.vaccine_id,
        dose_number: doseForm.dose_number,
        min_age_days: doseForm.min_age_days,
        max_age_days: doseForm.max_age_days ? parseInt(doseForm.max_age_days) : null,
        recommended_age_days: doseForm.recommended_age_days,
        min_interval_days: doseForm.min_interval_days ? parseInt(doseForm.min_interval_days) : null,
        notes: doseForm.notes.trim() || null,
        is_active: true,
      };

      if (editingDose) {
        await supabase.from('vaccine_dose_rules').update({ is_active: false }).eq('id', editingDose.id);
        const { error } = await supabase.from('vaccine_dose_rules').insert({
          ...payload,
          version: (editingDose.version || 1) + 1,
          applied_from: new Date().toISOString().split('T')[0],
        });
        if (error) throw error;
        await supabase.rpc('log_admin_action', {
          p_action: 'update_dose_rule', p_table_name: 'vaccine_dose_rules',
          p_record_id: editingDose.id,
          p_old_values: JSON.stringify(editingDose), p_new_values: JSON.stringify(payload),
        });
      } else {
        const { error } = await supabase.from('vaccine_dose_rules').insert({
          ...payload, version: 1, applied_from: new Date().toISOString().split('T')[0],
        });
        if (error) throw error;
      }

      toast({ title: editingDose ? 'Đã cập nhật liều tiêm (version mới)' : 'Đã thêm liều tiêm' });
      setDoseDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const daysToAge = (days: number) => {
    if (days < 30) return `${days} ngày`;
    if (days < 365) return `${Math.round(days / 30)} tháng`;
    return `${(days / 365).toFixed(1)} năm`;
  };

  return (
    <AdminLayout title="Cấu hình vắc-xin" description="Quản lý danh mục vắc-xin và lịch liều tiêm">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openAddVaccine} className="gap-2">
            <Plus className="h-4 w-4" /> Thêm vắc-xin
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Tên vắc-xin</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Số liều</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccines.map(v => {
                    const vDoses = doseRules.filter(d => d.vaccine_id === v.id && d.is_active);
                    const isExpanded = expandedVaccine === v.id;
                    return (
                      <React.Fragment key={v.id}>
                        <TableRow className="cursor-pointer" onClick={() => setExpandedVaccine(isExpanded ? null : v.id)}>
                          <TableCell>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-medium">
                            {v.name}
                            {v.is_mandatory && <Badge variant="secondary" className="ml-2 text-xs">Bắt buộc</Badge>}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{v.code || v.short_name || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {v.type === 'standard' ? 'TCMR' : v.type === 'optional' ? 'Dịch vụ' : v.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{v.total_doses}</TableCell>
                          <TableCell>
                            <Badge variant={v.is_active ? 'default' : 'secondary'}>
                              {v.is_active ? 'Hoạt động' : 'Ẩn'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditVaccine(v); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/30 p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-sm">Phác đồ liều tiêm</h4>
                                  <Button size="sm" variant="outline" onClick={() => openAddDose(v.id)} className="gap-1">
                                    <Plus className="h-3 w-3" /> Thêm liều
                                  </Button>
                                </div>
                                {vDoses.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Chưa có cấu hình liều tiêm</p>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Liều</TableHead>
                                        <TableHead>Tuổi đề xuất</TableHead>
                                        <TableHead>Tuổi tối thiểu</TableHead>
                                        <TableHead>Tuổi tối đa</TableHead>
                                        <TableHead>Khoảng cách tối thiểu</TableHead>
                                        <TableHead>Version</TableHead>
                                        <TableHead></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {vDoses.map(d => (
                                        <TableRow key={d.id}>
                                          <TableCell className="font-medium">Liều {d.dose_number}</TableCell>
                                          <TableCell>{daysToAge(d.recommended_age_days)}</TableCell>
                                          <TableCell>{daysToAge(d.min_age_days)}</TableCell>
                                          <TableCell>{d.max_age_days ? daysToAge(d.max_age_days) : '—'}</TableCell>
                                          <TableCell>{d.min_interval_days ? `${d.min_interval_days} ngày` : '—'}</TableCell>
                                          <TableCell><Badge variant="outline">v{d.version}</Badge></TableCell>
                                          <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => openEditDose(d)}>
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vaccine Dialog */}
      <Dialog open={vaccineDialogOpen} onOpenChange={setVaccineDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVaccine ? 'Chỉnh sửa vắc-xin' : 'Thêm vắc-xin mới'}</DialogTitle>
            <DialogDescription>Cấu hình thông tin vắc-xin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên vắc-xin *</Label>
                <Input value={vaccineForm.name} onChange={e => setVaccineForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tên viết tắt</Label>
                <Input value={vaccineForm.short_name} onChange={e => setVaccineForm(p => ({ ...p, short_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã vắc-xin</Label>
                <Input value={vaccineForm.code} onChange={e => setVaccineForm(p => ({ ...p, code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Số liều *</Label>
                <Input type="number" min={1} value={vaccineForm.total_doses} onChange={e => setVaccineForm(p => ({ ...p, total_doses: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Loại</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={vaccineForm.type} onChange={e => setVaccineForm(p => ({ ...p, type: e.target.value }))}>
                <option value="standard">Tiêm chủng mở rộng</option>
                <option value="optional">Dịch vụ</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={vaccineForm.description} onChange={e => setVaccineForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={vaccineForm.is_mandatory} onCheckedChange={v => setVaccineForm(p => ({ ...p, is_mandatory: v }))} />
                <Label>Bắt buộc</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={vaccineForm.is_active} onCheckedChange={v => setVaccineForm(p => ({ ...p, is_active: v }))} />
                <Label>Hoạt động</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveVaccine} disabled={saving || !vaccineForm.name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingVaccine ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dose Rule Dialog */}
      <Dialog open={doseDialogOpen} onOpenChange={setDoseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDose ? 'Chỉnh sửa liều tiêm (tạo version mới)' : 'Thêm liều tiêm'}</DialogTitle>
            <DialogDescription>
              {editingDose ? 'Bản cũ sẽ được giữ lại, bé mới sẽ dùng version mới' : 'Cấu hình phác đồ liều tiêm'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Liều số *</Label>
                <Input type="number" min={1} value={doseForm.dose_number} onChange={e => setDoseForm(p => ({ ...p, dose_number: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-2">
                <Label>Tuổi đề xuất (ngày) *</Label>
                <Input type="number" min={0} value={doseForm.recommended_age_days} onChange={e => setDoseForm(p => ({ ...p, recommended_age_days: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tuổi tối thiểu (ngày) *</Label>
                <Input type="number" min={0} value={doseForm.min_age_days} onChange={e => setDoseForm(p => ({ ...p, min_age_days: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Tuổi tối đa (ngày)</Label>
                <Input type="number" min={0} value={doseForm.max_age_days} onChange={e => setDoseForm(p => ({ ...p, max_age_days: e.target.value }))} placeholder="Không giới hạn" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Khoảng cách tối thiểu giữa liều (ngày)</Label>
              <Input type="number" min={0} value={doseForm.min_interval_days} onChange={e => setDoseForm(p => ({ ...p, min_interval_days: e.target.value }))} placeholder="Không áp dụng" />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea value={doseForm.notes} onChange={e => setDoseForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveDoseRule} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDose ? 'Tạo version mới' : 'Thêm liều'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Soft Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá vắc-xin "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Vắc-xin sẽ được ẩn (soft delete). Nếu có lịch tiêm đang hoạt động, hệ thống sẽ từ chối xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleSoftDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default VaccineManagement;
