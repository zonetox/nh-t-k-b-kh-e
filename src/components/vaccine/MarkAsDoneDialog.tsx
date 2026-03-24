import React, { useState, useRef } from 'react';
import { VaccineSchedule, useVaccine } from '@/contexts/VaccineContext';
import { supabase } from '@/integrations/supabase/client';
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
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      // RLS policy: path[0] must equal auth.uid()
      const fileName = `${user.id}/${scheduleId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('vaccination-certificates')
        .upload(fileName, file, { upsert: false });

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
            {isAlreadyDone ? 'Chi tiết tiêm chủng' : 'Đánh dấu đã tiêm'}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{schedule.vaccines?.name}</span>
            <Badge variant="secondary" className="ml-2">
              Liều {schedule.dose_number}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {isAlreadyDone && history ? (
          <div className="space-y-4 py-4">
            <div className="bg-success/5 border border-success/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Đã tiêm ngày:</span>
                <span className="text-sm">{format(new Date(history.injected_date), 'dd/MM/yyyy', { locale: vi })}</span>
              </div>
              
              {history.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{history.location}</span>
                </div>
              )}
              
              {history.batch_number && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    Lô: {history.batch_number}
                  </Badge>
                </div>
              )}
              
              {history.notes && (
                <div className="pt-2 border-t border-success/10">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-balance">{history.notes}</p>
                  </div>
                </div>
              )}

              {/* Display existing images if history contains them - assuming they are joined in VaccineContext */}
              {/* @ts-ignore - history might have images depend on context implementation */}
              {history.vaccine_history_images && history.vaccine_history_images.length > 0 && (
                <div className="pt-3 border-t border-success/10">
                  <Label className="text-xs text-muted-foreground mb-2 block tracking-tight">Ảnh minh chứng</Label>
                  <div className="flex gap-2 flex-wrap">
                    {/* @ts-ignore */}
                    {history.vaccine_history_images.map((img: any, idx: number) => {
                      const isPath = !img.image_url.startsWith('http');
                      const displayUrl = isPath 
                        ? supabase.storage.from('vaccination-certificates').getPublicUrl(img.image_url).data.publicUrl
                        : img.image_url;
                        
                      return (
                        <a key={idx} href={displayUrl} target="_blank" rel="noreferrer" className="relative group">
                          <img 
                            src={displayUrl} 
                            alt="Minh chứng" 
                            className="h-16 w-16 object-cover rounded-md border border-border hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 rounded-md transition-opacity">
                             <Upload className="h-4 w-4 text-white" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Đóng
              </Button>
              <Button 
                variant="destructive"
                onClick={handleUndo}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Hoàn tác
              </Button>
            </DialogFooter>
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MarkAsDoneDialog;
