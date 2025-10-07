
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/auth/Auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Eye,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Book } from '@/api/entities';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ModerationPage() {
  const { user, isAuthenticated } = useAuth();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');

  // Проверка прав доступа
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    if (isAuthenticated && isModerator) {
      loadBooks();
    }
  }, [isAuthenticated, isModerator]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const allBooks = await Book.list();
      setBooks(allBooks);
    } catch (error) {
      console.error('Ошибка загрузки книг:', error);
      toast.error('Не удалось загрузить список книг');
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = useCallback(() => {
    let filtered = books;

    // Фильтрация по активной вкладке
    if (activeTab === 'pending') {
      filtered = filtered.filter(book => book.status === 'pending');
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(book => book.status === 'approved');
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter(book => book.status === 'rejected');
    }

    // Поиск
    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBooks(filtered);
  }, [books, searchTerm, activeTab]); // Dependencies for useCallback: states used inside filterBooks

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, statusFilter, activeTab, filterBooks]); // filterBooks is now a stable dependency due to useCallback

  const handleBookAction = async (bookId, action, rejectionData = null) => {
    try {
      const updateData = { status: action };
      
      if (action === 'rejected' && rejectionData) {
        updateData.rejection_info = rejectionData;
        updateData.moderator_email = user.email;
      } else if (action === 'approved') {
        updateData.moderator_email = user.email;
      }

      await Book.update(bookId, updateData);
      
      toast.success(
        action === 'approved' ? 'Книга одобрена!' : 
        action === 'rejected' ? 'Книга отклонена' : 
        'Статус книги обновлен'
      );
      
      // Перезагружаем список книг
      loadBooks();
      
    } catch (error) {
      console.error('Ошибка обновления книги:', error);
      toast.error('Не удалось обновить статус книги');
    }
  };

  // Проверка доступа
  if (!isAuthenticated) {
    return (
      <div className="w-full bg-background flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              Требуется авторизация
            </h2>
            <p className="text-muted-foreground mb-4">
              Войдите в систему для доступа к панели модерации
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="w-full bg-background flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              Доступ ограничен
            </h2>
            <p className="text-muted-foreground mb-4">
              Панель модерации доступна только администраторам и модераторам
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTabCounts = () => {
    return {
      pending: books.filter(book => book.status === 'pending').length,
      approved: books.filter(book => book.status === 'approved').length,
      rejected: books.filter(book => book.status === 'rejected').length,
    };
  };

  const tabCounts = getTabCounts();

  if (loading) {
    return (
      <div className="w-full bg-background flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка книг для модерации...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Панель модерации
              </h1>
              <p className="text-muted-foreground">
                Управление и модерация книг на платформе
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
              Модератор
            </Badge>
          </div>
        </motion.div>

        {/* Поиск и фильтры */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Поиск</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Поиск по названию, автору или email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border shadow-lg">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted mb-6">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>На модерации</span>
                  {tabCounts.pending > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">
                      {tabCounts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Одобренные</span>
                  {tabCounts.approved > 0 && (
                    <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                      {tabCounts.approved}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>Отклоненные</span>
                  {tabCounts.rejected > 0 && (
                    <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5">
                      {tabCounts.rejected}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {['pending', 'approved', 'rejected'].map(status => (
                <TabsContent key={status} value={status} className="mt-6">
                  {filteredBooks.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold text-foreground">
                        Нет книг для отображения
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        {status === 'pending' ? 'Все книги уже промодерированы' :
                         status === 'approved' ? 'Нет одобренных книг' :
                         'Нет отклоненных книг'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {filteredBooks.map((book) => {
                          const fallbackCover = `https://picsum.photos/80/120?random=${book.id}`;
                          const coverUrl =
                            book.cover_images?.default ||
                            book.cover_url ||
                            fallbackCover;

                          return (
                            <motion.div
                              key={book.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="border rounded-lg p-6 bg-background hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                  <img
                                    src={coverUrl}
                                    alt={book.title}
                                    className="w-20 h-28 object-cover rounded"
                                    onError={(e) => {
                                      e.target.src = fallbackCover;
                                    }}
                                  />
                                  <div>
                                    <h3 className="text-xl font-semibold text-foreground">
                                      {book.title}
                                    </h3>
                                    <p className="text-muted-foreground">
                                      Автор: {book.author}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Email: {book.author_email}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                      <Badge variant="secondary">
                                        {book.genre}
                                      </Badge>
                                      <Badge variant="outline">
                                        {book.price_kas} KAS
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                                      {book.description?.substring(0, 200)}...
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button asChild variant="outline" size="sm">
                                    <Link to={createPageUrl(`BookModerationDetails?bookId=${book.id}`)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      Подробнее
                                    </Link>
                                  </Button>
                                  {book.status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleBookAction(book.id, 'approved')}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Одобрить
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          const reason = prompt('Причина отклонения:');
                                          const comment = prompt('Комментарий (необязательно):');
                                          if (reason) {
                                            handleBookAction(book.id, 'rejected', {
                                              reason,
                                              comment: comment || ''
                                            });
                                          }
                                        }}
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Отклонить
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
