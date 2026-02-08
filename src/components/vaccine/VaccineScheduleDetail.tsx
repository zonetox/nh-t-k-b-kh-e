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
  Info
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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
  const { markAsSkipped } = useVaccine();
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
                <h3 className="font-semibold text-lg">
                  {schedule.vaccines?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Liều {schedule.dose_number}
                  {schedule.vaccines?.total_doses && schedule.vaccines.total_doses > 1 && (
                    <span> / {schedule.vaccines.total_doses}</span>
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
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {schedule.vaccines.description}
                  </p>
                </div>
              </div>
            )}

            {/* Vaccine history if done */}
            {schedule.status === 'done' && schedule.vaccine_history && (
              <div className="bg-success/5 border border-success/30 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-success flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Đã hoàn thành
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Ngày tiêm: </span>
                    {format(parseISO(schedule.vaccine_history.injected_date), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                  {schedule.vaccine_history.location && (
                    <p>
                      <span className="text-muted-foreground">Địa điểm: </span>
                      {schedule.vaccine_history.location}
                    </p>
                  )}
                  {schedule.vaccine_history.batch_number && (
                    <p>
                      <span className="text-muted-foreground">Số lô: </span>
                      {schedule.vaccine_history.batch_number}
                    </p>
                  )}
                  {schedule.vaccine_history.notes && (
                    <p className="pt-2 border-t border-success/20">
                      <span className="text-muted-foreground">Ghi chú: </span>
                      {schedule.vaccine_history.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {schedule.status === 'done' || schedule.status === 'skipped' ? (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
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
