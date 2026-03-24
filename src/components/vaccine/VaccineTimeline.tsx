import React, { useMemo } from 'react';
import { useVaccine, VaccineSchedule } from '@/contexts/VaccineContext';
import { useBaby } from '@/contexts/BabyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import VaccineCard from './VaccineCard';
import { cn } from '@/lib/utils';
import { differenceInCalendarMonths, parseISO } from 'date-fns';

interface VaccineTimelineProps {
  onSelectSchedule: (schedule: VaccineSchedule) => void;
}

interface MonthGroupProps {
  month: number;
  schedules: VaccineSchedule[];
  currentAgeMonths: number;
  onSelectSchedule: (schedule: VaccineSchedule) => void;
}

const MonthGroup: React.FC<MonthGroupProps> = React.memo(({ month, schedules, currentAgeMonths, onSelectSchedule }) => {
  const doneCount = schedules.filter(s => s.status === 'done').length;
  const hasOverdue = schedules.some(s => s.status === 'overdue');
  const hasUpcoming = schedules.some(s => s.status === 'upcoming');
  const allDone = doneCount === schedules.length;
  const isCurrent = month === currentAgeMonths;
  const isPast = month < currentAgeMonths;

  return (
    <div
      className={cn(
        "relative pl-6 pb-4 border-l-2 last:border-l-0 last:pb-0",
        allDone ? "border-success" :
        hasOverdue ? "border-overdue" :
        hasUpcoming ? "border-warning" :
        "border-muted"
      )}
    >
      <div className={cn(
        "absolute -left-2 w-4 h-4 rounded-full border-2 bg-background",
        allDone ? "border-success bg-success" :
        hasOverdue ? "border-overdue" :
        hasUpcoming ? "border-warning" :
        "border-muted"
      )}>
        {isCurrent && (
          <div className="absolute inset-0 rounded-full animate-ping bg-primary/50" />
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={cn("font-semibold", isCurrent && "text-primary")}>
          {month === 0 ? 'Sơ sinh' : `Tháng thứ ${month}`}
        </span>
        <Badge
          variant={allDone ? 'success' : hasOverdue ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {doneCount}/{schedules.length}
        </Badge>
        {isCurrent && (
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
            Hiện tại
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {schedules.map((schedule, idx) => (
          <VaccineCard
            key={schedule.id}
            schedule={schedule}
            compact
            sequentialNumber={idx + 1}
            onClick={() => onSelectSchedule(schedule)}
          />
        ))}
      </div>
    </div>
  );
});
MonthGroup.displayName = 'MonthGroup';

const VaccineTimeline: React.FC<VaccineTimelineProps> = React.memo(({ onSelectSchedule }) => {
  const { getSchedulesByAgeMonth, isLoading, schedules } = useVaccine();
  const { selectedBaby } = useBaby();

  const { schedulesByMonth, sortedMonths, currentAgeMonths } = useMemo(() => {
    if (!selectedBaby || schedules.length === 0) {
      return { schedulesByMonth: {}, sortedMonths: [], currentAgeMonths: 0 };
    }
    const byMonth = getSchedulesByAgeMonth();
    const months = Object.keys(byMonth).map(Number).sort((a, b) => a - b);
    const dob = parseISO(selectedBaby.dob);
    const age = differenceInCalendarMonths(new Date(), dob);
    return { schedulesByMonth: byMonth, sortedMonths: months, currentAgeMonths: age };
  }, [getSchedulesByAgeMonth, schedules, selectedBaby]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedBaby || schedules.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Lịch tiêm theo tháng tuổi</CardTitle>
        <p className="text-sm text-muted-foreground">
          Bé hiện tại: tháng thứ {currentAgeMonths}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4 pt-0 space-y-4">
            {sortedMonths.map((month) => (
              <MonthGroup
                key={month}
                month={month}
                schedules={schedulesByMonth[month]}
                currentAgeMonths={currentAgeMonths}
                onSelectSchedule={onSelectSchedule}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

VaccineTimeline.displayName = 'VaccineTimeline';

export default VaccineTimeline;
