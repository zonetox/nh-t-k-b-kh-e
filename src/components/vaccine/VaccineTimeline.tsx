import React from 'react';
import { useVaccine, VaccineSchedule } from '@/contexts/VaccineContext';
import { useBaby } from '@/contexts/BabyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import VaccineCard from './VaccineCard';
import { cn } from '@/lib/utils';

interface VaccineTimelineProps {
  onSelectSchedule: (schedule: VaccineSchedule) => void;
}

const VaccineTimeline: React.FC<VaccineTimelineProps> = ({ onSelectSchedule }) => {
  const { getSchedulesByAgeMonth, isLoading, schedules } = useVaccine();
  const { selectedBaby } = useBaby();

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

  if (!selectedBaby || schedules.length === 0) {
    return null;
  }

  const schedulesByMonth = getSchedulesByAgeMonth();
  const sortedMonths = Object.keys(schedulesByMonth)
    .map(Number)
    .sort((a, b) => a - b);

  // Calculate current age in months
  const dob = new Date(selectedBaby.dob);
  const today = new Date();
  const currentAgeMonths = Math.floor(
    (today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Lịch tiêm theo tháng tuổi</CardTitle>
        <p className="text-sm text-muted-foreground">
          Bé hiện tại: {currentAgeMonths} tháng tuổi
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4 pt-0 space-y-4">
            {sortedMonths.map((month) => {
              const monthSchedules = schedulesByMonth[month];
              const doneCount = monthSchedules.filter(s => s.status === 'done').length;
              const hasOverdue = monthSchedules.some(s => s.status === 'overdue');
              const hasUpcoming = monthSchedules.some(s => s.status === 'upcoming');
              const allDone = doneCount === monthSchedules.length;
              
              const isCurrent = month === currentAgeMonths;
              const isPast = month < currentAgeMonths;
              
              return (
                <div 
                  key={month}
                  className={cn(
                    "relative pl-6 pb-4 border-l-2 last:border-l-0 last:pb-0",
                    allDone ? "border-success" : 
                    hasOverdue ? "border-overdue" :
                    hasUpcoming ? "border-warning" :
                    isPast ? "border-muted" : "border-muted"
                  )}
                >
                  {/* Timeline dot */}
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
                  
                  {/* Month header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn(
                      "font-semibold",
                      isCurrent && "text-primary"
                    )}>
                      {month === 0 ? 'Sơ sinh' : `${month} tháng`}
                    </span>
                    <Badge 
                      variant={allDone ? 'success' : hasOverdue ? 'destructive' : 'secondary'} 
                      className="text-xs"
                    >
                      {doneCount}/{monthSchedules.length}
                    </Badge>
                    {isCurrent && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        Hiện tại
                      </Badge>
                    )}
                  </div>
                  
                  {/* Vaccine cards */}
                  <div className="space-y-2">
                    {monthSchedules.map((schedule) => (
                      <VaccineCard
                        key={schedule.id}
                        schedule={schedule}
                        compact
                        onClick={() => onSelectSchedule(schedule)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default VaccineTimeline;
