import React, { useState } from 'react';
import { VaccineSchedule, useVaccine } from '@/contexts/VaccineContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Syringe, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Check, 
  SkipForward,
  Loader2,
  Info,
  MapPin,
  FileText,
  Upload
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import MarkAsDoneDialog from './MarkAsDoneDialog';

interface VaccineScheduleDetailProps {
  schedule: VaccineSchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  done: {
    icon: Check,
    label: 'Đã tiêm',
    className: 'bg-success/10 text-success border-success/30',
  },
  upcoming: {
    icon: Clock,
    label: 'Sắp đến hạn',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  overdue: {
    icon: AlertTriangle,
    label: 'Quá hạn',
    className: 'bg-overdue/10 text-overdue border-overdue/30',
  },
  pending: {
    icon: Calendar,
    label: 'Chờ đến hạn',
    className: 'bg-muted text-muted-foreground',
  },
  skipped: {
    icon: SkipForward,
    label: 'Đã bỏ qua',
    className: 'bg-muted/50 text-muted-foreground',
  },
};

const VaccineScheduleDetail: React.FC<VaccineScheduleDetailProps> = ({
  schedule,
  open,
  onOpenChange,
}) => {
  const { markAsSkipped, undoSkipped, undoMarkAsDone } = useVaccine();
  const [isLoading, setIsLoading] = useState(false);
  const [markAsDoneOpen, setMarkAsDoneOpen] = useState(false);

  if (!schedule) return null;

  const config = statusConfig[schedule.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const handleMarkAsSkipped = async () => {
    setIsLoading(true);
    const result = await markAsSkipped(schedule.id);
    setIsLoading(false);
    
    if (result.success) {
      onOpenChange(false);
    }
  };

  const handleUndoSkipped = async () => {
    setIsLoading(true);
    const result = await undoSkipped(schedule.id);
    setIsLoading(false);
    
    if (result.success) {
      onOpenChange(false);
    }
  };

  const handleUndoMarkAsDone = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy xác nhận tiêm chủng này? Trạng thái sẽ quay về chưa tiêm.')) {
      return;
    }
    
    setIsLoading(true);
    const result = await undoMarkAsDone(schedule.id);
    setIsLoading(false);
    
    if (result.success) {
      onOpenChange(false);
    }
  };

  const handleMarkAsDone = () => {
    setMarkAsDoneOpen(true);
  };

