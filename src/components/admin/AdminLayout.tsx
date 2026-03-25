import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Syringe,
  Users,
  CreditCard,
  FileText,
  ArrowLeft,
  Shield,
  LogOut,
  BarChart3,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, description }) => {
  const { logout, profile } = useAuth();
  const { isSuperAdmin, isMedicalAdmin, isFinanceAdmin, isSupportAdmin } = useAdmin();
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Tổng quan', icon: LayoutDashboard, show: true },
    { path: '/admin/analytics', label: 'Phân tích hệ thống', icon: BarChart3, show: true },
    { path: '/admin/vaccines', label: 'Cấu hình vắc-xin', icon: Syringe, show: isMedicalAdmin },
    { path: '/admin/users', label: 'Quản lý người dùng', icon: Users, show: isSupportAdmin },
    { path: '/admin/payments', label: 'Quản lý thanh toán', icon: CreditCard, show: isFinanceAdmin },
    { path: '/admin/audit-logs', label: 'Nhật ký hệ thống', icon: FileText, show: isSuperAdmin },
    { path: '/admin/settings', label: 'Cấu hình hệ thống', icon: Settings2, show: isSuperAdmin },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-xl">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">{profile?.display_name || profile?.phone}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.filter(item => item.show).map(item => (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-2 h-10',
                  location.pathname === item.path && 'bg-primary/10 text-primary font-semibold'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t space-y-1">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-2 h-10">
              <ArrowLeft className="h-4 w-4" />
              Về trang chính
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-2 h-10 text-destructive" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="border-b bg-card p-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
