import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Syringe, Baby, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Don't show on admin routes or if not authenticated
  if (!isAuthenticated || location.pathname.startsWith('/admin')) {
    return null;
  }

  const tabs = [
    { path: '/', label: 'Lịch tiêm', icon: Syringe },
    { path: '/babies', label: 'Bé yêu', icon: Baby },
    { path: '/community', label: 'Cộng đồng', icon: MessageSquare },
    { path: '/account', label: 'Tài khoản', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive ? "bg-primary/10" : "bg-transparent"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-none",
                isActive ? "font-bold" : ""
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
