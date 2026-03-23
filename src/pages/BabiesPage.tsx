import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Syringe, ArrowLeft } from 'lucide-react';
import BabySelector from '@/components/baby/BabySelector';
import BabyList from '@/components/baby/BabyList';

const BabiesPage: React.FC = () => {
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
              <span>Quay lại</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-xl">
                <Syringe className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Quản lý bé</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <BabyList />
      </main>
    </div>
  );
};

export default BabiesPage;
