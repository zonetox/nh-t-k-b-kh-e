import React, { useState } from 'react';
import { useVaccine, VaccineSchedule } from '@/contexts/VaccineContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, Clock, AlertTriangle, Calendar, SkipForward, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FullScheduleTableProps {
  onSelectSchedule: (schedule: VaccineSchedule) => void;
}

const statusConfig = {
  done: { icon: Check, label: 'Đã tiêm', className: 'text-success bg-success/10' },
  upcoming: { icon: Clock, label: 'Sắp đến', className: 'text-warning bg-warning/10' },
  overdue: { icon: AlertTriangle, label: 'Quá hạn', className: 'text-overdue bg-overdue/10' },
  pending: { icon: Calendar, label: 'Chờ', className: 'text-muted-foreground bg-muted' },
  skipped: { icon: SkipForward, label: 'Bỏ qua', className: 'text-muted-foreground bg-muted/50' },
};

const FullScheduleTable: React.FC<FullScheduleTableProps> = ({ onSelectSchedule }) => {
  const { schedules, isLoading, upcomingSchedules, overdueSchedules, doneSchedules, pendingSchedules } = useVaccine();
  const [activeTab, setActiveTab] = useState('all');

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

  const getFilteredSchedules = () => {
    switch (activeTab) {
      case 'urgent':
        return [...overdueSchedules, ...upcomingSchedules];
      case 'done':
        return doneSchedules;
      case 'pending':
        return pendingSchedules;
      default:
        return schedules;
    }
  };

  const filteredSchedules = getFilteredSchedules();

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={cn("gap-1", config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">Danh sách đầy đủ</span>
          <Badge variant="secondary">{schedules.length} mũi</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              Tất cả
            </TabsTrigger>
            <TabsTrigger value="urgent" className="text-xs sm:text-sm">
              Cần tiêm
              {(overdueSchedules.length + upcomingSchedules.length) > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {overdueSchedules.length + upcomingSchedules.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="done" className="text-xs sm:text-sm">
              Đã tiêm
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Chờ
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Không có mũi tiêm nào</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40%]">Vaccine</TableHead>
                      <TableHead className="w-[20%]">Liều</TableHead>
                      <TableHead className="w-[25%]">Ngày</TableHead>
                      <TableHead className="w-[15%]">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.map((schedule) => (
                      <TableRow 
                        key={schedule.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onSelectSchedule(schedule)}
                      >
                        <TableCell className="font-medium">
                          {schedule.vaccines?.short_name || schedule.vaccines?.name}
                        </TableCell>
                        <TableCell>
                          {schedule.dose_number}
                          {schedule.vaccines?.total_doses && schedule.vaccines.total_doses > 1 && (
                            <span className="text-muted-foreground text-xs"> / {schedule.vaccines.total_doses}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(parseISO(schedule.scheduled_date), 'dd/MM/yyyy', { locale: vi })}
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(schedule.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FullScheduleTable;
