import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const RegisterForm: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    const result = await register(phone, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Đăng ký thất bại');
    }

    setIsLoading(false);
  };

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 11);
  };

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 6,
    maxLength: password.length <= 64,
  };

  const isPasswordValid = passwordChecks.length && passwordChecks.maxLength;
  const isFormValid = phone.length >= 10 && isPasswordValid && password === confirmPassword;

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Đăng ký tài khoản</CardTitle>
        <CardDescription>
          Tạo tài khoản để theo dõi lịch tiêm chủng cho bé
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                className="pl-10"
                disabled={isLoading}
                required
                autoComplete="tel"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Số điện thoại sẽ dùng để đăng nhập
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                disabled={isLoading}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {/* Password requirements */}
            {password && (
              <div className="space-y-1 text-xs">
                <div className={`flex items-center gap-1 ${passwordChecks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`h-3 w-3 ${passwordChecks.length ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Ít nhất 6 ký tự</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                required
                autoComplete="new-password"
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">
                Mật khẩu xác nhận không khớp
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              'Đăng ký'
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link 
              to="/auth/login" 
              className="text-primary font-medium hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RegisterForm;
