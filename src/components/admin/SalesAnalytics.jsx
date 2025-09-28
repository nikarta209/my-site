import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { getAdminDashboardStats } from '@/api/functions';
import { toast } from 'sonner';

export default function SalesAnalytics() {
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
      console.error("Ошибка загрузки аналитики продаж:", err);
      toast.error("Не удалось загрузить аналитику продаж.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!stats && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Не удалось загрузить данные продаж</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ключевые метрики продаж */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего продаж</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalPurchases || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{(stats?.totalRevenueKAS || 0).toFixed(2)} KAS</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя продажа</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.avgRevenuePerSale || 0} KAS</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Конверсия</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* График продаж за 30 дней */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Продажи за последние 30 дней
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4">
              {stats?.dailyActivity && Object.keys(stats.dailyActivity).length > 0 ? (
                <div className="grid gap-2">
                  {Object.entries(stats.dailyActivity)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .map(([date, sales]) => {
                      const maxSales = Math.max(...Object.values(stats.dailyActivity));
                      const percentage = maxSales > 0 ? (sales / maxSales) * 100 : 0;
                      
                      return (
                        <div key={date} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">
                                {new Date(date).toLocaleDateString('ru-RU', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  weekday: 'short'
                                })}
                              </span>
                              <Badge variant="secondary">{sales} продаж</Badge>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Продаж за последние 30 дней пока нет</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}