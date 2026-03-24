import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useVaccine } from '@/contexts/VaccineContext';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Loader2, PlusCircle, Syringe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Vaccine {
  id: string;
  name: string;
  type: string;
}

interface AddOptionalVaccineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddOptionalVaccineDialog: React.FC<AddOptionalVaccineDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { addManualSchedule } = useVaccine();
  const { toast } = useToast();
  
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [isLoadingVaccines, setIsLoadingVaccines] = useState(false);
  
  const [selectedVaccineId, setSelectedVaccineId] = useState('');
  const [doseNumber, setDoseNumber] = useState('1');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (open && vaccines.length === 0) {
      loadVaccines();
    }
  }, [open]);

  const loadVaccines = async () => {
    setIsLoadingVaccines(true);
    try {
      const { data, error } = await supabase
        .from('vaccines')
        .select('id, name, type')
        .order('type', { ascending: false })
        .order('name');
        
      if (error) throw error;
      setVaccines(data || []);
    } catch (error) {
      console.error('Failed to load vaccines:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách vắc-xin',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingVaccines(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaccineId || !scheduledDate || !doseNumber) return;

    setIsSubmitting(true);
    const result = await addManualSchedule({
      vaccine_id: selectedVaccineId,
      scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
      dose_number: parseInt(doseNumber, 10),
    });
    
    setIsSubmitting(false);

    if (result.success) {
      onOpenChange(false);
      // Reset form
      setSelectedVaccineId('');
      setDoseNumber('1');
      setScheduledDate(new Date());
    }
  };

  const standardVaccines = vaccines.filter(v => v.type === 'standard');
  const optionalVaccines = vaccines.filter(v => v.type === 'optional');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Thêm mũi tiêm ngoài lịch
          </DialogTitle>
          <DialogDescription>
            Tự động thêm vắc-xin dịch vụ hoặc mũi tiêm bổ sung vào lịch tiêm của bé.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vaccineId" className="flex items-center gap-1 font-medium">
              Loại vắc-xin <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={selectedVaccineId} 
              onValueChange={setSelectedVaccineId}
              disabled={isLoadingVaccines || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingVaccines ? "Đang tải..." : "Chọn vắc-xin..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-purple-600">Vắc-xin Dịch vụ</SelectLabel>
                  {optionalVaccines.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-blue-600 mt-2">Tiêm chủng mở rộng</SelectLabel>
                  {standardVaccines.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doseNumber" className="flex items-center gap-1 font-medium">
                Mũi số <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="doseNumber"
                  type="number"
                  min="1"
                  max="10"
                  value={doseNumber}
                  onChange={(e) => setDoseNumber(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-9"
                />
                <Syringe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate" className="flex items-center gap-1 font-medium">
                Ngày dự kiến tiêm <span className="text-destructive">*</span>
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? (
                      format(scheduledDate, 'dd/MM/yyyy', { locale: vi })
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(date) => {
                      setScheduledDate(date);
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedVaccineId || !scheduledDate || !doseNumber}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Thêm mũi tiêm
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOptionalVaccineDialog;
