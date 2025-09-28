
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useSubscription } from '../components/auth/Auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Download,
  Heart,
  Clock,
  Plus,
  Archive,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  StickyNote,
  Calendar,
  Crown, // Добавим иконку Crown
  Lock // Добавим иконку Lock
} from 'lucide-react';
import { getUserPurchases, getUserPreviews } from '../components/utils/supabase';
import { Book } from '@/api/entities'; // Добавим импорт Book
import { useCart } from '../components/cart/CartContext';
import { useTranslation } from '../components/i18n/SimpleI18n';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Library() {
  const { user, isAuthenticated } = useAuth();
  const subscription = useSubscription(); // Получаем статус подписки
  const { addToCart } = useCart();
  const { t } = useTranslation();
  
  const [ownedBooks, setOwnedBooks] = useState([]);
  const [previewBooks, setPreviewBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRecentIndex, setCurrentRecentIndex] = useState(0);
  const [subscriptionBooks, setSubscriptionBooks] = useState([]); // Новое состояние для книг по подписке

  const loadLibraryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises = [
        getUserPurchases(),
        getUserPreviews()
      ];
      
      // Загружаем книги по подписке, только если подписка активна
      if (subscription.isActive) {
        promises.push(Book.filter({ is_in_subscription: true }));
      }
      
      // Деструктурируем результаты в зависимости от наличия подписки
      let owned, previews, subBooks;
      if (subscription.isActive) {
        [owned, previews, subBooks] = await Promise.all(promises);
      } else {
        [owned, previews] = await Promise.all(promises);
      }

      setOwnedBooks(owned.filter(p => p.book).map(p => p.book));
      setPreviewBooks(previews || []);
      setSubscriptionBooks(subBooks || []); // Устанавливаем книги по подписке, будет [] если подписки нет
      
      // Симулируем недавние книги и заметки
      const recent = owned.length > 0 ? owned.slice(0, 5).map(p => ({
        ...p.book,
        lastRead: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        progress: Math.floor(Math.random() * 100),
        notes: generateMockNotes()
      })) : [];
      setRecentBooks(recent);
      
    } catch (error) {
      console.error('Ошибка загрузки библиотеки:', error);
      toast.error('Не удалось загрузить библиотеку');
    } finally {
      setIsLoading(false);
    }
  }, [subscription.isActive]);

  useEffect(() => {
    if (isAuthenticated) {
      loadLibraryData();
    }
  }, [isAuthenticated, loadLibraryData]);

  const generateMockNotes = () => {
    const mockNotes = [
      { text: "Интересная мысль о человеческой природе", page: 45, date: new Date() },
      { text: "Замечательное описание персонажа", page: 78, date: new Date() },
      { text: "Важная деталь сюжета", page: 123, date: new Date() }
    ];
    return mockNotes.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border py-3">
          <div className="container mx-auto px-4">
            <h1 className="text-lg font-bold text-foreground">Мои книги</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-3 text-foreground">Читаю и слушаю</h2>
            <p className="text-muted-foreground mb-6">
              Здесь будет показаться все, что вы читаете и слушаете
            </p>
            
            <Button 
              onClick={() => window.location.href = createPageUrl('Profile')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
            >
              Войти
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabsData = [
    { 
      key: 'dashboard', 
      label: 'Главная', 
      icon: BookOpen, 
      count: recentBooks.length
    },
    { 
      key: 'owned', 
      label: 'Мои книги', 
      icon: Archive, 
      count: ownedBooks.length
    },
    {
      key: 'subscription',
      label: 'По подписке',
      icon: Crown,
      count: subscriptionBooks.length,
      isSubscription: true // Флаг для вкладки подписки
    },
    { 
      key: 'previews', 
      label: 'Превью', 
      icon: Download, 
      count: previewBooks.length
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Мои книги</h1>
              <p className="text-muted-foreground text-sm">Читаю и слушаю</p>
            </div>
            
            <Link to={createPageUrl('Catalog')}>
              <Button variant="outline" className="flex items-center gap-2" size="sm">
                <Plus className="w-3 h-3" />
                Загрузить книги
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto">
          {tabsData.map((tab) => {
            const Icon = tab.icon;
            const isLocked = tab.isSubscription && !subscription.isActive;

            // Не показывать неактивную вкладку, если там пусто
            if (isLocked && tab.count === 0) return null; 

            return (
              <button
                key={tab.key}
                onClick={() => !isLocked && setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.key && !isLocked // Только активная, если не заблокирована
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground/70 hover:text-primary hover:bg-muted/50'
                } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <Icon className={`w-3 h-3 ${tab.isSubscription ? 'text-yellow-500' : ''}`} />
                {tab.label}
                {isLocked ? (
                  <Lock className="w-3 h-3 ml-1" /> // Показать иконку замка, если заблокировано
                ) : tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardContent 
              recentBooks={recentBooks}
              currentIndex={currentRecentIndex}
              setCurrentIndex={setCurrentRecentIndex}
              isLoading={isLoading}
            />
          )}
          
          {activeTab === 'owned' && (
            <LibraryGrid 
              books={ownedBooks} 
              isLoading={isLoading}
              compact={true}
              linkToReader={true}
            />
          )}

          {activeTab === 'subscription' && (
            <LibraryGrid 
              books={subscriptionBooks} 
              isLoading={isLoading}
              compact={true}
              linkToReader={true}
            />
          )}
          
          {activeTab === 'previews' && (
            <LibraryGrid 
              books={previewBooks} 
              isLoading={isLoading}
              compact={true}
              linkToReader={true}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Новый компонент Dashboard
function DashboardContent({ recentBooks, currentIndex, setCurrentIndex, isLoading }) {
  const currentBook = recentBooks[currentIndex];

  // ИСПРАВЛЕНО: Правильная логика выбора обложки для библиотеки
  const getLibraryCoverUrl = (book) => {
    // Приоритет: library_hero -> landscape -> default
    if (!book) return '/api/placeholder/1200/400'; // Fallback if book is null/undefined
    if (book.cover_images?.library_hero) {
      return book.cover_images.library_hero;
    }
    if (book.cover_images?.landscape) {
      return book.cover_images.landscape;
    }
    if (book.cover_images?.default) {
      return book.cover_images.default;
    }
    return book.cover_url || `https://picsum.photos/seed/${book.id || Math.random()}/1200/400`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-pulse bg-muted h-64 rounded-lg"></div>
        <div className="animate-pulse bg-muted h-64 rounded-lg"></div>
      </div>
    );
  }

  if (recentBooks.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-6" />
        <h3 className="text-xl font-medium mb-4 text-foreground">
          Начните читать книги
        </h3>
        <Link to={createPageUrl('Catalog')}>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Выбрать книги
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Book Panel с фоновой обложкой */}
      <Card 
        className="border border-border overflow-hidden relative bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${currentBook ? getLibraryCoverUrl(currentBook) : ''})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20 z-0"></div>
        <div className="relative z-10 flex flex-col h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Читаю сейчас</CardTitle>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-white/80">
                    {currentIndex + 1} / {recentBooks.length}
                  </span>
                  <button 
                    onClick={() => setCurrentIndex(Math.min(recentBooks.length - 1, currentIndex + 1))}
                    disabled={currentIndex === recentBooks.length - 1}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              {currentBook && (
                <div className="flex gap-4 p-4 w-full">
                  <img
                    src={currentBook.cover_images?.default || currentBook.cover_url || '/api/placeholder/120/160'}
                    alt={currentBook.title}
                    className="w-20 h-28 object-cover rounded shadow-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{currentBook.title}</h3>
                    <p className="text-xs text-white/70 mb-2">{currentBook.author}</p>
                    
                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-white/70 mb-1">
                        <span>Прогресс</span>
                        <span>{currentBook.progress}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-1.5">
                        <div 
                          className="bg-white h-1.5 rounded-full transition-all"
                          style={{ width: `${currentBook.progress}%` }}
                        />
                      </div>
                    </div>

                    <Link to={createPageUrl(`Reader?bookId=${currentBook.id}`)}>
                      <Button size="sm" className="w-full text-xs bg-white text-black hover:bg-white/90">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Продолжить чтение
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
        </div>
      </Card>

      {/* Notes Panel */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            Мои заметки
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentBook?.notes?.length > 0 ? (
            <div className="space-y-3">
              {currentBook.notes.map((note, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm mb-2">{note.text}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Стр. {note.page}</span>
                    <span>{note.date.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <StickyNote className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Заметок пока нет</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Компактная сетка книг
function LibraryGrid({ books, isLoading, compact = false, linkToReader = false }) {
  if (isLoading) {
    const gridCols = compact ? "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6";
    return (
      <div className={`grid ${gridCols} gap-3`}>
        {Array(16).fill(0).map((_, i) => (
          <div key={i} className="animate-pulse bg-muted aspect-[3/4] rounded"></div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-6" />
        <h3 className="text-xl font-medium mb-4 text-foreground">Раздел пуст</h3>
        <Link to={createPageUrl('Catalog')}>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Выбрать книги
          </Button>
        </Link>
      </div>
    );
  }

  if (compact) {
    // Компактная версия - маленькие книжки
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 gap-2">
        {books.map((book) => (
          <CompactBookCard key={book.id} book={book} linkToReader={linkToReader} />
        ))}
      </div>
    );
  }

  // Обычная версия
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} linkToReader={linkToReader} />
      ))}
    </div>
  );
}

// Компактная карточка книги
function CompactBookCard({ book, linkToReader }) {
  const destination = linkToReader
    ? createPageUrl(`Reader?bookId=${book.id}`)
    : createPageUrl(`BookDetails?id=${book.id}`);

  return (
    <Link to={destination}>
      <div className="group cursor-pointer">
        <div className="aspect-[3/4] bg-muted overflow-hidden rounded shadow-sm hover:shadow-md transition-shadow">
          <img
            src={book.cover_images?.default || book.cover_url || '/api/placeholder/120/160'}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <h3 className="text-xs font-medium mt-1 line-clamp-2 leading-tight text-foreground group-hover:text-primary transition-colors">
          {book.title}
        </h3>
      </div>
    </Link>
  );
}

// Обычная карточка книги  
function BookCard({ book, linkToReader }) {
  const progress = 0; // TODO: получать из UserBookData
  const destination = linkToReader
    ? createPageUrl(`Reader?bookId=${book.id}`)
    : createPageUrl(`BookDetails?id=${book.id}`);
  
  return (
    <Card className="border-border hover:shadow-lg transition-all h-full flex flex-col">
      <CardContent className="p-3 flex-1 flex flex-col">
        <div className="relative mb-3">
          <Link to={destination}>
            <img
              src={book.cover_images?.default || book.cover_url || '/api/placeholder/200/280'}
              alt={book.title}
              className="w-full aspect-[2/3] object-cover rounded"
            />
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="mb-3">
            <h3 className="font-semibold text-foreground text-xs leading-tight mb-1 line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              {book.author}
            </p>

            {progress > 0 && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Прогресс чтения</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Link to={createPageUrl(`Reader?bookId=${book.id}`)} className="w-full">
              <Button size="sm" className="w-full bg-primary text-primary-foreground text-xs">
                <BookOpen className="w-3 h-3 mr-1" />
                Читать
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
