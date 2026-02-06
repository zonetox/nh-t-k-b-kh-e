import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { Syringe } from 'lucide-react';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      {/* Logo and Brand */}
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="p-2 bg-primary rounded-xl">
            <Syringe className="h-8 w-8 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">
            Nhật Ký Tiêm Chủng
          </span>
        </Link>
        <p className="mt-2 text-muted-foreground">
          Theo dõi lịch tiêm chủng cho bé yêu
        </p>
      </div>

      {/* Login Form */}
      <LoginForm />

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>© 2024 Nhật Ký Tiêm Chủng. Bảo mật thông tin của bạn.</p>
      </footer>
    </div>
  );
};

export default Login;
