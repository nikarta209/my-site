import React, { useState, useEffect, useMemo } from 'react';
import { Book } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart, ThumbsUp, Eye, Star, Award } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';


const TopBooksCarousel = ({ title, books, metric, metricLabel, icon, isLoading }) => {
  const Icon = icon;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-green-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex space-x-4"><Skeleton className="h-56 w-full" /></div>
        ) : books.length > 0 ? (
          <Carousel opts={{ align: "start", loop: books.length > 5 }}>
            <CarouselContent className="-ml-4">
              {books.map((book) => (
                <CarouselItem key={book.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <Link to={createPageUrl(`BookDetails?id=${book.id}`)} className="group">
                    <img src={getCoverOrPlaceholder(book, `https://picsum.photos/seed/${book.id}/300/400`)} alt={book.title} className="rounded-lg h-48 w-full object-cover transition-transform group-hover:scale-105" />
                    <h3 className="mt-2 text-sm font-semibold truncate group-hover:text-green-600">{book.title}</h3>
                    <p className="text-xs text-gray-500">{book[metric]} {metricLabel}</p>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        ) : (
          <p className="text-center text-gray-500 py-8">Нет данных для отображения.</p>
        )}
      </CardContent>
    </Card>
  );
};

const TopAuthorsList = ({ title, authors, isLoading }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : authors.length > 0 ? (
                    <div className="space-y-4">
                        {authors.map((author, index) => (
                            <div key={author.email} className="flex items-center gap-4">
                                <span className="font-bold text-lg text-gray-400 w-6">#{index + 1}</span>
                                <img src={author.avatar_url || `https://i.pravatar.cc/150?u=${author.email}`} alt={author.full_name} className="w-12 h-12 rounded-full object-cover" />
                                <div className="flex-grow">
                                    <p className="font-semibold">{author.full_name}</p>
                                    <p className="text-sm text-gray-500">{author.total_sales} продаж</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">Нет данных.</p>
                )}
            </CardContent>
        </Card>
    );
};


export default function UserAnalytics() {
    const [timeFilter, setTimeFilter] = useState('month'); // 'week', 'month', 'all'
    const [books, setBooks] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [allBooks, allPurchases, allUsers] = await Promise.all([
                    Book.list(),
                    Purchase.list(),
                    User.list()
                ]);
                setBooks(allBooks);
                setPurchases(allPurchases);
                setAuthors(allUsers.filter(u => u.user_type === 'author'));
            } catch (error) {
                console.error("Error loading analytics data:", error);
            }
            setIsLoading(false);
        };
        loadData();
    }, []);

    const filteredData = useMemo(() => {
        if (isLoading) return { topBySales: [], topByLikes: [], topByViews: [], topAuthors: [] };

        const now = new Date();
        const filterDate = new Date();
        if (timeFilter === 'week') filterDate.setDate(now.getDate() - 7);
        else if (timeFilter === 'month') filterDate.setMonth(now.getMonth() - 1);

        const relevantPurchases = timeFilter === 'all'
            ? purchases
            : purchases.filter(p => new Date(p.created_date) > filterDate);

        // Top Books by Sales
        const salesCount = relevantPurchases.reduce((acc, p) => {
            acc[p.book_id] = (acc[p.book_id] || 0) + 1;
            return acc;
        }, {});
        const booksWithSales = books.map(b => ({ ...b, sales: salesCount[b.id] || 0 }));
        const topBySales = [...booksWithSales].sort((a, b) => b.sales - a.sales).slice(0, 10);

        // Top Books by Likes & Views (using all-time data as it's not time-stamped)
        const topByLikes = [...books].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 10);
        const topByViews = [...books].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 10);
        
        // Top Authors by Sales
        const authorSales = relevantPurchases.reduce((acc, p) => {
            acc[p.seller_email] = (acc[p.seller_email] || 0) + 1;
            return acc;
        }, {});
        const authorsWithSales = authors.map(a => ({...a, total_sales: authorSales[a.email] || 0}));
        const topAuthors = [...authorsWithSales].sort((a,b) => b.total_sales - a.total_sales).slice(0,5);

        return { topBySales, topByLikes, topByViews, topAuthors };
    }, [books, purchases, authors, timeFilter, isLoading]);

    const filterOptions = [
        { key: 'month', label: 'За месяц' },
        { key: 'week', label: 'За 7 дней' },
        { key: 'all', label: 'За все время' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold">Тренды KASBOOK</h1>
                        <p className="text-gray-500 mt-1">Самые популярные книги и авторы платформы.</p>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
                        {filterOptions.map(opt => (
                            <Button 
                                key={opt.key}
                                variant={timeFilter === opt.key ? 'default' : 'ghost'}
                                onClick={() => setTimeFilter(opt.key)}
                                className={timeFilter === opt.key ? 'bg-white dark:bg-gray-900 text-primary' : ''}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                           <TopBooksCarousel title="Лидеры продаж" books={filteredData.topBySales} metric="sales" metricLabel="продаж" icon={BarChart} isLoading={isLoading} />
                        </div>
                        <div className="lg:col-span-1">
                            <TopAuthorsList title="Топ авторов" authors={filteredData.topAuthors} isLoading={isLoading} />
                        </div>
                    </div>
                    
                    <TopBooksCarousel title="Самые просматриваемые" books={filteredData.topByViews} metric="views_count" metricLabel="просмотров" icon={Eye} isLoading={isLoading} />
                    <TopBooksCarousel title="Больше всего лайков" books={filteredData.topByLikes} metric="likes" metricLabel="лайков" icon={ThumbsUp} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}