import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { Syringe } from 'lucide-react';

const Register: React.FC = () => {
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
          Dùng thử miễn phí 30 ngày
        </p>
      </div>

      {/* Register Form */}
      <RegisterForm />

      {/* Features */}
      <div className="mt-8 max-w-md text-center">
        <h3 className="text-sm font-medium text-foreground mb-2">
          Tính năng nổi bật
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>✓ Tự động nhắc lịch tiêm chủng</li>
          <li>✓ Theo dõi nhiều bé cùng lúc</li>
          <li>✓ Lưu trữ sổ tiêm chủng điện tử</li>
        </ul>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>© 2024 Nhật Ký Tiêm Chủng. Bảo mật thông tin của bạn.</p>
      </footer>
    </div>
  );
};

export default Register;
