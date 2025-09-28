import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, BookOpen, TrendingUp, UserCheck, ShoppingCart } from 'lucide-react';
import { getAdminDashboardStats } from '@/api/functions';
import { toast } from 'sonner';

const AnimatedRingChart = ({ value, maxValue, size = 120, strokeWidth = 8, color = "#6A4C93" }) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / maxValue) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted"
        />
        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color, isLoading, ringChart }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              {ringChart ? (
                <AnimatedRingChart value={value} maxValue={ringChart.maxValue} color={color} />
              ) : (
                <div className="text-2xl font-bold">{value}</div>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export default function SiteAnalytics() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getAdminDashboardStats();
      if (error) throw new Error(error);
      setStats(data);
    } catch (err) {
      console.error("Ошибка загрузки аналитики:", err);
      toast.error("Не удалось загрузить аналитику сайта.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!stats && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Не удалось загрузить данные аналитики</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Основные метрики */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Общее время чтения"
          value={isLoading ? "0" : `${stats?.totalReadingTimeMinutes || 0}`}
          subtitle="минут за все время"
          icon={Clock}
          color="text-blue-600"
          isLoading={isLoading}
          ringChart={{ maxValue: Math.max(1000, stats?.totalReadingTimeMinutes || 0) }}
        />
        <MetricCard
          title="Средний доход за продажу"
          value={isLoading ? "0" : `${stats?.avgRevenuePerSale || 0} KAS`}
          subtitle="Комиссия платформы"
          icon={TrendingUp}
          color="text-green-600"
          isLoading={isLoading}
        />
        <MetricCard
          title="Конверсия"
          value={isLoading ? "0" : `${stats?.conversionRate || 0}%`}
          subtitle="Покупки / Пользователи"
          icon={UserCheck}
          color="text-purple-600"
          isLoading={isLoading}
          ringChart={{ maxValue: 100 }}
        />
        <MetricCard
          title="Книг на автора"
          value={isLoading ? "0" : stats?.avgBooksPerAuthor || 0}
          subtitle="В среднем"
          icon={BookOpen}
          color="text-orange-600"
          isLoading={isLoading}
        />
      </div>

      {/* Активность по дням */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Продажи за 30 дней
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats?.dailyActivity && Object.keys(stats.dailyActivity).length > 0 ? (
                  Object.entries(stats.dailyActivity)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .slice(0, 15)
                    .map(([date, sales]) => (
                      <motion.div
                        key={date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center py-2 border-b border-border/50"
                      >
                        <span className="text-sm font-medium">
                          {new Date(date).toLocaleDateString('ru-RU')}
                        </span>
                        <Badge variant="secondary">{sales} продаж</Badge>
                      </motion.div>
                    ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Продаж за последние 30 дней нет
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Регистрации за 30 дней
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats?.dailyRegistrations && Object.keys(stats.dailyRegistrations).length > 0 ? (
                  Object.entries(stats.dailyRegistrations)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .slice(0, 15)
                    .map(([date, registrations]) => (
                      <motion.div
                        key={date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center py-2 border-b border-border/50"
                      >
                        <span className="text-sm font-medium">
                          {new Date(date).toLocaleDateString('ru-RU')}
                        </span>
                        <Badge variant="secondary">{registrations} регистраций</Badge>
                      </motion.div>
                    ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Регистраций за последние 30 дней нет
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}