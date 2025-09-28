import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, TrendingUp, BarChart3 } from 'lucide-react';
import { getAdminDashboardStats } from '@/api/functions';
import { toast } from 'sonner';

export default function GenreAnalytics() {
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
      console.error("Ошибка загрузки аналитики жанров:", err);
      toast.error("Не удалось загрузить аналитику по жанрам.");
    } finally {
      setIsLoading(false);
    }
  };

  const getGenreDisplayName = (genre) => {
    const genreNames = {
      'fiction': 'Художественная литература',
      'non-fiction': 'Нон-фикшн',
      'science': 'Наука',
      'history': 'История',
      'business': 'Бизнес',
      'romance': 'Романтика',
      'mystery': 'Детектив',
      'fantasy': 'Фантастика',
      'biography': 'Биография',
      'self-help': 'Саморазвитие',
      'philosophy': 'Философия'
    };
    return genreNames[genre] || genre;
  };

  if (!stats && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Не удалось загрузить данные по жанрам</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Топ жанры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Топ жанры по продажам
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.topGenres && stats.topGenres.length > 0 ? (
                stats.topGenres.map((item, index) => {
                  const maxSales = stats.topGenres[0]?.sales || 1;
                  const percentage = (item.sales / maxSales) * 100;
                  
                  return (
                    <div key={item.genre} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{getGenreDisplayName(item.genre)}</span>
                        </div>
                        <span className="text-sm font-bold">{item.sales} продаж</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">Данных по продажам жанров пока нет</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Статистика по всем жанрам */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Детальная статистика по жанрам
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats?.salesByGenre && Object.keys(stats.salesByGenre).length > 0 ? (
                Object.entries(stats.salesByGenre)
                  .sort(([,a], [,b]) => b - a)
                  .map(([genre, sales]) => (
                    <div key={genre} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">{getGenreDisplayName(genre)}</h3>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-primary">{sales}</p>
                        <p className="text-xs text-muted-foreground">продаж</p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="col-span-full">
                  <p className="text-center text-muted-foreground py-8">Данных по жанрам пока нет</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}