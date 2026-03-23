import React, { useCallback, useMemo } from 'react';
import { useVaccine, VaccineSchedule } from '@/contexts/VaccineContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Calendar, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UpcomingVaccinesPanelProps {
  onSelectSchedule: (schedule: VaccineSchedule) => void;
}

const ScheduleItem: React.FC<{ schedule: VaccineSchedule; onClick: () => void }> = React.memo(({ schedule, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full p-3 rounded-lg flex items-center gap-3 transition-all text-left",
      "hover:scale-[1.01] active:scale-[0.99]",
      schedule.status === 'overdue' 
        ? "bg-overdue/10 hover:bg-overdue/20 border border-overdue/30"
        : "bg-warning/10 hover:bg-warning/20 border border-warning/30"
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
      schedule.status === 'overdue' ? "bg-overdue" : "bg-warning"
    )}>
      {schedule.dose_number}
    </div>
    
    <div className="flex-1 min-w-0">
      <h4 className="font-medium truncate">
        {schedule.vaccines?.short_name || schedule.vaccines?.name}
      </h4>
      <p className="text-xs text-muted-foreground">
        {schedule.status === 'overdue' ? (
          <span className="text-overdue font-medium">
            Quá hạn {formatDistanceToNow(parseISO(schedule.scheduled_date), { locale: vi, addSuffix: false })}
          </span>
        ) : (
          <span className="text-warning">
            {format(parseISO(schedule.scheduled_date), 'dd/MM/yyyy', { locale: vi })}
            {' • '}
            {formatDistanceToNow(parseISO(schedule.scheduled_date), { locale: vi, addSuffix: true })}
          </span>
        )}
      </p>
    </div>
    
    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
  </button>
));
ScheduleItem.displayName = 'ScheduleItem';

const UpcomingVaccinesPanel: React.FC<UpcomingVaccinesPanelProps> = React.memo(({ onSelectSchedule }) => {
  const { upcomingSchedules, overdueSchedules, isLoading } = useVaccine();

  const urgentSchedules = useMemo(
    () => [...overdueSchedules, ...upcomingSchedules].slice(0, 5),
    [overdueSchedules, upcomingSchedules]
  );

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (urgentSchedules.length === 0) {
    return (
      <Card className="border-2 border-success/30 bg-success/5">
        <CardContent className="py-8 text-center">
          <div className="p-3 bg-success/10 rounded-full w-fit mx-auto mb-3">
            <Calendar className="h-8 w-8 text-success" />
          </div>
          <h3 className="font-semibold text-success">Tuyệt vời!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Không có mũi tiêm nào cần chú ý trong thời gian tới
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-2 transition-colors",
      overdueSchedules.length > 0 
        ? "border-overdue/50 bg-overdue/5" 
        : "border-warning/50 bg-warning/5"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {overdueSchedules.length > 0 ? (
            <>
              <AlertTriangle className="h-5 w-5 text-overdue" />
              <span className="text-overdue">Cần chú ý ngay</span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-warning" />
              <span className="text-warning">Sắp đến hạn</span>
            </>
          )}
          <Badge variant="secondary" className="ml-auto">
            {urgentSchedules.length} mũi
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {urgentSchedules.map((schedule) => (
          <ScheduleItem
            key={schedule.id}
            schedule={schedule}
            onClick={() => onSelectSchedule(schedule)}
          />
        ))}
        
        {(overdueSchedules.length > 5 || upcomingSchedules.length > 5) && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            Và {overdueSchedules.length + upcomingSchedules.length - 5} mũi tiêm khác
          </p>
        )}
      </CardContent>
    </Card>
  );
});

UpcomingVaccinesPanel.displayName = 'UpcomingVaccinesPanel';

export default UpcomingVaccinesPanel;
