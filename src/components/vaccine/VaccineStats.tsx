import React from 'react';
import { useVaccine } from '@/contexts/VaccineContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const statItemsConfig = [
  { label: 'Đã tiêm', key: 'done' as const, icon: Check, className: 'text-success', bgClassName: 'bg-success/10' },
  { label: 'Sắp đến', key: 'upcoming' as const, icon: Clock, className: 'text-warning', bgClassName: 'bg-warning/10' },
  { label: 'Quá hạn', key: 'overdue' as const, icon: AlertTriangle, className: 'text-overdue', bgClassName: 'bg-overdue/10' },
  { label: 'Chờ', key: 'pending' as const, icon: Calendar, className: 'text-muted-foreground', bgClassName: 'bg-muted' },
];

const VaccineStats: React.FC = React.memo(() => {
  const { stats, isLoading } = useVaccine();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="h-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tiến độ tiêm chủng</span>
            <span className="text-sm font-bold text-primary">{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.done} / {stats.total} mũi tiêm hoàn thành
          </p>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {statItemsConfig.map((item) => (
            <div 
              key={item.label}
              className={cn("flex flex-col items-center p-2 rounded-lg", item.bgClassName)}
            >
              <item.icon className={cn("h-4 w-4 mb-1", item.className)} />
              <span className={cn("text-lg font-bold", item.className)}>
                {stats[item.key]}
              </span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

VaccineStats.displayName = 'VaccineStats';

export default VaccineStats;
