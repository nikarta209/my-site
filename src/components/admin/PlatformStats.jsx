
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BookOpen, DollarSign, Users, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { Book } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { User } from '@/api/entities';
import { UserBookData } from '@/api/entities';
import { ReferralTransaction } from '@/api/entities';
import { toast } from 'sonner';
import { updateBookPrices } from '@/api/functions';

export default function PlatformStats() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    publishedBooks: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalAuthors: 0,
    totalReadingTime: 0, // в часах
    // Новая аналитика
    bookSalesRevenue: 0,
    translationRevenue: 0,
    referralPayouts: 0,
    platformNetRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [books, purchases, users, readingData, referralTransactions] = await Promise.all([
        Book.list('-created_date', 1000),
        Purchase.list('-created_date', 1000),
        User.list('-created_date', 1000),
        UserBookData.list('-created_date', 1000),
        ReferralTransaction.list('-created_date', 1000)
      ]);

      // Статистика по книгам
      const totalBooks = books.length;
      const publishedBooks = books.filter(book => book.status === 'approved').length;

      // Статистика по продажам
      const totalSales = purchases.length;
      const totalRevenue = purchases.reduce((sum, purchase) => sum + (purchase.price_kas || 0), 0);

      // Статистика по пользователям
      const totalUsers = users.length;
      const totalAuthors = users.filter(user => user.role === 'author' || user.user_type === 'author').length;

      // Статистика по времени чтения
      const totalReadingTime = readingData.reduce((sum, data) => {
        return sum + (data.total_reading_time || 0);
      }, 0) / 3600; // конвертируем секунды в часы

      // Новые расчеты доходов
      const bookSalesRevenue = purchases.reduce((sum, purchase) => sum + (purchase.platform_fee_kas || 0), 0);
      const translationRevenue = 0; // TODO: Добавить когда будет система оплаты переводов
      const referralPayouts = referralTransactions.reduce((sum, ref) => sum + (ref.referrer_commission_kas || 0), 0);
      const platformNetRevenue = bookSalesRevenue + translationRevenue - referralPayouts;

      setStats({
        totalBooks,
        publishedBooks,
        totalSales,
        totalRevenue,
        totalUsers,
        totalAuthors,
        totalReadingTime,
        bookSalesRevenue,
        translationRevenue,
        referralPayouts,
        platformNetRevenue
      });

    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      toast.error('Не удалось загрузить статистику платформы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrices = async () => {
    setIsUpdatingPrices(true);
    try {
      const response = await updateBookPrices();
      const result = response.data;
      
      if (result.success) {
        toast.success(result.message);
        // Перезагружаем статистику после обновления
        await loadStats();
      } else {
        toast.error('Ошибка при обновлении цен: ' + result.error);
      }
    } catch (error) {
      console.error('Ошибка обновления цен:', error);
      toast.error('Не удалось обновить цены книг');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Всего книг',
      value: stats.totalBooks,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      delay: 0
    },
    {
      title: 'Опубликованных книг',
      value: stats.publishedBooks,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      delay: 0.1
    },
    {
      title: 'Всего продаж',
      value: stats.totalSales,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      delay: 0.2
    },
    {
      title: 'Общий доход',
      value: `${stats.totalRevenue.toFixed(1)} KAS`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      delay: 0.3
    },
    {
      title: 'Пользователей',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      delay: 0.4
    },
    {
      title: 'Авторов',
      value: stats.totalAuthors,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      delay: 0.5
    },
    {
      title: 'Время чтения',
      value: `${stats.totalReadingTime.toFixed(1)} ч`,
      icon: Clock,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      delay: 0.6
    },
    {
      title: 'Доход с книг',
      value: `${stats.bookSalesRevenue.toFixed(1)} KAS`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      delay: 0.7
    },
    {
      title: 'Реферальные выплаты',
      value: `${stats.referralPayouts.toFixed(1)} KAS`,
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      delay: 0.8
    },
    {
      title: 'Чистая прибыль',
      value: `${stats.platformNetRevenue.toFixed(1)} KAS`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      delay: 0.9
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array(statCards.length).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="bg-gray-200 h-16 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Кнопки управления */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Общая статистика платформы</h2>
          <p className="text-muted-foreground text-sm">Ключевые показатели KASBOOK</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadStats} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
          <Button 
            variant="outline" 
            onClick={handleUpdatePrices} 
            disabled={isUpdatingPrices}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {isUpdatingPrices ? 'Обновляю цены...' : 'Пересчитать цены USD'}
          </Button>
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: stat.delay }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <motion.p 
                        className="text-2xl font-bold text-foreground"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: stat.delay + 0.2 }}
                      >
                        {stat.value}
                      </motion.p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
