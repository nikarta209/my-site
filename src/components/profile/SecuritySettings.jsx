
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../auth/Auth';
import { User } from '@/api/entities';
import { useTranslation } from '../i18n/SimpleI18n';

export default function SecuritySettings() {
  const { user, updateUser } = useAuth();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [twoFactorForm, setTwoFactorForm] = useState({
    phoneNumber: '',
    verificationCode: '',
    isEnabled: false
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isConfiguring2FA, setIsConfiguring2FA] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [translations, setTranslations] = useState({});
  const { t } = useTranslation();

  // EFFECT: Synchronize 2FA form state with user data
  useEffect(() => {
    if (user) {
      setTwoFactorForm({
        phoneNumber: user.phone_number || '',
        verificationCode: '',
        isEnabled: user.two_factor_enabled || false
      });
    }
  }, [user]);

  // EFFECT: Load translations on mount
  useEffect(() => {
    const loadTranslations = async () => {
      const translations = {
        passwordMismatch: await t('errors.passwordMismatch', 'Пароли не совпадают'),
        invalidPassword: await t('errors.invalidPassword', 'Пароль должен быть не менее 6 символов'),
        passwordChanged: await t('success.passwordChanged', 'Пароль успешно изменен'),
        generalError: await t('errors.general', 'Произошла ошибка'),
        changePassword: await t('profile.changePassword', 'Изменить пароль'),
        twoFactor: await t('profile.twoFactor', 'Двухфакторная аутентификация'),
        enable2FA: await t('profile.enable2FA', 'Включить 2FA'),
        disable2FA: await t('profile.disable2FA', 'Отключить 2FA')
      };
      setTranslations(translations);
    };

    loadTranslations();
  }, [t]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(translations.passwordMismatch || 'Пароли не совпадают');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(translations.invalidPassword || 'Пароль должен быть не менее 6 символов');
      return;
    }

    setIsChangingPassword(true);
    try {
      await User.updateMyUserData({
        password: passwordForm.newPassword
      });

      toast.success('Пароль успешно изменен');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Произошла ошибка при смене пароля');
    }
    setIsChangingPassword(false);
  };

  const sendOTP = useCallback(async () => {
    if (!twoFactorForm.phoneNumber) {
      toast.error('Введите номер телефона');
      return;
    }

    setIsConfiguring2FA(true);
    try {
      // Mock OTP sending - in production use real SMS service
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOtpSent(true);
      toast.success('Код подтверждения отправлен');
    } catch (error) {
      toast.error('Ошибка отправки кода');
    }
    setIsConfiguring2FA(false);
  }, [twoFactorForm.phoneNumber]); // Depend on phoneNumber, state setters are stable

  const handle2FAToggle = useCallback(async () => {
    if (!user) return; // Ensure user data is loaded

    if (!twoFactorForm.isEnabled && !otpSent) {
      await sendOTP();
      return;
    }

    if (!twoFactorForm.isEnabled && !twoFactorForm.verificationCode) {
      toast.error('Введите код подтверждения');
      return;
    }

    setIsConfiguring2FA(true);
    try {
      // Verify OTP code (mock verification)
      if (!twoFactorForm.isEnabled && twoFactorForm.verificationCode !== '123456') {
        toast.error('Неверный код подтверждения');
        setIsConfiguring2FA(false);
        return;
      }

      const new2FAState = !twoFactorForm.isEnabled;

      // Update user 2FA settings via useAuth hook
      await updateUser({
        two_factor_enabled: new2FAState,
        phone_number: twoFactorForm.phoneNumber
      });

      setTwoFactorForm(prev => ({
        ...prev,
        isEnabled: new2FAState,
        verificationCode: ''
      }));
      setOtpSent(false);

      toast.success(
        !new2FAState ?
        'Двухфакторная аутентификация отключена' :
        'Двухфакторная аутентификация включена'
      );
    } catch (error) {
      console.error('2FA toggle error:', error);
      toast.error('Ошибка настройки 2FA');
    }
    setIsConfiguring2FA(false);
  }, [user, twoFactorForm, otpSent, updateUser, sendOTP]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Загрузка данных пользователя...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {translations.changePassword || 'Изменить пароль'}
          </CardTitle>
          <CardDescription>
            Регулярно меняйте пароль для обеспечения безопасности аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isChangingPassword}
              className="kasbook-gradient"
            >
              {isChangingPassword ? 'Изменение...' : 'Изменить пароль'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            {translations.twoFactor || 'Двухфакторная аутентификация'}
            <Badge variant={twoFactorForm.isEnabled ? "default" : "secondary"}>
              {twoFactorForm.isEnabled ? 'Включена' : 'Отключена'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Дополнительный уровень защиты для вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorForm.isEnabled ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Двухфакторная аутентификация активна для номера {twoFactorForm.phoneNumber}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ваш аккаунт не защищен двухфакторной аутентификацией
              </AlertDescription>
            </Alert>
          )}

          {!twoFactorForm.isEnabled && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Номер телефона</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={twoFactorForm.phoneNumber}
                  onChange={(e) => setTwoFactorForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  required
                />
              </div>

              {otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Код подтверждения</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="123456"
                    value={twoFactorForm.verificationCode}
                    onChange={(e) => setTwoFactorForm(prev => ({ ...prev, verificationCode: e.target.value }))}
                    maxLength={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Введите код, отправленный на {twoFactorForm.phoneNumber}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handle2FAToggle}
              disabled={isConfiguring2FA}
              variant={twoFactorForm.isEnabled ? "destructive" : "default"}
              className={!twoFactorForm.isEnabled ? "kasbook-gradient" : ""}
            >
              {isConfiguring2FA ? 'Настройка...' :
               twoFactorForm.isEnabled ? (translations.disable2FA || 'Отключить 2FA') :
               otpSent ? 'Подтвердить код' : (translations.enable2FA || 'Включить 2FA')}
            </Button>

            {twoFactorForm.isEnabled && (
              <Button variant="outline" onClick={sendOTP}>
                Изменить номер
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Советы по безопасности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Используйте уникальный пароль для каждого сервиса</li>
            <li>• Включите двухфакторную аутентификацию</li>
            <li>• Регулярно проверяйте активность в аккаунте</li>
            <li>• Не делитесь своими учетными данными</li>
            <li>• Используйте надежное интернет-соединение</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
