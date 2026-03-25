import React, { useState, useRef } from 'react';
import { VaccineSchedule, useVaccine } from '@/contexts/VaccineContext';
import { supabase } from '@/integrations/supabase/client';
import heic2any from 'heic2any';
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
import { 
  CalendarIcon, 
  Syringe, 
  MapPin, 
  FileText, 
  Loader2, 
  ImagePlus, 
  X, 
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  const [injectedDate, setInjectedDate] = useState<Date | undefined>(new Date());
  const [batchNumber, setBatchNumber] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Image states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 3 images
    const newFiles = [...selectedFiles, ...files].slice(0, 3);
    setSelectedFiles(newFiles);

    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async (scheduleId: string): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];
    
    // Get current user ID for RLS-compliant path (must start with userId/)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Không thể xác thực người dùng');

    const imageUrls: string[] = [];
    
    for (const file of selectedFiles) {
      // Convert HEIC if needed
      let fileToUpload = file;
      const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                    file.name.toLowerCase().endsWith('.heif') || 
                    file.type === 'image/heic';
      
      if (isHeic) {
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          });
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
          fileToUpload = new File([blob], newFileName, { type: 'image/jpeg' });
        } catch (err) {
          console.error('Lỗi chuyển đổi HEIC, giữ nguyên file gốc:', err);
        }
      }

      const fileExt = fileToUpload.name.split('.').pop()?.toLowerCase() || 'jpg';
      // RLS policy: path[0] must equal auth.uid()
      const fileName = `${user.id}/${scheduleId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('vaccination-certificates')
        .upload(fileName, fileToUpload, { upsert: false });

      if (error) {
        console.error('Lỗi upload ảnh:', error);
        throw new Error(`Không thể tải ảnh lên hệ thống: ${error.message}`);
      }

      if (data?.path) {
        imageUrls.push(data.path);
      }
    }
    
    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schedule || !injectedDate) return;

    setIsLoading(true);

    try {
      // 1. Upload images first
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        uploadedUrls = await uploadImages(schedule.id);
      }

      // 2. Mark as done with image URLs
      const result = await markAsDone(schedule.id, {
        injected_date: format(injectedDate, 'yyyy-MM-dd'),
        batch_number: batchNumber || undefined,
        location: location || undefined,
        notes: notes || undefined,
        image_urls: uploadedUrls,
      });

      if (result.success) {
        onOpenChange(false);
        // Reset form
        setInjectedDate(new Date());
        setBatchNumber('');
        setLocation('');
        setNotes('');
        setSelectedFiles([]);
        setImagePreviews([]);
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Có lỗi xảy ra',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi upload',
        description: error.message || 'Không thể tải ảnh minh chứng',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
  const history = schedule.vaccine_history?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            Đánh dấu đã tiêm
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{schedule.vaccines?.name}</span>
            <Badge variant="secondary" className="ml-2">
              Liều {schedule.dose_number}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Date picker */}
          <div className="space-y-2">
            <Label htmlFor="injectedDate" className="flex items-center gap-1 text-sm font-medium">
              Ngày tiêm <span className="text-destructive">*</span>
            </Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 px-3",
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

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">Địa điểm</Label>
              <Input
                id="location"
                placeholder="Trung tâm y tế..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNumber" className="text-sm font-medium">Số lô</Label>
              <Input
                id="batchNumber"
                placeholder="VD: AB123..."
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Ảnh sổ tiêm / Chứng nhận (Tối đa 3)</Label>
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-20 h-20 group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm opacity-90 hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              
              {selectedFiles.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 rounded-md flex flex-col items-center justify-center transition-colors group"
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-1" />
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary px-1 text-center">Thêm ảnh</span>
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Ghi chú / Phản ứng</Label>
            <Textarea
              id="notes"
              placeholder="VD: Bé hơi quấy sau tiêm..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !injectedDate}
              className="w-full sm:w-auto min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAsDoneDialog;
