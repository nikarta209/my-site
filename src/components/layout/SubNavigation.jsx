import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Heart, Crown, Brain, BookOpen } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { isSubscriptionFeatureEnabled } from '@/utils/featureFlags';
import { useTranslation } from '@/components/i18n/SimpleI18n';

const baseNavItems = (t) => [
  {
    key: 'new',
    label: t('home.subNavigation.new', {}, t('home.sections.newWeek')),
    href: createPageUrl('Novelties'),
    icon: Sparkles,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    activeColor: 'text-blue-700 bg-blue-100 border-blue-300',
  },
  {
    key: 'popular',
    label: t('home.subNavigation.popular', {}, t('home.sections.bestSellers')),
    href: createPageUrl('Catalog?sort=popular'),
    icon: TrendingUp,
    color: 'text-green-600 bg-green-50 border-green-200',
    activeColor: 'text-green-700 bg-green-100 border-green-300',
  },
  {
    key: 'collections',
    label: t('home.subNavigation.collections', {}, t('footer.links.collections')),
    href: createPageUrl('Catalog?collections=true'),
    icon: Heart,
    color: 'text-pink-600 bg-pink-50 border-pink-200',
    activeColor: 'text-pink-700 bg-pink-100 border-pink-300',
  },
  {
    key: 'exclusive',
    label: t('home.subNavigation.exclusive', {}, t('home.cards.exclusive')),
    href: createPageUrl('Catalog?exclusive=true'),
    icon: Crown,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    activeColor: 'text-yellow-700 bg-yellow-100 border-yellow-300',
  },
  {
    key: 'ai',
    label: t('home.subNavigation.ai', {}, t('home.sections.aiChoice')),
    href: createPageUrl('AIRecommendations'),
    icon: Brain,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    activeColor: 'text-purple-700 bg-purple-100 border-purple-300',
  },
  {
    key: 'subscription',
    label: t('home.subNavigation.subscription', {}, t('subscription.checkoutTitle')),
    href: createPageUrl('SubscriptionPage'),
    icon: Crown,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    activeColor: 'text-amber-700 bg-amber-100 border-amber-300',
    requiresSubscription: true,
  },
  {
    key: 'all',
    label: t('home.subNavigation.all', {}, t('footer.links.allBooks')),
    href: createPageUrl('Catalog'),
    icon: BookOpen,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    activeColor: 'text-gray-700 bg-gray-100 border-gray-300',
  },
];

export default function SubNavigation() {
  const location = useLocation();
  const { t } = useTranslation();
  const subscriptionEnabled = isSubscriptionFeatureEnabled();

  const items = useMemo(
    () => baseNavItems(t).filter((item) => !item.requiresSubscription || subscriptionEnabled),
    [subscriptionEnabled, t]
  );

  const isActive = (href) => {
    const [targetPath, rawQuery = ''] = href.split('?');
    const normalizedPath = targetPath || '/';
    const normalizedQuery = rawQuery ? `?${rawQuery}` : '';

    if (location.pathname !== normalizedPath) {
      return false;
    }

    if (!normalizedQuery) {
      return location.search === '' || location.search === '?';
    }

    return location.search === normalizedQuery;
  };

  return (
    <div className="sticky top-12 z-40 border-b border-border/50 bg-background/95 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <motion.div key={item.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to={item.href}
                  className={`relative flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md ${
                    active ? item.activeColor : item.color
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="subNavActiveIndicator"
                      className="absolute inset-0 rounded-full border-2 border-primary/20 bg-primary/5"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}