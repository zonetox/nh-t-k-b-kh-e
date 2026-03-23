import React, { useState } from 'react';
import { useBaby } from '@/contexts/BabyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Loader2, Baby } from 'lucide-react';

interface AddBabyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddBabyDialog: React.FC<AddBabyDialogProps> = ({ open, onOpenChange }) => {
  const { createBaby } = useBaby();
  
  const [name, setName] = useState('');
  const [dob, setDob] = useState<Date | undefined>();
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setDob(undefined);
    setGender('male');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên bé');
      return;
    }

    if (!dob) {
      setError('Vui lòng chọn ngày sinh');
      return;
    }

    setIsLoading(true);

    const result = await createBaby({
      name: name.trim(),
      dob: format(dob, 'yyyy-MM-dd'),
      gender,
    });

    if (result.success) {
      handleClose();
    } else {
      setError(result.error || 'Không thể thêm bé');
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            Thêm bé mới
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin cơ bản để tạo hồ sơ tiêm chủng cho bé
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Tên bé</Label>
            <Input
              id="name"
              placeholder="VD: Bé Bin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Ngày sinh</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="dob"
                type="date"
                className="pl-10 block w-full"
                value={dob ? format(dob, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setDob(val ? new Date(val) : undefined);
                }}
                max={format(new Date(), 'yyyy-MM-dd')}
                disabled={isLoading}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Nhấp vào biểu tượng để chọn Năm/Tháng nhanh hơn
            </p>
          </div>

          <div className="space-y-2">
            <Label>Giới tính</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={gender === 'male' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setGender('male')}
                disabled={isLoading}
              >
                <span className="text-lg">👦</span>
                Con trai
              </Button>
              <Button
                type="button"
                variant={gender === 'female' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setGender('female')}
                disabled={isLoading}
              >
                <span className="text-lg">👧</span>
                Con gái
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !dob}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Thêm bé'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBabyDialog;
