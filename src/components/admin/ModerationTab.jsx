import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Book,
  MessageSquare,
  Filter,
  Search
} from 'lucide-react';
import { Book as BookEntity } from '@/api/entities';
import { Review } from '@/api/entities';
import { useAuth } from '../auth/Auth';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { invalidateCache } from '@/components/utils/supabase';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ModerationTab() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('books-pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    setLoading(true);
    try {
      const [booksData, reviewsData] = await Promise.all([
        BookEntity.list(),
        Review.list()
      ]);
      setBooks(booksData || []);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Ошибка загрузки данных модерации:', error);
      toast.error('Не удалось загрузить данные модерации');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAction = async (bookId, action, reason = '') => {
    try {
      const updateData = { status: action };
      if (action === 'rejected') {
        updateData.rejection_reason = reason;
        updateData.moderator_email = user.email;
      } else if (action === 'approved') {
        updateData.moderator_email = user.email;
      }

      await BookEntity.update(bookId, updateData);
      invalidateCache();
      toast.success(`Книга ${action === 'approved' ? 'одобрена' : 'отклонена'}`);
      loadModerationData();
    } catch (error) {
      console.error('Ошибка обновления книги:', error);
      toast.error('Не удалось обновить статус книги');
    }
  };

  const handleReviewAction = async (reviewId, action) => {
    try {
      await Review.update(reviewId, { status: action });
      toast.success(`Отзыв ${action === 'approved' ? 'одобрен' : 'отклонен'}`);
      loadModerationData();
    } catch (error) {
      console.error('Ошибка обновления отзыва:', error);
      toast.error('Не удалось обновить статус отзыва');
    }
  };

  const getFilteredBooks = (status) => {
    return books
      .filter(book => book.status === status)
      .filter(book => 
        !searchTerm || 
        book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const getFilteredReviews = (status) => {
    return reviews.filter(review => review.status === status);
  };

  const tabsData = [
    {
      value: 'books-pending',
      label: 'Книги на модерации',
      icon: Clock,
      count: getFilteredBooks('pending').length,
      color: 'text-orange-600'
    },
    {
      value: 'books-approved',
      label: 'Одобренные книги',
      icon: CheckCircle,
      count: getFilteredBooks('approved').length,
      color: 'text-green-600'
    },
    {
      value: 'books-rejected',
      label: 'Отклоненные книги',
      icon: XCircle,
      count: getFilteredBooks('rejected').length,
      color: 'text-red-600'
    },
    {
      value: 'reviews-pending',
      label: 'Отзывы на модерации',
      icon: MessageSquare,
      count: getFilteredReviews('pending').length,
      color: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-muted h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию или автору..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted/50 p-1">
          {tabsData.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <Badge variant="outline" className="ml-1">
                  {tab.count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="books-pending">
            <BookTable 
              books={getFilteredBooks('pending')} 
              onAction={handleBookAction}
              status="pending"
            />
          </TabsContent>

          <TabsContent value="books-approved">
            <BookTable 
              books={getFilteredBooks('approved')} 
              onAction={handleBookAction}
              status="approved"
            />
          </TabsContent>

          <TabsContent value="books-rejected">
            <BookTable 
              books={getFilteredBooks('rejected')} 
              onAction={handleBookAction}
              status="rejected"
            />
          </TabsContent>

          <TabsContent value="reviews-pending">
            <ReviewTable 
              reviews={getFilteredReviews('pending')} 
              onAction={handleReviewAction}
            />
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

const BookTable = ({ books, onAction, status }) => {
  if (books.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Book className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Нет книг для отображения</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden lg:block"
      >
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 font-medium">Обложка</th>
                    <th className="text-left p-4 font-medium">Название</th>
                    <th className="text-left p-4 font-medium">Автор</th>
                    <th className="text-left p-4 font-medium">Жанр</th>
                    <th className="text-left p-4 font-medium">Цена</th>
                    <th className="text-center p-4 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {books.map((book, index) => (
                      <motion.tr
                        key={book.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-4">
                          <img
                            src={book.cover_url || '/api/placeholder/60/80'}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded kasbook-rounded-lg"
                          />
                        </td>
                        <td className="p-4 font-medium">{book.title}</td>
                        <td className="p-4 text-muted-foreground">{book.author}</td>
                        <td className="p-4">
                          <Badge variant="outline">{book.genre}</Badge>
                        </td>
                        <td className="p-4 font-mono">{book.price_kas} KAS</td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            {status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onAction(book.id, 'approved')}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const reason = prompt('Причина отклонения:');
                                    if (reason) onAction(book.id, 'rejected', reason);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Link to={createPageUrl(`BookModerationDetails?bookId=${book.id}`)}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        <AnimatePresence>
          {books.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="kasbook-card">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={book.cover_url || '/api/placeholder/60/80'}
                      alt={book.title}
                      className="w-16 h-20 object-cover rounded kasbook-rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{book.genre}</Badge>
                        <span className="text-sm font-mono">{book.price_kas} KAS</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:items-center">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="sm:flex-1"
                    >
                      <Link to={createPageUrl(`BookModerationDetails?bookId=${book.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Просмотр
                      </Link>
                    </Button>
                    {status === 'pending' && (
                      <div className="flex flex-1 gap-2">
                        <Button
                          size="sm"
                          onClick={() => onAction(book.id, 'approved')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Одобрить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const reason = prompt('Причина отклонения:');
                            if (reason) onAction(book.id, 'rejected', reason);
                          }}
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ReviewTable = ({ reviews, onAction }) => {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Нет отзывов для модерации</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="kasbook-card">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{review.reviewer_email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-sm ${
                            i < review.rating ? 'bg-orange-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAction(review.id, 'approved')}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAction(review.id, 'rejected')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};