import React, { useCallback, useMemo, useState } from 'react';
import { useVaccine, VaccineSchedule } from '@/contexts/VaccineContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Calendar, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
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
      <div className="flex items-center gap-1.5 flex-wrap">
        <h4 className="font-bold truncate">
          {schedule.vaccines?.name}
        </h4>
        <Badge variant="outline" className={cn(
          "text-[8px] px-1 h-3.5 uppercase font-bold border-none",
          schedule.vaccines?.type === 'optional' 
            ? "bg-purple-600 text-white" 
            : "bg-blue-600 text-white"
        )}>
          {schedule.vaccines?.type === 'optional' ? 'Dịch vụ' : 'Mở rộng'}
        </Badge>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">
        {schedule.vaccines?.short_name} • Liều {schedule.dose_number}
      </p>
      <p className="text-xs text-muted-foreground">
        {schedule.status === 'overdue' ? (
          <span className="text-overdue font-bold">
            Quá hạn {formatDistanceToNow(parseISO(schedule.scheduled_date), { locale: vi, addSuffix: false })}
          </span>
        ) : (
          <span className="text-warning font-medium">
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
  const [showAll, setShowAll] = useState(false);

  const allUrgentSchedules = useMemo(
    () => [...overdueSchedules, ...upcomingSchedules],
    [overdueSchedules, upcomingSchedules]
  );

  const urgentSchedules = useMemo(
    () => showAll ? allUrgentSchedules : allUrgentSchedules.slice(0, 5),
    [allUrgentSchedules, showAll]
  );

  const remaining = allUrgentSchedules.length - 5;

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
            {allUrgentSchedules.length} mũi
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
        
        {remaining > 0 && (
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground pt-2 pb-1 transition-colors"
          >
            {showAll ? (
              <><ChevronUp className="h-4 w-4" /> Thu gọn</>
            ) : (
              <><ChevronDown className="h-4 w-4" /> Xem thêm {remaining} mũi khác</>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
});

UpcomingVaccinesPanel.displayName = 'UpcomingVaccinesPanel';

export default UpcomingVaccinesPanel;
