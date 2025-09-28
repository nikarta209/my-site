import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Mail, Lock, User, Wallet, AlertCircle, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from './Auth';

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [show2FAInput, setShow2FAInput] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  // Состояние для форм
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    enable2FA: false,
    phoneNumber: ''
  });

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'reader',
    walletAddress: '',
    phoneNumber: '',
    enable2FA: false,
    agreeToTerms: false
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (loginForm.email && loginForm.password) {
        // Email/password login
        const result = await login(loginForm, show2FAInput ? twoFactorCode : null);
        
        if (result.requires2FA && !show2FAInput) {
          setShow2FAInput(true);
          toast.info('Введите код подтверждения из SMS');
          setIsLoading(false);
          return;
        }
        
        if (result.success) {
          toast.success('Успешный вход!');
          onClose();
        }
      } else {
        // Google OAuth fallback
        const result = await login({});
        if (result.success) {
          toast.success('Успешный вход!');
          onClose();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Ошибка входа: ' + (error.message || 'Неизвестная ошибка'));
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Валидация
      if (!registerForm.agreeToTerms) {
        toast.error('Необходимо согласиться с условиями использования');
        setIsLoading(false);
        return;
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        toast.error('Пароли не совпадают');
        setIsLoading(false);
        return;
      }

      if (registerForm.password.length < 6) {
        toast.error('Пароль должен содержать минимум 6 символов');
        setIsLoading(false);
        return;
      }

      if (!registerForm.fullName.trim()) {
        toast.error('Укажите ваше полное имя');
        setIsLoading(false);
        return;
      }

      if (registerForm.enable2FA && !registerForm.phoneNumber) {
        toast.error('Для включения 2FA необходимо указать номер телефона');
        setIsLoading(false);
        return;
      }

      // Попытка регистрации через Google OAuth (fallback to platform auth)
      const result = await login({
        isRegistration: true,
        ...registerForm
      }, show2FAInput ? twoFactorCode : null);

      if (result.requires2FA && !show2FAInput) {
        setShow2FAInput(true);
        toast.info('Введите код подтверждения из SMS');
        setIsLoading(false);
        return;
      }

      if (result.success) {
        toast.success(`Добро пожаловать, ${registerForm.fullName}!`);
        onClose();
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Ошибка регистрации: ' + (error.message || 'Неизвестная ошибка'));
    }

    setIsLoading(false);
  };

  const handleGoogleAuth = async (isRegistration = false) => {
    setIsLoading(true);
    try {
      const data = isRegistration ? { isRegistration: true, ...registerForm } : {};
      const result = await login(data);
      
      if (result.success) {
        toast.success(isRegistration ? 'Регистрация завершена!' : 'Успешный вход!');
        onClose();
      }
    } catch (error) {
      toast.error((isRegistration ? 'Ошибка регистрации: ' : 'Ошибка входа: ') + error.message);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-600" />
            <DialogTitle>Добро пожаловать в KASBOOK</DialogTitle>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="login-2fa" 
                  checked={loginForm.enable2FA}
                  onCheckedChange={(checked) => setLoginForm({...loginForm, enable2FA: checked})}
                />
                <Label htmlFor="login-2fa" className="text-sm">
                  Включить двухфакторную аутентификацию
                </Label>
              </div>

              {loginForm.enable2FA && (
                <div className="space-y-2">
                  <Label htmlFor="login-phone">Номер телефона</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      className="pl-10"
                      value={loginForm.phoneNumber}
                      onChange={(e) => setLoginForm({...loginForm, phoneNumber: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {show2FAInput && (
                <div className="space-y-2">
                  <Label htmlFor="2fa-code">Код подтверждения</Label>
                  <Input
                    id="2fa-code"
                    type="text"
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Введите код, отправленный на {loginForm.phoneNumber}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full kasbook-gradient text-white"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Войти
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Или</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleGoogleAuth(false)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Продолжить с Google
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-fullName">Полное имя *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-fullName"
                    type="text"
                    placeholder="Иван Иванов"
                    className="pl-10"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-password">Пароль *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirmPassword">Подтвердите пароль *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-role">Я хочу быть...</Label>
                <Select 
                  value={registerForm.role} 
                  onValueChange={(value) => setRegisterForm({...registerForm, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reader">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Читателем</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="author">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Автором</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-wallet">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    KAS кошелек (необязательно)
                  </div>
                </Label>
                <Input
                  id="register-wallet"
                  type="text"
                  placeholder="kaspa:qq..."
                  value={registerForm.walletAddress}
                  onChange={(e) => setRegisterForm({...registerForm, walletAddress: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="register-2fa" 
                  checked={registerForm.enable2FA}
                  onCheckedChange={(checked) => setRegisterForm({...registerForm, enable2FA: checked})}
                />
                <Label htmlFor="register-2fa" className="text-sm">
                  Включить двухфакторную аутентификацию
                </Label>
              </div>

              {registerForm.enable2FA && (
                <div className="space-y-2">
                  <Label htmlFor="register-phone">Номер телефона *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      className="pl-10"
                      value={registerForm.phoneNumber}
                      onChange={(e) => setRegisterForm({...registerForm, phoneNumber: e.target.value})}
                      required={registerForm.enable2FA}
                    />
                  </div>
                </div>
              )}

              {show2FAInput && (
                <div className="space-y-2">
                  <Label htmlFor="register-2fa-code">Код подтверждения</Label>
                  <Input
                    id="register-2fa-code"
                    type="text"
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Введите код, отправленный на {registerForm.phoneNumber}
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={registerForm.agreeToTerms}
                  onCheckedChange={(checked) => setRegisterForm({...registerForm, agreeToTerms: checked})}
                />
                <Label htmlFor="terms" className="text-sm">
                  Я согласен с <a href="#" className="text-primary hover:underline">условиями использования</a> и <a href="#" className="text-primary hover:underline">политикой конфиденциальности</a>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full kasbook-gradient text-white"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Зарегистрироваться
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Или</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleGoogleAuth(true)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Зарегистрироваться через Google
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}