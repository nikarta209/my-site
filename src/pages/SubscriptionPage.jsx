import React, { useState } from 'react';
import { useAuth } from '../components/auth/Auth';
import { useExchangeRate } from '../components/utils/ExchangeRateContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CryptoPaymentModal from '../components/payment/CryptoPaymentModal';
import { CheckCircle, Crown, BookOpen, MessageSquare, Globe } from 'lucide-react';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import { isSubscriptionFeatureEnabled } from '@/utils/featureFlags';

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

  const subscriptionPriceUSD = 10;
  const subscriptionPriceKAS = kasRate ? (subscriptionPriceUSD / kasRate).toFixed(2) : '...';

  const handlePaymentSuccess = (orderId) => {
    // Логика после успешной оплаты будет в handleSubscriptionPayment
    console.log('Subscription payment success for order:', orderId);
    // Можно обновить состояние пользователя здесь или дождаться обновления из AuthProvider
  };

  if (!isSubscriptionFeatureEnabled()) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <Crown className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-6 text-3xl font-bold text-foreground md:text-4xl">
            {t('subscription.disabledTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {t('subscription.disabledDescription')}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <Crown className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">KASBOOK Premium</h1>
            <p className="text-xl text-muted-foreground mb-12">
              {t('subscription.heroDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('subscription.includesTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SubscriptionFeature
                  icon={Globe}
                  title={t('subscription.features.translationsTitle')}
                  description={t('subscription.features.translationsDescription')}
                />
                <SubscriptionFeature
                  icon={BookOpen}
                  title={t('subscription.features.catalogTitle')}
                  description={t('subscription.features.catalogDescription')}
                />
                <SubscriptionFeature
                  icon={MessageSquare}
                  title={t('subscription.features.notesTitle')}
                  description={t('subscription.features.notesDescription')}
                />
                <SubscriptionFeature
                  icon={CheckCircle}
                  title={t('subscription.features.aiTitle')}
                  description={t('subscription.features.aiDescription')}
                />
              </CardContent>
            </Card>

            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{t('subscription.checkoutTitle')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('subscription.checkoutSubtitle')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm">{t('subscription.priceLabel')}</p>
                  <p className="text-3xl font-bold">${subscriptionPriceUSD}</p>
                  <p className="text-sm text-muted-foreground">
                    ≈ {subscriptionPriceKAS} KAS
                  </p>
                </div>
                {user?.subscription_status === 'active' ? (
                   <div className="text-center text-green-600 font-semibold p-3 bg-green-100 rounded-lg">
                     {t('subscription.alreadyActive')}
                   </div>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setIsPaymentModalOpen(true)}
                    disabled={isRateLoading || !user}
                  >
                    {user ? t('subscription.subscribeCta') : t('subscription.loginCta')}
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