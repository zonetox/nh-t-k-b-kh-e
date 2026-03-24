import React from 'react';
import { useVaccine } from '@/contexts/VaccineContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const statItemsConfig = [
  { label: 'Đã tiêm', key: 'done' as const, filterTab: 'done', icon: Check, className: 'text-success', bgClassName: 'bg-success/10', hoverClassName: 'hover:bg-success/20' },
  { label: 'Sắp đến', key: 'upcoming' as const, filterTab: 'urgent', icon: Clock, className: 'text-warning', bgClassName: 'bg-warning/10', hoverClassName: 'hover:bg-warning/20' },
  { label: 'Quá hạn', key: 'overdue' as const, filterTab: 'urgent', icon: AlertTriangle, className: 'text-overdue', bgClassName: 'bg-overdue/10', hoverClassName: 'hover:bg-overdue/20' },
  { label: 'Chờ', key: 'pending' as const, filterTab: 'pending', icon: Calendar, className: 'text-muted-foreground', bgClassName: 'bg-muted', hoverClassName: 'hover:bg-muted/80' },
];

interface VaccineStatsProps {
  onStatClick?: (filterTab: string) => void;
}

const VaccineStats: React.FC<VaccineStatsProps> = React.memo(({ onStatClick }) => {
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
            <button
              key={item.label}
              onClick={() => onStatClick?.(item.filterTab)}
              disabled={!onStatClick}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-all",
                item.bgClassName,
                onStatClick && [item.hoverClassName, "cursor-pointer hover:scale-[1.03] active:scale-[0.98]"]
              )}
            >
              <item.icon className={cn("h-4 w-4 mb-1", item.className)} />
              <span className={cn("text-lg font-bold", item.className)}>
                {stats[item.key]}
              </span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

VaccineStats.displayName = 'VaccineStats';

export default VaccineStats;
