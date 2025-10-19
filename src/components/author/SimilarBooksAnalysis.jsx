import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from 'lucide-react';
import { Book } from '@/api/entities';
import { useTranslation } from '../i18n/SimpleI18n';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

export default function SimilarBooksAnalysis({ genre, isLoading }) {
  const [similarBooks, setSimilarBooks] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (genre) {
      const fetchSimilar = async () => {
        const topBooks = await Book.filter(
          { genre: genre, status: 'approved' }, 
          '-rating', 
          5
        );
        setSimilarBooks(topBooks);
      };
      fetchSimilar();
    }
  }, [genre]);

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle>{t('author.similar.title', 'Популярное в вашем жанре')} ({genre})</CardTitle>
        <p className="text-sm text-gray-500">{t('author.similar.description', 'Анализируйте тренды, чтобы создавать бестселлеры')}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_,i) => <div key={i} className="flex items-center space-x-4"><div className="w-10 h-14 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse" /><div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700 animate-pulse" /><div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700 animate-pulse" /></div></div>)
        ) : similarBooks.length > 0 ? (
          similarBooks.map(book => (
            <div key={book.id} className="flex items-center gap-4">
              <img src={getCoverOrPlaceholder(book, `https://picsum.photos/seed/${book.id}/200/280`)} alt={book.title} className="w-10 h-14 object-cover rounded-md"/>
              <div className="flex-grow">
                <p className="font-medium text-sm">{book.title}</p>
                <p className="text-xs text-gray-500">{book.author}</p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 text-yellow-400 fill-current"/>
                {(book.rating || 0).toFixed(1)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">{t('author.similar.notFound', 'Не удалось найти похожие книги.')}</p>
        )}
        </div>
      </CardContent>
    </Card>
  );
}