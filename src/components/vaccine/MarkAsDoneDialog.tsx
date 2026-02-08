import React, { useState } from 'react';
import { VaccineSchedule, useVaccine } from '@/contexts/VaccineContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Syringe, MapPin, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkAsDoneDialogProps {
  schedule: VaccineSchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MarkAsDoneDialog: React.FC<MarkAsDoneDialogProps> = ({
  schedule,
  open,
  onOpenChange,
}) => {
  const { markAsDone, undoMarkAsDone } = useVaccine();
  
  const [injectedDate, setInjectedDate] = useState<Date | undefined>(new Date());
  const [batchNumber, setBatchNumber] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schedule || !injectedDate) return;

    setIsLoading(true);

    const result = await markAsDone(schedule.id, {
      injected_date: format(injectedDate, 'yyyy-MM-dd'),
      batch_number: batchNumber || undefined,
      location: location || undefined,
      notes: notes || undefined,
    });

    setIsLoading(false);

    if (result.success) {
      onOpenChange(false);
      // Reset form
      setInjectedDate(new Date());
      setBatchNumber('');
      setLocation('');
      setNotes('');
    }
  };

  const handleUndo = async () => {
    if (!schedule) return;

    setIsLoading(true);
    const result = await undoMarkAsDone(schedule.id);
    setIsLoading(false);

    if (result.success) {
      onOpenChange(false);
    }
  };

  if (!schedule) return null;

  const isAlreadyDone = schedule.status === 'done';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            {isAlreadyDone ? 'Chi tiết tiêm chủng' : 'Đánh dấu đã tiêm'}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{schedule.vaccines?.name}</span>
            <Badge variant="secondary" className="ml-2">
              Liều {schedule.dose_number}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {isAlreadyDone && schedule.vaccine_history ? (
          <div className="space-y-4 py-4">
            <div className="bg-success/10 border border-success/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-success" />
                <span className="font-medium">Đã tiêm ngày:</span>
                <span>{format(new Date(schedule.vaccine_history.injected_date), 'dd/MM/yyyy', { locale: vi })}</span>
              </div>
              
              {schedule.vaccine_history.location && (
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{schedule.vaccine_history.location}</span>
                </div>
              )}
              
              {schedule.vaccine_history.batch_number && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">
                    Số lô: {schedule.vaccine_history.batch_number}
                  </span>
                </div>
              )}
              
              {schedule.vaccine_history.notes && (
                <div className="mt-3 pt-3 border-t border-success/30">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{schedule.vaccine_history.notes}</p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
              <Button 
                variant="destructive"
                onClick={handleUndo}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Hoàn tác
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Date picker */}
            <div className="space-y-2">
              <Label htmlFor="injectedDate" className="flex items-center gap-1">
                Ngày tiêm thực tế <span className="text-overdue">*</span>
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !injectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {injectedDate ? (
                      format(injectedDate, 'dd/MM/yyyy', { locale: vi })
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={injectedDate}
                    onSelect={(date) => {
                      setInjectedDate(date);
                      setDatePickerOpen(false);
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Địa điểm tiêm
              </Label>
              <Input
                id="location"
                placeholder="VD: Bệnh viện Nhi Đồng 1"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Batch number */}
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Số lô vaccine</Label>
              <Input
                id="batchNumber"
                placeholder="VD: AB123456"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Ghi chú / Phản ứng sau tiêm
              </Label>
              <Textarea
                id="notes"
                placeholder="VD: Bé sốt nhẹ 37.5°C, đã hết sau 1 ngày"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading || !injectedDate}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Xác nhận đã tiêm
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MarkAsDoneDialog;
