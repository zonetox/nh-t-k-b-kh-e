import React from 'react';
import { VaccineSchedule } from '@/contexts/VaccineContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, AlertTriangle, Calendar, ChevronRight, SkipForward } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface VaccineCardProps {
  schedule: VaccineSchedule;
  onClick?: () => void;
  showActions?: boolean;
  compact?: boolean;
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
  compact = false 
}) => {
  const config = statusConfig[schedule.status] || statusConfig.pending;
  const StatusIcon = config.icon;

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
            schedule.dose_number
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate",
            schedule.status === 'skipped' && "line-through"
          )}>
            {schedule.vaccines?.short_name || schedule.vaccines?.name}
          </p>
        </div>
        
        {onClick && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
      </button>
    );
  }

  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        config.className,
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
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                "font-medium",
                schedule.status === 'skipped' && "line-through text-muted-foreground"
              )}>
                {schedule.vaccines?.name}
              </h4>
              <Badge variant={config.badgeVariant} className="text-xs">
                {config.label}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Liều {schedule.dose_number}
              {schedule.vaccines?.total_doses && schedule.vaccines.total_doses > 1 && (
                <span className="text-xs"> / {schedule.vaccines.total_doses}</span>
              )}
            </p>
            
            <p className="text-sm text-muted-foreground mt-1">
              {schedule.status === 'done' && schedule.vaccine_history && schedule.vaccine_history[0] ? (
                <>Đã tiêm: {format(parseISO(schedule.vaccine_history[0].injected_date), 'dd/MM/yyyy', { locale: vi })}</>
              ) : (
                <>Lịch tiêm: {format(parseISO(schedule.scheduled_date), 'dd/MM/yyyy', { locale: vi })}</>
              )}
            </p>
            
            {schedule.vaccine_history?.[0]?.location && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {schedule.vaccine_history[0].location}
              </p>
            )}
          </div>
          
          {/* Action arrow */}
          {showActions && schedule.status !== 'done' && schedule.status !== 'skipped' && (
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
});

VaccineCard.displayName = 'VaccineCard';

export default VaccineCard;
