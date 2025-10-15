import React from 'react';
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
  Star
} from 'lucide-react';
import { isSubscriptionFeatureEnabled } from '@/utils/featureFlags';

const SUB_NAV_ITEMS = [
  {
    label: 'Новинки',
    href: createPageUrl('Novelties'),
    icon: Sparkles,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    activeColor: 'text-blue-700 bg-blue-100 border-blue-300'
  },
  {
    label: 'Популярные',
    href: createPageUrl('Catalog') + '?sort=popular',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-50 border-green-200',
    activeColor: 'text-green-700 bg-green-100 border-green-300'
  },
  {
    label: 'Подборки',
    href: createPageUrl('Catalog') + '?collections=true',
    icon: Heart,
    color: 'text-pink-600 bg-pink-50 border-pink-200',
    activeColor: 'text-pink-700 bg-pink-100 border-pink-300'
  },
  {
    label: 'Эксклюзивы',
    href: createPageUrl('Catalog') + '?exclusive=true',
    icon: Crown,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    activeColor: 'text-yellow-700 bg-yellow-100 border-yellow-300'
  },
  {
    label: 'ИИ подборки',
    href: createPageUrl('AIRecommendations'),
    icon: Brain,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    activeColor: 'text-purple-700 bg-purple-100 border-purple-300'
  },
  {
    label: 'Подписка',
    href: createPageUrl('SubscriptionPage'),
    icon: Crown,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    activeColor: 'text-amber-700 bg-amber-100 border-amber-300',
    requiresSubscription: true
  }
];

export default function SubNavigation() {
  const location = useLocation();
  const subscriptionEnabled = isSubscriptionFeatureEnabled();
  
  const isActive = (href) => {
    const currentPath = location.pathname;
    const targetPath = href.split('?')[0];
    
    if (href === createPageUrl('Novelties')) {
      return currentPath.includes('Novelties');
    }
    
    if (href === createPageUrl('AIRecommendations')) {
      return currentPath.includes('AIRecommendations');
    }
    
    if (href.includes('Catalog')) {
      const isCatalogPath = currentPath.includes('Catalog');
      if (!href.includes('?')) {
        return isCatalogPath && location.search === '';
      }
      const targetQuery = href.split('?')[1];
      return isCatalogPath && location.search.includes(targetQuery);
    }
    
    return currentPath === targetPath;
  };

  return (
    <div className="sticky top-12 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
          {SUB_NAV_ITEMS.filter((item) => !item.requiresSubscription || subscriptionEnabled).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <motion.div
                key={item.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={item.href}
                  className={`
                    relative flex items-center gap-1 px-2 py-1 rounded-full 
                    border transition-all duration-200 whitespace-nowrap
                    text-xs font-medium shadow-sm hover:shadow-md
                    ${active ? item.activeColor : item.color}
                  `}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                  
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-full border-2 border-primary/20 bg-primary/5"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to={createPageUrl('Catalog')}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-full border 
                text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100
                text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200
                ${isActive(createPageUrl('Catalog')) ? 'bg-gray-100 border-gray-300 text-gray-700' : ''}
              `}
            >
              <BookOpen className="w-3 h-3" />
              <span>Все книги</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}