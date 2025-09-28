import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/Auth';
import { Book } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, BookOpen } from 'lucide-react';
import AuthorStatsCards from './AuthorStatsCards';
import EarningsChart from './EarningsChart';
import RoyaltyRoadmap from './RoyaltyRoadmap';
import SimilarBooksAnalysis from './SimilarBooksAnalysis';
import CoverRoadmap from './CoverRoadmap'; // Импортируем новый компонент
import { getAuthorStats } from '@/api/functions'; // Импортируем функцию для статистики

export default function OverviewTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    monthlySales: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalBooks: 0,
    avgRating: 0
  });
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAuthorData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Загружаем статистику продаж
      const { data: salesStats } = await getAuthorStats();
      
      // Загружаем книги автора для расчета среднего рейтинга и количества
      const authorBooks = await Book.filter({ author_email: user.email });
      setBooks(authorBooks || []);

      const totalRating = authorBooks.reduce((sum, book) => sum + (book.rating || 0), 0);
      const avgRating = authorBooks.length > 0 ? totalRating / authorBooks.length : 0;

      setStats({
        monthlySales: salesStats.monthlySales || 0,
        totalSales: salesStats.totalSales || 0,
        totalRevenue: salesStats.totalRevenue || 0,
        totalBooks: authorBooks.length,
        avgRating
      });
    } catch (error) {
      console.error('Ошибка загрузки данных автора:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAuthorData();
  }, [loadAuthorData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-32 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-64 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <AuthorStatsCards stats={stats} />

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EarningsChart books={books} />
        <RoyaltyRoadmap authorEmail={user.email} qualifiedSales={stats.totalSales} />
      </div>

      {/* Cover Roadmap */}
      <CoverRoadmap monthlySales={stats.monthlySales} />

      {/* Similar Books Analysis */}
      <SimilarBooksAnalysis books={books} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={loadAuthorData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить статистику
            </Button>
            {stats.totalBooks === 0 && (
              <Button className="kasbook-btn-primary">
                <BookOpen className="w-4 h-4 mr-2" />
                Загрузить первую книгу
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}