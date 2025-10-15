import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import {
  Sparkles,
  TrendingUp,
  Heart,
  Crown,
  Brain,
  BookOpen,
  Award,
} from 'lucide-react';
import { isSubscriptionFeatureEnabled } from '@/utils/featureFlags';
import { useTranslation } from '@/components/i18n/SimpleI18n';

const NAV_ITEMS = [
  {
    id: 'novelties',
    labelKey: 'home.sections.newWeek',
    href: 'Novelties',
    icon: Sparkles,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    activeColor: 'text-blue-700 bg-blue-100 border-blue-300',
  },
  {
    id: 'popular',
    labelKey: 'home.sections.bestSellers',
    href: 'Catalog?sort=popular',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-50 border-green-200',
    activeColor: 'text-green-700 bg-green-100 border-green-300',
  },
  {
    id: 'collections',
    labelKey: 'footer.links.collections',
    href: 'Catalog?collections=true',
    icon: Heart,
    color: 'text-pink-600 bg-pink-50 border-pink-200',
    activeColor: 'text-pink-700 bg-pink-100 border-pink-300',
  },
  {
    id: 'exclusive',
    labelKey: 'home.cards.exclusive',
    href: 'Catalog?exclusive=true',
    icon: Crown,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    activeColor: 'text-amber-700 bg-amber-100 border-amber-300',
  },
  {
    id: 'ai',
    labelKey: 'home.sections.aiChoice',
    href: 'AIRecommendations',
    icon: Brain,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    activeColor: 'text-purple-700 bg-purple-100 border-purple-300',
  },
  {
    id: 'subscription',
    labelKey: 'subscription.subscribeCta',
    href: 'SubscriptionPage',
    icon: Award,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
    activeColor: 'text-sky-700 bg-sky-100 border-sky-300',
    requiresSubscription: true,
  },
];

export default function SubNavigation() {
  const { pathname, search } = useLocation();
  const subscriptionEnabled = isSubscriptionFeatureEnabled();
  const { t } = useTranslation();

  const items = useMemo(
    () =>
      NAV_ITEMS.filter((item) => subscriptionEnabled || !item.requiresSubscription).map((item) => ({
        ...item,
        label: t(item.labelKey),
        href: createPageUrl(item.href),
      })),
    [subscriptionEnabled, t],
  );

  const catalogHref = createPageUrl('Catalog');

  const isActive = (targetHref) => {
    const [targetPath, rawQuery] = targetHref.split('?');
    if (rawQuery) {
      return pathname === targetPath && search === `?${rawQuery}`;
    }
    // NOTE: Equality check keeps behaviour predictable and avoids brittle string contains logic.
    return pathname === targetPath;
  };

  return (
    <div className="sticky top-12 z-40 border-b border-border/50 bg-background/95 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <motion.div key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to={item.href}
                  className={`
                    relative flex items-center gap-1 rounded-full border px-2 py-1
                    text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md
                    ${active ? item.activeColor : item.color}
                  `}
                >
                  <Icon className="h-3 w-3" />
                  <span>{item.label}</span>

                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-full border-2 border-primary/20 bg-primary/5"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to={catalogHref}
              className={`
                flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium shadow-sm transition-all duration-200
                bg-gray-50 text-gray-600 hover:bg-gray-100
                ${isActive(catalogHref) ? 'border-gray-300 bg-gray-100 text-gray-700' : 'border-gray-200'}
              `}
            >
              <BookOpen className="h-3 w-3" />
              <span>{t('footer.links.allBooks')}</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}