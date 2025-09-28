import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Languages, TrendingUp, Globe, BookOpen } from 'lucide-react';
import { getAdminDashboardStats } from '@/api/functions';
import { getTranslatedStats } from '@/api/functions';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function TranslationAnalytics() {
  const [stats, setStats] = useState(null);
  const [translationStats, setTranslationStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [dashboardResponse, translationResponse] = await Promise.all([
        getAdminDashboardStats(),
        getTranslatedStats({
          start: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), // 30 дней назад
          end: Math.floor(Date.now() / 1000) // сейчас
        })
      ]);

      if (dashboardResponse.error) throw new Error(dashboardResponse.error);
      if (translationResponse.error) throw new Error(translationResponse.error);

      setStats(dashboardResponse.data || dashboardResponse);
      setTranslationStats(translationResponse.data || translationResponse);
    } catch (err) {
      console.error("Ошибка загрузки аналитики переводов:", err);
      toast.error("Не удалось загрузить аналитику переводов.");
    } finally {
      setIsLoading(false);
    }
  };

  // Подготовка данных для pie chart статусов книг
  const bookStatusData = stats?.bookStatusStats ? [
    { name: 'Ожидают модерации', value: stats.bookStatusStats.pending, color: '#FFBB28' },
    { name: 'Одобрены', value: stats.bookStatusStats.approved, color: '#00C49F' },
    { name: 'Отклонены', value: stats.bookStatusStats.rejected, color: '#FF8042' },
    { name: 'Переведены', value: stats.bookStatusStats.translated, color: '#0088FE' }
  ].filter(item => item.value > 0) : [];

  // Подготовка данных для bar chart переводов по дням
  const dailyTranslationData = translationStats?.daily?.map(item => ({
    date: new Date(item.date).toLocaleDateString('ru-RU'),
    count: item.count
  })) || [];

  if (!stats && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Не удалось загрузить данные аналитики переводов</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Основные метрики переводов */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего переведено</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalTranslated || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">книг переведено</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Процент переводов</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.translationRate || 0}%</div>
            )}
            <p className="text-xs text-muted-foreground">от опубликованных</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">За 30 дней</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{translationStats?.total || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">новых переводов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В обработке</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.bookStatusStats?.pending || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">ожидают модерации</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Статусы книг</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : bookStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={bookStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bookStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Нет данных для отображения</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Переводы за последние 30 дней</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : dailyTranslationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyTranslationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Нет переводов за последние 30 дней</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}