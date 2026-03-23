import React, { useState, useEffect } from 'react';
import { useBaby, Baby } from '@/contexts/BabyContext';
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
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Pencil, Camera, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EditBabyDialogProps {
  baby: Baby | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditBabyDialog: React.FC<EditBabyDialogProps> = ({ baby, open, onOpenChange }) => {
  const { updateBaby } = useBaby();
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { uploadAvatar } = useBaby();

  useEffect(() => {
    if (baby) {
      setName(baby.name);
      setGender(baby.gender || 'male');
      setAvatarUrl(baby.avatar_url);
      setError('');
    }
  }, [baby]);

  const handleClose = () => {
    setError('');
    onOpenChange(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !baby) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB');
      return;
    }

    setIsUploading(true);
    setError('');

    const result = await uploadAvatar(baby.id, file);

    if (result.success && result.url) {
      setAvatarUrl(result.url);
    } else {
      setError(result.error || 'Lỗi khi tải ảnh lên');
    }

    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!baby) return;

    if (!name.trim()) {
      setError('Vui lòng nhập tên bé');
      return;
    }

    setIsLoading(true);

    const result = await updateBaby(baby.id, {
      name: name.trim(),
      gender,
    });

    if (result.success) {
      handleClose();
    } else {
      setError(result.error || 'Không thể cập nhật');
    }

    setIsLoading(false);
  };

  if (!baby) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Sửa thông tin bé
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cho bé. Ngày sinh không thể thay đổi vì ảnh hưởng đến lịch tiêm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center gap-3">
            <div 
              className="relative group cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-24 w-24 border-2 border-primary/20 group-hover:border-primary transition-colors">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <input 
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              disabled={isLoading || isUploading}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAvatarClick}
              disabled={isLoading || isUploading}
            >
              {avatarUrl ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Tên bé</Label>
            <Input
              id="edit-name"
              placeholder="VD: Bé Bin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Ngày sinh</Label>
            <Input
              value={format(parseISO(baby.dob), 'dd/MM/yyyy', { locale: vi })}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Ngày sinh không thể thay đổi vì ảnh hưởng đến lịch tiêm chủng
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
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBabyDialog;
