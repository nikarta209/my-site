import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Globe, Brain, ImageIcon, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth, useSubscription } from '@/components/auth/Auth';
import { useExchangeRate } from '@/components/utils/ExchangeRateContext';
import { isSubscriptionFeatureEnabled } from '@/utils/featureFlags';
import { useTranslation } from '@/components/i18n/SimpleI18n';

const SUBSCRIPTION_PRICE_USD = 10;

export default function SubscriptionBanner() {
  const { t } = useTranslation();
  const featureEnabled = isSubscriptionFeatureEnabled();
  const { isAuthenticated } = useAuth();
  const subscription = useSubscription();
  const { kasRate, isLoading: isRateLoading } = useExchangeRate();

  const subscriptionPriceKAS = useMemo(() => {
    if (!kasRate || kasRate <= 0) {
      return null;
    }

    // NOTE: We keep a fixed USD anchor so that marketing copy stays consistent across locales.
    return (SUBSCRIPTION_PRICE_USD / kasRate).toFixed(2);
  }, [kasRate]);

  const priceKasLabel = useMemo(() => {
    if (!subscriptionPriceKAS) {
      return null;
    }

    return t('subscription.priceKas', { value: subscriptionPriceKAS });
  }, [subscriptionPriceKAS, t]);

  const features = useMemo(
    () => [
      {
        icon: Globe,
        title: t('subscription.features.translationsTitle'),
        description: t('subscription.features.translationsDescription'),
        color: 'text-blue-500',
      },
      {
        icon: Brain,
        title: t('subscription.features.aiTitle'),
        description: t('subscription.features.aiDescription'),
        color: 'text-purple-500',
      },
      {
        icon: ImageIcon,
        title: t('subscription.features.notesTitle'),
        description: t('subscription.features.notesDescription'),
        color: 'text-green-500',
      },
      {
        icon: BookOpen,
        title: t('subscription.features.catalogTitle'),
        description: t('subscription.features.catalogDescription'),
        color: 'text-orange-500',
      },
    ],
    [t],
  );

  if (!featureEnabled || subscription.isActive) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="my-8"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-32 translate-x-32 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-48 w-48 translate-y-24 -translate-x-24 rounded-full bg-white/5" />

        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-4 flex items-center justify-center gap-2 lg:justify-start">
                <Crown className="h-8 w-8 text-yellow-400" />
                <Badge className="bg-yellow-400 px-3 py-1 font-semibold text-purple-900">
                  {t('subscription.priceLabel')}
                </Badge>
              </div>

              <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                {t('subscription.checkoutTitle')}
              </h2>

              <p className="mb-6 max-w-2xl text-lg text-purple-100">
                {t('subscription.heroDescription')}
              </p>

              <div className="mb-6 flex items-center justify-center gap-4 lg:justify-start">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">${SUBSCRIPTION_PRICE_USD}</div>
                  <div className="text-sm text-purple-200">
                    {isRateLoading || !priceKasLabel ? t('common.loading') : priceKasLabel}
                  </div>
                </div>
                <div className="text-purple-200">
                  <div className="text-sm">{t('subscription.checkoutSubtitle')}</div>
                  <div className="text-xs">{t('subscription.heroDescription')}</div>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="px-8 py-3 text-lg font-semibold shadow-xl shadow-purple-900/20"
              >
                <Link to={createPageUrl('SubscriptionPage')}>
                  {isAuthenticated ? t('subscription.subscribeCta') : t('subscription.loginCta')}
                </Link>
              </Button>
            </div>

            <div className="flex w-full flex-1 flex-col">
              <h3 className="mb-6 text-center text-xl font-semibold text-purple-100">
                {t('subscription.includesTitle')}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm"
                  >
                    <div className="flex-shrink-0 rounded-full bg-white/20 p-2">
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="mb-1 text-sm font-semibold text-white">{feature.title}</h4>
                      <p className="text-xs leading-relaxed text-purple-200">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}