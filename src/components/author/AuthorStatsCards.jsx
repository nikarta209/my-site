import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, TrendingUp, DollarSign, Star, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  trend, 
  trendType, 
  bgColor,
  iconColor,
  index 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
  >
    <Card className={`${bgColor} border-0 shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {subtitle}
              </p>
            )}
            {trend && (
              <p className={`text-xs mt-2 font-medium ${
                trendType === 'positive' 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconColor}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function AuthorStatsCards({ stats }) {
  const cardData = [
    {
      icon: BookOpen,
      title: 'Опубликовано книг',
      value: stats?.totalBooks || 0,
      subtitle: '',
      trend: '',
      trendType: '',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'bg-blue-500'
    },
    {
      icon: TrendingUp,
      title: 'Общие продажи',
      value: stats?.totalSales || 0,
      subtitle: 'за всё время',
      trend: '',
      trendType: '',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      iconColor: 'bg-green-500'
    },
    {
      icon: DollarSign,
      title: 'Доход (KAS)',
      value: stats?.totalRevenue?.toFixed(2) || '0.00',
      subtitle: '',
      trend: '',
      trendType: '',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'bg-emerald-500'
    },
    {
      icon: Star,
      title: 'Средний рейтинг',
      value: stats?.averageRating?.toFixed(1) || '0.0',
      subtitle: 'из 5 звёзд',
      trend: '',
      trendType: '',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      iconColor: 'bg-amber-500'
    },
    {
      icon: Eye,
      title: 'Просмотры',
      value: stats?.totalViews || 0,
      subtitle: 'всего',
      trend: '',
      trendType: '',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      iconColor: 'bg-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cardData.map((card, index) => (
        <StatCard
          key={card.title}
          {...card}
          index={index}
        />
      ))}
    </div>
  );
}