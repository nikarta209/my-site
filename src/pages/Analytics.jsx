import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Book } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, BookOpen, TrendingUp, BarChart3, Users, Star } from 'lucide-react';
import TopBooksCarousel from '../components/author/TopBooksCarousel';

const StatCard = ({ title, value, icon, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalSales: 0,
    totalBooks: 0,
    averageRating: 0,
  });
  const [topBooksBySales, setTopBooksBySales] = useState([]);
  const [topBooksByEarnings, setTopBooksByEarnings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      if (userData.user_type !== 'author') {
          setUser(null);
          setIsLoading(false);
          return;
      }
      setUser(userData);

      const authorBooks = await Book.filter({ author_email: userData.email });
      const authorSales = await Purchase.filter({ seller_email: userData.email });

      // Calculate stats
      const totalEarnings = authorSales.reduce((sum, sale) => sum + (sale.author_payout_kas || 0), 0);
      const totalSales = authorSales.length;
      const totalBooks = authorBooks.length;
      const averageRating = authorBooks.length > 0
        ? authorBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / authorBooks.length
        : 0;

      // Add sales count and earnings to each book
      const booksWithStats = authorBooks.map(book => {
          const salesForBook = authorSales.filter(sale => sale.book_id === book.id);
          const earningsForBook = salesForBook.reduce((sum, sale) => sum + (sale.author_payout_kas || 0), 0);
          return {
              ...book,
              salesCount: salesForBook.length,
              totalEarnings: earningsForBook
          };
      });

      // Sort books
      const sortedBySales = [...booksWithStats].sort((a, b) => b.salesCount - a.salesCount).slice(0, 10);
      const sortedByEarnings = [...booksWithStats].sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 10);

      setStats({ totalEarnings, totalSales, totalBooks, averageRating });
      setTopBooksBySales(sortedBySales);
      setTopBooksByEarnings(sortedByEarnings);

    } catch (error) {
      console.error("Error loading analytics:", error);
    }
    setIsLoading(false);
  };
  
  if (!isLoading && !user) {
    return <div className="p-8 text-center">Доступно только для авторов.</div>
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 author-theme">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
            <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold">Аналитика</h1>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard 
            title="Общий доход (KAS)" 
            value={stats.totalEarnings.toFixed(2)} 
            icon={<DollarSign className="w-5 h-5 text-green-500" />} 
            isLoading={isLoading}
          />
          <StatCard 
            title="Всего продаж" 
            value={stats.totalSales} 
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
            isLoading={isLoading}
          />
          <StatCard 
            title="Опубликовано книг" 
            value={stats.totalBooks} 
            icon={<BookOpen className="w-5 h-5 text-indigo-500" />}
            isLoading={isLoading}
          />
          <StatCard 
            title="Средний рейтинг" 
            value={stats.averageRating.toFixed(2)} 
            icon={<Star className="w-5 h-5 text-yellow-500" />}
            isLoading={isLoading}
          />
        </div>

        {/* Carousels */}
        <div className="space-y-12">
          <TopBooksCarousel 
            books={topBooksBySales}
            title="Лидеры продаж"
            metric="salesCount"
            metricLabel="продаж"
            isLoading={isLoading}
          />
          <TopBooksCarousel 
            books={topBooksByEarnings}
            title="Самые прибыльные книги"
            metric="totalEarnings"
            metricLabel="KAS"
            isLoading={isLoading}
          />
        </div>

        {/* Placeholder for future charts */}
        <div className="mt-12">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Обзор аудитории</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-16 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4"/>
                        <p>Данные об аудитории и более детальная аналитика появятся здесь в скором времени.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}