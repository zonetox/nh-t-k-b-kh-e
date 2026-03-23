import React from 'react';
import { useBaby } from '@/contexts/BabyContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Plus, Baby as BabyIcon, Check } from 'lucide-react';
import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';

interface BabySelectorProps {
  onAddBaby?: () => void;
}

const BabySelector: React.FC<BabySelectorProps> = ({ onAddBaby }) => {
  const { babies, selectedBaby, selectBaby, isLoading } = useBaby();

  const getAgeText = (dob: string) => {
    const birthDate = parseISO(dob);
    const years = differenceInYears(new Date(), birthDate);
    const months = differenceInMonths(new Date(), birthDate) % 12;

    if (years > 0) {
      return months > 0 ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
    }
    return `${differenceInMonths(new Date(), birthDate)} tháng`;
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getGenderColor = (gender: string | null) => {
    if (gender === 'male') return 'bg-blue-100 text-blue-600';
    if (gender === 'female') return 'bg-pink-100 text-pink-600';
    return 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Button variant="ghost" disabled className="gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <span className="text-muted-foreground">Đang tải...</span>
      </Button>
    );
  }

  if (babies.length === 0) {
    return (
      <Button variant="outline" onClick={onAddBaby} className="gap-2">
        <Plus className="h-4 w-4" />
        Thêm bé
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-auto py-2 px-3">
          <Avatar className={`h-8 w-8 ${getGenderColor(selectedBaby?.gender || null)}`}>
            <AvatarImage src={selectedBaby?.avatar_url || undefined} />
            <AvatarFallback className={getGenderColor(selectedBaby?.gender || null)}>
              {selectedBaby ? getInitials(selectedBaby.name) : <BabyIcon className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium leading-none">{selectedBaby?.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedBaby && getAgeText(selectedBaby.dob)}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {babies.map((baby) => (
          <DropdownMenuItem
            key={baby.id}
            onClick={() => selectBaby(baby.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className={`h-8 w-8 ${getGenderColor(baby.gender)}`}>
                <AvatarImage src={baby.avatar_url || undefined} />
                <AvatarFallback className={getGenderColor(baby.gender)}>
                  {getInitials(baby.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{baby.name}</p>
                <p className="text-xs text-muted-foreground">{getAgeText(baby.dob)}</p>
              </div>
              {selectedBaby?.id === baby.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddBaby} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Thêm bé mới
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BabySelector;
