import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Purchase } from '@/api/entities';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../auth/Auth';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg p-3 shadow-lg"
      >
        <p className="font-medium">{`Месяц: ${label}`}</p>
        <p className="text-primary">
          {`Доходы: ${payload[0].value.toFixed(2)} KAS`}
        </p>
        <p className="text-xs text-muted-foreground">
          Нажмите для деталей
        </p>
      </motion.div>
    );
  }
  return null;
};

export default function EarningsChart({ books }) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    const loadEarningsData = async () => {
      if (!user?.email) return;
      
      setIsLoading(true);
      try {
        // Загружаем реальные продажи автора за последние 6 месяцев
        const sixMonthsAgo = subDays(new Date(), 180);
        const purchases = await Purchase.filter({ seller_email: user.email });
        
        // Фильтруем по последним 6 месяцам
        const recentPurchases = purchases.filter(purchase => 
          new Date(purchase.created_date) >= sixMonthsAgo
        );

        // Группируем по месяцам
        const monthlyData = new Map();
        
        // Инициализируем последние 6 месяцев
        for (let i = 5; i >= 0; i--) {
          const date = subDays(new Date(), i * 30);
          const monthKey = format(date, 'yyyy-MM');
          const monthLabel = format(date, 'MMM yyyy', { locale: ru });
          monthlyData.set(monthKey, {
            month: monthLabel,
            earnings: 0,
            count: 0
          });
        }

        // Заполняем реальными данными
        recentPurchases.forEach(purchase => {
          const monthKey = format(new Date(purchase.created_date), 'yyyy-MM');
          if (monthlyData.has(monthKey)) {
            const data = monthlyData.get(monthKey);
            data.earnings += purchase.author_payout_kas || 0;
            data.count += 1;
          }
        });

        setChartData(Array.from(monthlyData.values()));
        
      } catch (error) {
        console.error('Ошибка загрузки данных о доходах:', error);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEarningsData();
  }, [user?.email]);

  const handleMouseEnter = (data, index) => {
    setHoveredBar(index);
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-foreground">Доходы за последние 6 месяцев</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full"
            />
          </div>
        ) : chartData.length === 0 || chartData.every(item => item.earnings === 0) ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <BarChart className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm">Пока нет данных о продажах</p>
            <p className="text-xs">Ваши доходы появятся здесь после первых продаж.</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} onMouseMove={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6A4C93" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1A1A2E" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(106, 76, 147, 0.1)' }}
                />
                <Bar 
                  dataKey="earnings" 
                  fill="url(#earningsGradient)"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={handleMouseEnter}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}