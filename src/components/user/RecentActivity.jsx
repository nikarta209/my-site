import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowRight } from 'lucide-react';

export default function RecentActivity({ purchases, isLoading }) {
  const [books, setBooks] = useState({});
  const [isBookLoading, setIsBookLoading] = useState(true);

  useEffect(() => {
    if (purchases && purchases.length > 0) {
      loadBookDetails();
    } else {
      setIsBookLoading(false);
    }
  }, [purchases]);

  const loadBookDetails = async () => {
    setIsBookLoading(true);
    try {
      const bookIds = purchases.map(p => p.book_id);
      
      const bookPromises = bookIds.slice(0, 5).map(id => 
        Book.filter({ id: id }, '', 1).catch(e => null)
      );
      const bookResults = await Promise.all(bookPromises);

      const purchaseBookMap = {};
      purchases.slice(0, 5).forEach((p, i) => {
        if (bookResults[i] && bookResults[i][0]) {
          purchaseBookMap[p.id] = bookResults[i][0];
        }
      });
      setBooks(purchaseBookMap);
    } catch (error) {
      console.error("Error loading book details for recent activity:", error);
    }
    setIsBookLoading(false);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          Недавние покупки
        </CardTitle>
        <Link to={createPageUrl('Library')}>
          <Button variant="ghost" size="sm">
            Вся библиотека <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {!purchases || purchases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Вы еще не покупали книг.</p>
            <Link to={createPageUrl('Catalog')}>
              <Button className="mt-4">Перейти в каталог</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {isBookLoading 
              ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              : purchases.slice(0, 5).map(purchase => {
                  const book = books[purchase.id];
                  if (!book) return null;
                  return (
                    <div key={purchase.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <Link to={createPageUrl(`BookDetails?id=${book.id}`)}>
                        <img 
                          src={book.cover_url || `https://picsum.photos/60/80?random=${book.id}`}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded-md"
                        />
                      </Link>
                      <div className="flex-1">
                        <h4 className="font-semibold">{book.title}</h4>
                        <p className="text-sm text-gray-500">от {book.author}</p>
                        <p className="text-xs text-gray-400 mt-1">Куплено: {new Date(purchase.created_date).toLocaleDateString()}</p>
                      </div>
                      <Link to={createPageUrl(`Reader?bookId=${book.id}`)}>
                        <Button>Читать</Button>
                      </Link>
                    </div>
                  )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}