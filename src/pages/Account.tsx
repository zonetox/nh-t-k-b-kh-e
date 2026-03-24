import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { 
  Syringe, 
  User, 
  Phone, 
  Lock, 
  LogOut, 
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import NotificationSettings from '@/components/notification/NotificationSettings';

const Account: React.FC = () => {
  const { profile, updateProfile, changePassword, changePhone, logout, logoutAll } = useAuth();
  
  // Profile state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Change phone state
  const [phonePassword, setPhonePassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);

  // Handle profile update
  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    const result = await updateProfile({ display_name: displayName });

    if (result.success) {
      setProfileMessage({ type: 'success', text: 'Cập nhật thành công!' });
    } else {
      setProfileMessage({ type: 'error', text: result.error || 'Cập nhật thất bại' });
    }

    setIsUpdatingProfile(false);
  };

  // Handle password change
  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
      return;
    }

    setIsChangingPassword(true);

    const result = await changePassword(oldPassword, newPassword);

    if (result.success) {
      setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordDialogOpen(false), 1500);
    } else {
      setPasswordMessage({ type: 'error', text: result.error || 'Đổi mật khẩu thất bại' });
    }

    setIsChangingPassword(false);
  };

  // Handle phone change
  const handleChangePhone = async () => {
    setPhoneMessage(null);
    setIsChangingPhone(true);

    const result = await changePhone(phonePassword, newPhone);

    if (result.success) {
      setPhoneMessage({ type: 'success', text: 'Đổi số điện thoại thành công!' });
      setPhonePassword('');
      setNewPhone('');
      setTimeout(() => setPhoneDialogOpen(false), 1500);
    } else {
      setPhoneMessage({ type: 'error', text: result.error || 'Đổi số điện thoại thất bại' });
    }

    setIsChangingPhone(false);
  };

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 11);
  };

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
              <span className="text-lg font-bold">Tài khoản</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-2xl space-y-6">
        
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin cá nhân
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin hiển thị của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileMessage && (
              <Alert variant={profileMessage.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription className="flex items-center gap-2">
                  {profileMessage.type === 'success' && <CheckCircle className="h-4 w-4 text-primary" />}
                  {profileMessage.text}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={profile?.phone || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Số điện thoại dùng để đăng nhập
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Tên hiển thị</Label>
              <Input
                id="displayName"
                placeholder="Nhập tên của bạn"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isUpdatingProfile}
              />
            </div>

            <Button 
              onClick={handleUpdateProfile} 
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Bảo mật
            </CardTitle>
            <CardDescription>
              Quản lý mật khẩu và số điện thoại
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Change Password Dialog */}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Lock className="h-4 w-4" />
                  Đổi mật khẩu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Đổi mật khẩu</DialogTitle>
                  <DialogDescription>
                    Nhập mật khẩu hiện tại và mật khẩu mới
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {passwordMessage && (
                    <Alert variant={passwordMessage.type === 'error' ? 'destructive' : 'default'}>
                      <AlertDescription className="flex items-center gap-2">
                        {passwordMessage.type === 'success' && <CheckCircle className="h-4 w-4 text-primary" />}
                        {passwordMessage.text}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        type={showPasswords ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirmNewPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !oldPassword || !newPassword || !confirmNewPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Đổi mật khẩu'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Change Phone Dialog */}
            <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Phone className="h-4 w-4" />
                  Đổi số điện thoại
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Đổi số điện thoại</DialogTitle>
                  <DialogDescription>
                    Nhập mật khẩu và số điện thoại mới
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {phoneMessage && (
                    <Alert variant={phoneMessage.type === 'error' ? 'destructive' : 'default'}>
                      <AlertDescription className="flex items-center gap-2">
                        {phoneMessage.type === 'success' && <CheckCircle className="h-4 w-4 text-primary" />}
                        {phoneMessage.text}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Số điện thoại hiện tại</Label>
                    <Input
                      value={profile?.phone || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phonePassword">Mật khẩu</Label>
                    <Input
                      id="phonePassword"
                      type="password"
                      value={phonePassword}
                      onChange={(e) => setPhonePassword(e.target.value)}
                      disabled={isChangingPhone}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPhone">Số điện thoại mới</Label>
                    <Input
                      id="newPhone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="0901234567"
                      value={newPhone}
                      onChange={(e) => setNewPhone(formatPhoneInput(e.target.value))}
                      disabled={isChangingPhone}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleChangePhone}
                    disabled={isChangingPhone || !phonePassword || !newPhone}
                  >
                    {isChangingPhone ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Đổi số điện thoại'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Separator />

            {/* Logout options */}
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={logoutAll}
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất tất cả thiết bị
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start gap-2"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default Account;