  return (
    <>
      <Dialog open={open && !markAsDoneOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-primary" />
              Chi tiết mũi tiêm
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Vaccine info */}
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0",
                schedule.status === 'done' ? "bg-success" :
                schedule.status === 'overdue' ? "bg-overdue" :
                schedule.status === 'upcoming' ? "bg-warning" :
                "bg-muted-foreground"
              )}>
                {schedule.status === 'done' ? (
                  <Check className="h-6 w-6" />
                ) : (
                  schedule.dose_number
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-xl">
                    {schedule.vaccines?.name}
                  </h3>
                  <Badge variant="outline" className={cn(
                    "text-[10px] uppercase font-bold border-none",
                    schedule.vaccines?.type === 'optional' 
                      ? "bg-purple-600 text-white" 
                      : "bg-blue-600 text-white"
                  )}>
                    {schedule.vaccines?.type === 'optional' ? 'Tiêm chủng dịch vụ' : 'Tiêm chủng mở rộng'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  Mũi tiêm thứ {schedule.dose_number}
                  {schedule.vaccines?.total_doses && schedule.vaccines.total_doses > 1 && (
                    <span> / Tổng {schedule.vaccines.total_doses} mũi</span>
                  )}
                </p>
                <Badge className={cn("mt-2", config.className)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>

            {/* Schedule date */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Ngày dự kiến: </span>
                  <span className="font-medium">
                    {format(parseISO(schedule.scheduled_date), 'dd/MM/yyyy', { locale: vi })}
                  </span>
                </span>
              </div>
              
              {schedule.status !== 'done' && schedule.status !== 'skipped' && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className={cn(
                    "text-sm",
                    schedule.status === 'overdue' && "text-overdue font-medium"
                  )}>
                    {schedule.status === 'overdue' ? 'Quá hạn ' : ''}
                    {formatDistanceToNow(parseISO(schedule.scheduled_date), { 
                      locale: vi,
                      addSuffix: schedule.status !== 'overdue'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Vaccine description */}
            {schedule.vaccines?.description && (
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Thông tin mũi tiêm</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {schedule.vaccines.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vaccine history if done */}
            {schedule.status === 'done' && (
              <div className="bg-success/5 border border-success/30 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-success flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Thông tin xác nhận tiêm
                </h4>
                
                {schedule.vaccine_history && schedule.vaccine_history[0] ? (
                  <div className="text-sm space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Ngày tiêm thực tế</Label>
                        <p className="font-medium">
                          {format(parseISO(schedule.vaccine_history[0].injected_date), 'dd/MM/yyyy', { locale: vi })}
                        </p>
                      </div>
                      {schedule.vaccine_history[0].batch_number && (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase">Số lô</Label>
                          <p className="font-medium">{schedule.vaccine_history[0].batch_number}</p>
                        </div>
                      )}
                    </div>

                    {schedule.vaccine_history[0].location && (
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Địa điểm tiêm</Label>
                        <div className="flex items-start gap-1.5 pt-0.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <p>{schedule.vaccine_history[0].location}</p>
                        </div>
                      </div>
                    )}

                    {schedule.vaccine_history[0].notes && (
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Ghi chú</Label>
                        <div className="flex items-start gap-1.5 pt-0.5 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <p>{schedule.vaccine_history[0].notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Display existing images */}
                    {schedule.vaccine_history[0].vaccine_history_images && schedule.vaccine_history[0].vaccine_history_images.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-success/20">
                        <Label className="text-[10px] text-muted-foreground uppercase">Ảnh minh chứng</Label>
                        <div className="flex gap-2 flex-wrap">
                          {schedule.vaccine_history[0].vaccine_history_images.map((img, idx: number) => {
                            const isPath = !img.image_url.startsWith('http');
                            const displayUrl = isPath 
                              ? supabase.storage.from('vaccination-certificates').getPublicUrl(img.image_url).data.publicUrl
                              : img.image_url;
                              
                            return (
                              <a 
                                key={idx} 
                                href={displayUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="h-16 w-16 rounded-md overflow-hidden border border-success/20 hover:opacity-80 transition-opacity"
                              >
                                <img src={displayUrl} alt="Minh chứng" className="h-full w-full object-cover" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Chưa có thông tin chi tiết lịch sử tiêm (Mũi tiêm cũ).
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {schedule.status === 'done' ? (
              <div className="flex w-full justify-between gap-2 overflow-hidden">
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="h-9 px-3 text-xs"
                    onClick={handleUndoMarkAsDone}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Hoàn tác (Đánh dấu chưa tiêm)
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="h-9 px-4" onClick={() => onOpenChange(false)}>
                  Đóng
                </Button>
              </div>
            ) : schedule.status === 'skipped' ? (
              <div className="flex w-full sm:w-auto gap-2 justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Đóng
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleUndoSkipped}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Hoàn tác bỏ qua
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={handleMarkAsSkipped}
                  disabled={isLoading}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Bỏ qua
                </Button>
                <Button onClick={handleMarkAsDone}>
                  <Check className="h-4 w-4 mr-2" />
                  Đánh dấu đã tiêm
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MarkAsDoneDialog
        schedule={schedule}
        open={markAsDoneOpen}
        onOpenChange={(open) => {
          setMarkAsDoneOpen(open);
          if (!open) {
            onOpenChange(false);
          }
        }}
      />
    </>
  );
};

export default VaccineScheduleDetail;
