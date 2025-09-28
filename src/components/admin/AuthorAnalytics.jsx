import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { User, DollarSign, TrendingUp, Crown } from 'lucide-react';
import { getAdminDashboardStats } from '@/api/functions';
import { toast } from 'sonner';

export default function AuthorAnalytics() {
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
      console.error("Ошибка загрузки аналитики авторов:", err);
      toast.error("Не удалось загрузить аналитику по авторам.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!stats && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Не удалось загрузить данные по авторам</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Топ авторы по продажам */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Топ авторы по продажам
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.topAuthors && stats.topAuthors.length > 0 ? (
                stats.topAuthors.map((author, index) => {
                  const maxSales = stats.topAuthors[0]?.sales || 1;
                  const percentage = (author.sales / maxSales) * 100;
                  
                  return (
                    <div key={author.author} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div>
                            <h3 className="font-semibold">{author.author}</h3>
                            <p className="text-xs text-muted-foreground">{author.sales} продаж</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{author.revenue.toFixed(2)} KAS</p>
                          <p className="text-xs text-muted-foreground">заработано</p>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">Данных по авторам пока нет</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Общая статистика авторов */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего авторов</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalAuthors || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Книг на автора</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.avgBooksPerAuthor || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний доход автора</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.topAuthors && stats.topAuthors.length > 0
                  ? (stats.topAuthors.reduce((sum, author) => sum + author.revenue, 0) / stats.topAuthors.length).toFixed(2)
                  : '0.00'
                } KAS
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}