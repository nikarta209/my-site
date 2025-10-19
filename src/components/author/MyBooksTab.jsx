import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/Auth';
import { Book } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Edit,
  Eye,
  Trash2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import EditBookSheet from './EditBookSheet';
import { toast } from 'sonner';
import { getBookCoverUrl } from '@/lib/books/coverImages';

export default function MyBooksTab() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const loadBooks = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const authorBooks = await Book.filter({ author_email: user.email });
      console.log('Загруженные книги автора:', authorBooks);
      setBooks(authorBooks || []);
    } catch (error) {
      console.error('Ошибка загрузки книг:', error);
      toast.error('Не удалось загрузить книги');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = books.filter(book =>
        book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.genre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(books);
    }
  }, [books, searchTerm]);

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setIsEditSheetOpen(true);
  };

  const handleBookUpdated = () => {
    setIsEditSheetOpen(false);
    setSelectedBook(null);
    loadBooks();
    toast.success('Книга успешно обновлена');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-orange-100 text-orange-800', label: 'На рассмотрении' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Одобрено' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Отклонено' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-muted h-32 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Мои книги ({books.length})
          </h2>
          <p className="text-muted-foreground">
            Управляйте своими публикациями и отслеживайте их реальную статистику.
          </p>
        </div>
        <Button onClick={loadBooks} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск книг..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Books List */}
      <AnimatePresence>
        {filteredBooks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {books.length === 0 ? 'У вас пока нет книг' : 'Книги не найдены'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {books.length === 0 
                ? 'Загрузите свою первую книгу, чтобы начать получать доход'
                : 'Попробуйте изменить поисковый запрос'
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="kasbook-card hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Book Cover */}
                      <div className="w-16 h-24 bg-muted kasbook-rounded-lg overflow-hidden flex-shrink-0">
                        {(() => {
                          const coverSrc = getBookCoverUrl(book, {
                            variant: 'portrait',
                            fallback: null,
                          });
                          if (!coverSrc) {
                            return (
                              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-muted-foreground" />
                              </div>
                            );
                          }
                          return (
                            <img
                              src={coverSrc}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          );
                        })()}
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground truncate">
                              {book.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {book.genre} • {book.price_kas || 0} KAS
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(book.status)}
                              <Badge variant="outline">
                                {book.sales_count || 0} продаж
                              </Badge>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditBook(book)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Рейтинг: {book.rating ? book.rating.toFixed(1) : '0.0'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {book.views || 0} просмотров
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Edit Book Sheet */}
      <EditBookSheet
        book={selectedBook}
        isOpen={isEditSheetOpen}
        onClose={() => {
          setIsEditSheetOpen(false);
          setSelectedBook(null);
        }}
        onBookUpdated={handleBookUpdated}
      />
    </div>
  );
}