import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BookCheck,
  BookX,
  Clock
} from "lucide-react";
import { useTranslation } from '../i18n/SimpleI18n';

export default function MyBooksList({ books, isLoading }) {
  const { t } = useTranslation();

  const statusIcons = {
    approved: <BookCheck className="w-4 h-4 text-green-500" />,
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    rejected: <BookX className="w-4 h-4 text-red-500" />,
  };
  const statusText = {
    approved: t('author.books.status.approved', "Одобрено"),
    pending: t('author.books.status.pending', "На рассмотрении"),
    rejected: t('author.books.status.rejected', "Отклонено"),
  };
  const statusColors = {
    approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle>{t('author.books.title', "Мои книги")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_,i) => <div key={i} className="flex items-center space-x-4"><div className="w-12 h-16 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse" /><div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700 animate-pulse" /><div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700 animate-pulse" /></div></div>)
          ) : books.length > 0 ? (
            books.map(book => (
              <div key={book.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <img src={book.cover_url} alt={book.title} className="w-12 h-16 object-cover rounded-md" />
                <div className="flex-grow">
                  <p className="font-semibold">{book.title}</p>
                  <p className="text-sm text-gray-500">{book.total_sales_count || 0} {t('author.books.sales', 'продаж')}</p>
                </div>
                <Badge className={`flex items-center gap-1.5 ${statusColors[book.status]}`}>
                  {statusIcons[book.status]}
                  {statusText[book.status]}
                </Badge>
                <Link to={createPageUrl(`AuthorDashboard?book_id=${book.id}`)}>
                  <Button variant="ghost" size="sm">{t('author.books.manage', 'Управлять')}</Button>
                </Link>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">{t('author.books.noBooks', 'Вы еще не загрузили ни одной книги.')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}