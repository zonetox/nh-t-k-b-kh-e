import React, { useState, useEffect } from 'react';
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
import { Check, Clock, AlertTriangle, Calendar, SkipForward, Filter, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AddOptionalVaccineDialog from './AddOptionalVaccineDialog';

interface FullScheduleTableProps {
  onSelectSchedule: (schedule: VaccineSchedule) => void;
  externalTab?: string;
}

const statusConfig = {
  done: { icon: Check, label: 'Đã tiêm', className: 'text-success bg-success/10' },
  upcoming: { icon: Clock, label: 'Sắp đến', className: 'text-warning bg-warning/10' },
  overdue: { icon: AlertTriangle, label: 'Quá hạn', className: 'text-overdue bg-overdue/10' },
  pending: { icon: Calendar, label: 'Chờ', className: 'text-muted-foreground bg-muted' },
  skipped: { icon: SkipForward, label: 'Bỏ qua', className: 'text-muted-foreground bg-muted/50' },
};

const FullScheduleTable: React.FC<FullScheduleTableProps> = ({ onSelectSchedule, externalTab }) => {
  const { schedules, isLoading, upcomingSchedules, overdueSchedules, doneSchedules, pendingSchedules } = useVaccine();
  const [activeTab, setActiveTab] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Sync external tab when stat card is clicked
  useEffect(() => {
    if (externalTab) setActiveTab(externalTab);
  }, [externalTab]);

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
          <div className="flex items-center gap-2">
            <span className="text-lg">Danh sách đầy đủ</span>
            <Badge variant="secondary">{schedules.length} mũi</Badge>
          </div>
          <Button size="sm" onClick={() => setAddDialogOpen(true)} className="hidden sm:flex" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Thêm mũi tiêm
          </Button>
          <Button size="icon" onClick={() => setAddDialogOpen(true)} className="sm:hidden" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
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
                      <TableHead className="w-[30%]">Vaccine</TableHead>
                      <TableHead className="w-[15%]">Loại</TableHead>
                      <TableHead className="w-[10%]">Liều</TableHead>
                      <TableHead className="w-[15%]">Ngày dự kiến (theo ngày sinh)</TableHead>
                      <TableHead className="w-[15%]">Ngày tiêm thực tế</TableHead>
                      <TableHead className="w-[15%] text-right">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.map((schedule) => (
                      <TableRow 
                        key={schedule.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50 transition-colors",
                          schedule.status === 'skipped' && "opacity-60"
                        )}
                        onClick={() => onSelectSchedule(schedule)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className={cn(schedule.status === 'skipped' && "line-through")}>
                              {schedule.vaccines?.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">
                              {schedule.vaccines?.short_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[10px] px-1.5 h-5 border-none",
                            schedule.vaccines?.type === 'optional' 
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" 
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          )}>
                            {schedule.vaccines?.type === 'optional' ? 'Dịch vụ' : 'Mở rộng'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{schedule.dose_number}</span>
                          {schedule.vaccines?.total_doses && schedule.vaccines.total_doses > 1 && (
                            <span className="text-muted-foreground text-xs">/{schedule.vaccines.total_doses}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {format(parseISO(schedule.scheduled_date), 'dd/MM/yyyy', { locale: vi })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {schedule.status === 'done' && schedule.vaccine_history?.[0] ? (
                            <span className="text-success font-bold">
                              {format(parseISO(schedule.vaccine_history[0].injected_date), 'dd/MM/yyyy', { locale: vi })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Chưa tiêm</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
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
      <AddOptionalVaccineDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </Card>
  );
};

export default FullScheduleTable;
