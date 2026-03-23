import React, { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotification } from '@/contexts/NotificationContext';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Thông báo</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2 gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3" />
              Đọc tất cả
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Chưa có thông báo nào
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                    !n.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <div className={!n.read ? '' : 'pl-4'}>
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(parseISO(n.created_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
