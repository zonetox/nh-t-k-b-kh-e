import React, { useState } from 'react';
import { useBaby, Baby } from '@/contexts/BabyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Pencil, Trash2, Baby as BabyIcon, Loader2 } from 'lucide-react';
import { differenceInMonths, differenceInYears, parseISO, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import AddBabyDialog from './AddBabyDialog';
import EditBabyDialog from './EditBabyDialog';
import DeleteBabyDialog from './DeleteBabyDialog';

const BabyList: React.FC = () => {
  const { babies, selectedBaby, selectBaby, isLoading } = useBaby();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Baby | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Baby | null>(null);

  const getAgeText = (dob: string) => {
    const birthDate = parseISO(dob);
    const years = differenceInYears(new Date(), birthDate);
    const months = differenceInMonths(new Date(), birthDate) % 12;

    if (years > 0) {
      return months > 0 ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
    }
    return `${differenceInMonths(new Date(), birthDate)} tháng tuổi`;
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getGenderColor = (gender: string | null) => {
    if (gender === 'male') return 'bg-blue-100 text-blue-600';
    if (gender === 'female') return 'bg-pink-100 text-pink-600';
    return 'bg-muted text-muted-foreground';
  };

  const handleEdit = (baby: Baby) => {
    setSelectedForEdit(baby);
    setEditDialogOpen(true);
  };

  const handleDelete = (baby: Baby) => {
    setSelectedForDelete(baby);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BabyIcon className="h-5 w-5" />
                Hồ sơ các bé
              </CardTitle>
              <CardDescription>
                Quản lý thông tin và theo dõi tiêm chủng cho các bé
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm bé
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {babies.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                <BabyIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Chưa có hồ sơ bé nào</h3>
              <p className="text-muted-foreground mb-4">
                Thêm bé để bắt đầu theo dõi lịch tiêm chủng
              </p>
              <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm bé ngay
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {babies.map((baby) => (
                <div
                  key={baby.id}
                  className={`
                    relative p-4 rounded-lg border cursor-pointer transition-all
                    ${selectedBaby?.id === baby.id 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : 'hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                  onClick={() => selectBaby(baby.id)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className={`h-14 w-14 ${getGenderColor(baby.gender)}`}>
                      <AvatarImage src={baby.avatar_url || undefined} />
                      <AvatarFallback className={`text-lg ${getGenderColor(baby.gender)}`}>
                        {getInitials(baby.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{baby.name}</h3>
                        {selectedBaby?.id === baby.id && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Đang chọn
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getAgeText(baby.dob)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sinh ngày: {format(parseISO(baby.dob), 'dd/MM/yyyy', { locale: vi })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end" onClick={(e) => e.stopPropagation()}>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 px-2 text-xs flex items-center gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                         onClick={() => handleEdit(baby)}
                       >
                         <Pencil className="h-3.5 w-3.5" />
                         <span>Chỉnh sửa</span>
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 px-2 text-xs flex items-center gap-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                         onClick={() => handleDelete(baby)}
                       >
                         <Trash2 className="h-3.5 w-3.5" />
                         <span>Xóa</span>
                       </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddBabyDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EditBabyDialog baby={selectedForEdit} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
      <DeleteBabyDialog baby={selectedForDelete} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </>
  );
};

export default BabyList;
