import React from 'react';
import { VaccineSchedule } from '@/contexts/VaccineContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, AlertTriangle, Calendar, ChevronRight, SkipForward, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface VaccineCardProps {
  schedule: VaccineSchedule;
  onClick?: () => void;
  showActions?: boolean;
  compact?: boolean;
  sequentialNumber?: number;
}

const statusConfig = {
  done: {
    icon: Check,
    label: 'Đã tiêm',
    className: 'border-success/30 bg-success/5',
    badgeVariant: 'success' as const,
    iconBg: 'bg-success',
  },
  upcoming: {
    icon: Clock,
    label: 'Sắp đến',
    className: 'border-warning/30 bg-warning/5',
    badgeVariant: 'warning' as const,
    iconBg: 'bg-warning',
  },
  overdue: {
    icon: AlertTriangle,
    label: 'Quá hạn',
    className: 'border-overdue/30 bg-overdue/5',
    badgeVariant: 'destructive' as const,
    iconBg: 'bg-overdue',
  },
  pending: {
    icon: Calendar,
    label: 'Chờ đến hạn',
    className: 'border-muted',
    badgeVariant: 'secondary' as const,
    iconBg: 'bg-muted-foreground',
  },
  skipped: {
    icon: SkipForward,
    label: 'Đã bỏ qua',
    className: 'border-muted bg-muted/30 opacity-60',
    badgeVariant: 'outline' as const,
    iconBg: 'bg-muted-foreground',
  },
};

const VaccineCard: React.FC<VaccineCardProps> = React.memo(({ 
  schedule, 
  onClick, 
  showActions = true,
  compact = false,
  sequentialNumber,
}) => {
  const config = statusConfig[schedule.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const vaccineType = schedule.vaccines?.type === 'optional' ? 'Dịch vụ' : 'Mở rộng';
  const typeBadgeVariant = schedule.vaccines?.type === 'optional' ? 'secondary' : 'default';

  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "w-full p-2 rounded-lg flex items-center gap-2 transition-all text-left",
          "hover:scale-[1.01] active:scale-[0.99]",
          config.className,
          !onClick && "cursor-default"
        )}
      >
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
          config.iconBg
        )}>
          {schedule.status === 'done' ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            sequentialNumber ?? schedule.dose_number
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn(
              "text-sm font-medium truncate",
              schedule.status === 'skipped' && "line-through"
            )}>
              <span className="text-xs font-normal text-muted-foreground mr-1.5 break-normal">
                {format(parseISO(schedule.scheduled_date), 'dd/MM/yyyy', { locale: vi })}
              </span>
              {schedule.vaccines?.name || schedule.vaccines?.short_name}
            </p>
            <span className={cn(
              "text-[10px] px-1 rounded-sm font-semibold uppercase tracking-tighter",
              schedule.vaccines?.type === 'optional' 
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" 
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            )}>
              {vaccineType}
            </span>
          </div>
        </div>
        
        {onClick && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
      </button>
    );
  }

  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer hover:shadow-md border-l-4",
        config.className,
        schedule.vaccines?.type === 'optional' ? "border-l-purple-500" : "border-l-blue-500",
        onClick && "hover:scale-[1.01] active:scale-[0.99]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
            config.iconBg
          )}>
            {schedule.status === 'done' ? (
              <Check className="h-5 w-5" />
            ) : (
              schedule.dose_number
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className={cn(
                "font-bold text-base",
                schedule.status === 'skipped' && "line-through text-muted-foreground"
              )}>
                {schedule.vaccines?.name}
              </h4>
              <div className="flex items-center gap-1.5">
                <Badge variant={typeBadgeVariant} className={cn(
                  "text-[10px] h-5 px-1.5 uppercase font-bold",
                  schedule.vaccines?.type === 'optional' 
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-none" 
                    : "bg-blue-600 hover:bg-blue-700 text-white border-none"
                )}>
                  {vaccineType}
                </Badge>
                <Badge variant={config.badgeVariant} className="text-[10px] h-5 px-1.5 uppercase font-bold">
                  {config.label}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm font-medium text-muted-foreground">
              Mũi tiêm thứ {schedule.dose_number}
              {schedule.vaccines?.total_doses && schedule.vaccines.total_doses > 1 && (
                <span className="text-xs font-normal"> (Tổng {schedule.vaccines.total_doses} mũi)</span>
              )}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 p-2 bg-background/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Lịch dự kiến:</span>
                <span className="font-semibold">{format(parseISO(schedule.scheduled_date), 'dd/MM/yyyy', { locale: vi })}</span>
              </div>
              
              {schedule.status === 'done' && schedule.vaccine_history && schedule.vaccine_history[0] && (
                <div className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-success" />
                  <span className="text-muted-foreground">Ngày thực tế:</span>
                  <span className="font-bold text-success">{format(parseISO(schedule.vaccine_history[0].injected_date), 'dd/MM/yyyy', { locale: vi })}</span>
                </div>
              )}
            </div>
            
            {schedule.vaccines?.description && (
              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">
                {schedule.vaccines.description}
              </p>
            )}
            
            {schedule.vaccine_history?.[0]?.location && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {schedule.vaccine_history[0].location}
              </p>
            )}
          </div>
          
          {/* Action arrow */}
          {showActions && schedule.status !== 'done' && schedule.status !== 'skipped' && (
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
          )}
        </div>
      </CardContent>
    </Card>
  );
});

VaccineCard.displayName = 'VaccineCard';

export default VaccineCard;
