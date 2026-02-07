import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBaby } from '@/contexts/BabyContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Syringe, LogIn, Baby, Calendar, Bell, Settings } from 'lucide-react';
import BabySelector from '@/components/baby/BabySelector';
import AddBabyDialog from '@/components/baby/AddBabyDialog';
import EmptyBabyState from '@/components/baby/EmptyBabyState';

const Dashboard: React.FC = () => {
  const { isAuthenticated, profile, logout } = useAuth();
  const { babies, selectedBaby, isLoading } = useBaby();
  const [addBabyOpen, setAddBabyOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        {/* Hero Section for non-authenticated users */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-xl">
                <Syringe className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Nhật Ký Tiêm Chủng</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/auth/login">
                <Button variant="ghost">Đăng nhập</Button>
              </Link>
              <Link to="/auth/register">
                <Button>Đăng ký</Button>
              </Link>
            </div>
          </nav>
        </header>

        <main className="container mx-auto px-4 py-12">
          {/* Hero */}
          <section className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl font-bold mb-4">
              Theo dõi lịch tiêm chủng cho bé yêu
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Không bao giờ bỏ lỡ mũi tiêm quan trọng. Nhắc nhở tự động, 
              lưu trữ sổ tiêm chủng điện tử, an toàn và tiện lợi.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="lg" className="gap-2">
                  <LogIn className="h-5 w-5" />
                  Dùng thử miễn phí 30 ngày
                </Button>
              </Link>
            </div>
          </section>

          {/* Features */}
          <section className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-card border">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <Baby className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quản lý nhiều bé</h3>
              <p className="text-sm text-muted-foreground">
                Theo dõi lịch tiêm chủng cho tất cả các bé trong gia đình
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-card border">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Lịch tiêm thông minh</h3>
              <p className="text-sm text-muted-foreground">
                Tự động tạo lịch tiêm theo chương trình tiêm chủng quốc gia
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-card border">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Nhắc nhở tự động</h3>
              <p className="text-sm text-muted-foreground">
                Nhận thông báo trước 7 ngày, 3 ngày và ngày tiêm
              </p>
            </div>
          </section>
        </main>

        <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Nhật Ký Tiêm Chủng. Bảo mật thông tin của bạn.</p>
        </footer>
      </div>
    );
  }

  // Authenticated user dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="p-2 bg-primary rounded-xl">
                  <Syringe className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold hidden sm:inline">Nhật Ký Tiêm Chủng</span>
              </Link>
              
              {/* Baby Selector */}
              {babies.length > 0 && (
                <div className="border-l pl-4 ml-2">
                  <BabySelector onAddBaby={() => setAddBabyOpen(true)} />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Link to="/babies">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Quản lý bé</span>
                </Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="sm">
                  {profile?.display_name || profile?.phone}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : babies.length === 0 ? (
          <EmptyBabyState onAddBaby={() => setAddBabyOpen(true)} />
        ) : selectedBaby ? (
          <div className="space-y-6">
            {/* Welcome message */}
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold mb-2">
                Lịch tiêm chủng của bé {selectedBaby.name}
              </h1>
              <p className="text-muted-foreground">
                Theo dõi và quản lý lịch tiêm chủng cho bé
              </p>
            </div>
            
            {/* Placeholder for vaccine schedule - will be implemented in PROMPT 6 */}
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Dashboard lịch tiêm sẽ được hiển thị ở đây
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Sẽ triển khai trong PROMPT 6 - Vaccine Engine)
              </p>
            </div>
          </div>
        ) : null}
      </main>

      {/* Add Baby Dialog */}
      <AddBabyDialog open={addBabyOpen} onOpenChange={setAddBabyOpen} />
    </div>
  );
};

export default Dashboard;
