import React, { useState } from 'react';
import { useAuth } from '../components/auth/Auth';
import { useExchangeRate } from '../components/utils/ExchangeRateContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CryptoPaymentModal from '../components/payment/CryptoPaymentModal';
import { CheckCircle, Crown, BookOpen, MessageSquare, Globe } from 'lucide-react';
import { isSubscriptionEnabled } from '@/lib/config/flags';
import { useTranslation } from '@/components/i18n/SimpleI18n';

const SubscriptionFeature = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { kasRate, isLoading: isRateLoading } = useExchangeRate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { t } = useTranslation();

  if (!isSubscriptionEnabled()) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Card className="mx-auto max-w-2xl text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                {user?.subscription_status === 'active'
                  ? t('subscription.suspendedWithAccess', 'Подписка активна, доступ сохранён')
                  : t('subscription.suspendedTitle', 'Подписка временно недоступна')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                {user?.subscription_status === 'active'
                  ? t(
                      'subscription.suspendedActiveDescription',
                      'Мы сохраняем ваш премиум-доступ, но оформление новых подписок сейчас приостановлено.'
                    )
                  : t(
                      'subscription.suspendedDescription',
                      'Продажи подписки временно приостановлены. Следите за обновлениями — мы вернёмся совсем скоро.'
                    )}
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                {t('subscription.back', 'Вернуться назад')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const subscriptionPriceUSD = 10;
  const subscriptionPriceKAS = kasRate ? (subscriptionPriceUSD / kasRate).toFixed(2) : '...';

  const handlePaymentSuccess = (orderId) => {
    // Логика после успешной оплаты будет в handleSubscriptionPayment
    console.log('Subscription payment success for order:', orderId);
    // Можно обновить состояние пользователя здесь или дождаться обновления из AuthProvider
  };
  
  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <Crown className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">KASBOOK Premium</h1>
            <p className="text-xl text-muted-foreground mb-12">
              Откройте полный потенциал чтения с эксклюзивными возможностями.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Что входит в подписку?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SubscriptionFeature
                  icon={Globe}
                  title="5 переводов книг в месяц"
                  description="Переводите любую книгу на нужный язык, если перевод отсутствует."
                />
                <SubscriptionFeature
                  icon={BookOpen}
                  title="Расширенный каталог книг"
                  description="Получите доступ к эксклюзивной библиотеке книг, доступных только по подписке."
                />
                <SubscriptionFeature
                  icon={MessageSquare}
                  title="Кастомные фоны для заметок"
                  description="Используйте собственные изображения в качестве фона для ваших публичных заметок."
                />
                <SubscriptionFeature
                  icon={CheckCircle}
                  title="Профессиональный анализ от ИИ"
                  description="Глубокий анализ ваших предпочтений, персональные рекомендации и многое другое."
                />
              </CardContent>
            </Card>

            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Оформить подписку</CardTitle>
                <p className="text-sm text-muted-foreground">30 дней доступа ко всем функциям.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm">Цена</p>
                  <p className="text-3xl font-bold">${subscriptionPriceUSD}</p>
                  <p className="text-sm text-muted-foreground">≈ {subscriptionPriceKAS} KAS</p>
                </div>
                {user?.subscription_status === 'active' ? (
                   <div className="text-center text-green-600 font-semibold p-3 bg-green-100 rounded-lg">
                     Подписка уже активна
                   </div>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={() => setIsPaymentModalOpen(true)}
                    disabled={isRateLoading || !user}
                  >
                    {user ? 'Подписаться' : 'Войдите, чтобы подписаться'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {user && (
        <CryptoPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          totalAmount={subscriptionPriceUSD}
          productType="subscription" // Новый пропс для определения типа продукта
        />
      )}
    </>
  );
}