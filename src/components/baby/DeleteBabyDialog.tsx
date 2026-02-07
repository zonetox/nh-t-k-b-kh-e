import React, { useState } from 'react';
import { useBaby, Baby } from '@/contexts/BabyContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteBabyDialogProps {
  baby: Baby | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteBabyDialog: React.FC<DeleteBabyDialogProps> = ({ baby, open, onOpenChange }) => {
  const { deleteBaby } = useBaby();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!baby) return;
    
    setIsLoading(true);
    
    const result = await deleteBaby(baby.id);
    
    if (result.success) {
      onOpenChange(false);
    }
    
    setIsLoading(false);
  };

  if (!baby) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Xóa hồ sơ bé {baby.name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Bạn có chắc chắn muốn xóa toàn bộ dữ liệu tiêm chủng của bé <strong>{baby.name}</strong>?
            </p>
            <p className="text-destructive font-medium">
              Hành động này sẽ xóa:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>Toàn bộ lịch tiêm chủng</li>
              <li>Lịch sử tiêm chủng đã ghi nhận</li>
              <li>Hình ảnh chứng nhận tiêm</li>
              <li>Thông tin đăng ký dịch vụ</li>
            </ul>
            <p className="font-medium text-destructive">
              Không thể hoàn tác sau khi xóa!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              'Xóa hồ sơ bé'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteBabyDialog;
