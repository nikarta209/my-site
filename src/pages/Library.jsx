
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Lock, // Добавим иконку Lock
  ImagePlus,
  Trash2
} from 'lucide-react';
import { getUserPurchases, getUserPreviews, uploadFile, updateBook } from '../components/utils/supabase';
import { Book } from '@/api/entities'; // Добавим импорт Book
import { useCart } from '../components/cart/CartContext';
import { useTranslation } from '../components/i18n/SimpleI18n';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

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
  const [loadError, setLoadError] = useState(null);

  const loadLibraryData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
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
      setLoadError('Не удалось загрузить данные библиотеки. Пожалуйста, попробуйте снова.');
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
              loadError={loadError}
              onRetry={loadLibraryData}
              user={user}
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
function DashboardContent({ recentBooks, currentIndex, setCurrentIndex, isLoading, loadError, onRetry, user }) {
  const [noteCoverMap, setNoteCoverMap] = useState({});
  const [uploadDialogBookId, setUploadDialogBookId] = useState(null);
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const previewObjectUrlRef = useRef(null);

  const isAuthorUser = useMemo(() => {
    if (!user) return false;
    if (user.permissions?.canAccessAuthorPanel) return true;
    if (Array.isArray(user.roles)) {
      return user.roles.includes('author');
    }
    return user.role === 'author';
  }, [user]);

  const getLibraryCoverUrl = useCallback((book) => {
    if (!book) return null;
    if (book.cover_images?.library_hero) return book.cover_images.library_hero;
    if (book.cover_images?.landscape) return book.cover_images.landscape;
    if (book.cover_images?.default) return book.cover_images.default;
    return book.cover_url || null;
  }, []);

  useEffect(() => {
    if (!recentBooks || recentBooks.length === 0) {
      setNoteCoverMap({});
      return;
    }

    setNoteCoverMap((prev) => {
      const updated = { ...prev };
      let hasChanges = false;

      recentBooks.forEach((book) => {
        if (!book?.id) {
          return;
        }
        if (!(book.id in updated)) {
          const initial = book.notes_cover_url || book.notesCoverUrl || null;
          updated[book.id] = initial;
          hasChanges = true;
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [recentBooks]);

  useEffect(() => {
    if (!recentBooks || recentBooks.length === 0) {
      if (currentIndex !== 0) {
        setCurrentIndex(0);
      }
      return;
    }

    if (currentIndex > recentBooks.length - 1) {
      setCurrentIndex(recentBooks.length - 1);
    }
  }, [recentBooks, currentIndex, setCurrentIndex]);

  const currentBook = useMemo(() => {
    if (!recentBooks || recentBooks.length === 0) return null;
    const safeIndex = Math.min(Math.max(currentIndex, 0), recentBooks.length - 1);
    return recentBooks[safeIndex];
  }, [recentBooks, currentIndex]);

  const bannerBackgroundUrl = currentBook ? getLibraryCoverUrl(currentBook) : null;
  const notesCoverUrl = currentBook?.id ? noteCoverMap[currentBook.id] ?? null : null;
  const fallbackNotesCover = useMemo(() => {
    if (!currentBook) return null;
    return (
      currentBook.notes_fallback_cover ||
      currentBook.cover_images?.landscape ||
      currentBook.cover_images?.library_hero ||
      currentBook.cover_images?.default ||
      currentBook.cover_url ||
      null
    );
  }, [currentBook]);

  const progressValue = useMemo(() => {
    if (!currentBook || currentBook.progress == null) return 0;
    const numeric = Number(currentBook.progress);
    if (Number.isNaN(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }, [currentBook]);

  const noteCount = currentBook?.notes ? currentBook.notes.length : 0;

  const parseNoteDate = useCallback((value) => {
    if (!value) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const lastNoteDate = useMemo(() => {
    if (!currentBook?.notes || currentBook.notes.length === 0) return null;
    return currentBook.notes.reduce((latest, note) => {
      const date = parseNoteDate(note.date);
      if (!date) return latest;
      if (!latest || date > latest) {
        return date;
      }
      return latest;
    }, null);
  }, [currentBook?.notes, parseNoteDate]);

  const formatNoteCount = useCallback((count) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'заметка';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'заметки';
    return 'заметок';
  }, []);

  const notesSummaryText = useMemo(() => {
    if (!noteCount) return 'Заметок пока нет';
    const formattedDate = lastNoteDate
      ? lastNoteDate.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : null;
    return `${noteCount} ${formatNoteCount(noteCount)}${formattedDate ? ` • обновлено ${formattedDate}` : ''}`;
  }, [noteCount, lastNoteDate, formatNoteCount]);

  const handlePrev = useCallback(() => {
    if (currentIndex <= 0) return;
    setCurrentIndex(currentIndex - 1);
  }, [currentIndex, setCurrentIndex]);

  const handleNext = useCallback(() => {
    if (!recentBooks || currentIndex >= recentBooks.length - 1) return;
    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, recentBooks, setCurrentIndex]);

  const openUploadDialog = useCallback((bookId) => {
    if (!bookId) return;
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPendingCoverFile(null);
    setUploadErrorMessage('');
    setCoverPreview(noteCoverMap[bookId] || '');
    setUploadDialogBookId(bookId);
  }, [noteCoverMap]);

  const closeUploadDialog = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setUploadDialogBookId(null);
    setPendingCoverFile(null);
    setCoverPreview('');
    setUploadErrorMessage('');
    setIsUploadingCover(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setUploadErrorMessage('Поддерживаются только изображения PNG, JPG или WebP.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadErrorMessage('Размер файла не должен превышать 5 МБ.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setPendingCoverFile(file);
    setCoverPreview(objectUrl);
    setUploadErrorMessage('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleUploadSubmit = useCallback(async () => {
    if (!uploadDialogBookId) return;
    if (!pendingCoverFile) {
      setUploadErrorMessage('Выберите изображение для загрузки.');
      return;
    }

    setIsUploadingCover(true);

    try {
      const { publicUrl } = await uploadFile(pendingCoverFile, {
        folder: 'note-covers',
        bookId: uploadDialogBookId
      });

      setNoteCoverMap((prev) => ({
        ...prev,
        [uploadDialogBookId]: publicUrl
      }));

      try {
        await updateBook(uploadDialogBookId, { notes_cover_url: publicUrl });
      } catch (updateError) {
        console.warn('Не удалось сохранить фон заметок в базе данных:', updateError);
      }

      toast.success('Фон заметок обновлён.');
      closeUploadDialog();
    } catch (error) {
      console.error('Ошибка загрузки фона заметок:', error);
      setUploadErrorMessage('Не удалось загрузить фон. Попробуйте снова.');
      toast.error('Не удалось загрузить фон заметок.');
    } finally {
      setIsUploadingCover(false);
    }
  }, [uploadDialogBookId, pendingCoverFile, closeUploadDialog]);

  const handleRemoveCover = useCallback(async () => {
    if (!uploadDialogBookId) return;
    setIsUploadingCover(true);

    try {
      setNoteCoverMap((prev) => ({
        ...prev,
        [uploadDialogBookId]: null
      }));

      try {
        await updateBook(uploadDialogBookId, { notes_cover_url: null });
      } catch (updateError) {
        console.warn('Не удалось удалить фон заметок в базе данных:', updateError);
      }

      toast.success('Фон заметок удалён.');
      closeUploadDialog();
    } catch (error) {
      console.error('Ошибка при удалении фона заметок:', error);
      setUploadErrorMessage('Не удалось удалить фон. Попробуйте снова.');
      toast.error('Не удалось удалить фон заметок.');
    } finally {
      setIsUploadingCover(false);
    }
  }, [uploadDialogBookId, closeUploadDialog]);

  const isUploadDialogOpen = uploadDialogBookId !== null;
  const existingDialogCover = uploadDialogBookId ? noteCoverMap[uploadDialogBookId] ?? null : null;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-12 text-center">
        <BookOpen className="h-12 w-12 text-destructive" aria-hidden="true" />
        <div>
          <h3 className="text-xl font-semibold text-foreground">Не удалось загрузить библиотеку</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{loadError}</p>
        </div>
        {typeof onRetry === 'function' && (
          <Button variant="outline" onClick={onRetry} className="mt-2">
            Повторить попытку
          </Button>
        )}
      </div>
    );
  }

  if (!currentBook) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <div>
          <h3 className="text-xl font-semibold text-foreground">Начните читать книги</h3>
          <p className="mt-2 text-sm text-muted-foreground">Добавьте книгу в свою библиотеку, чтобы увидеть прогресс чтения и заметки.</p>
        </div>
        <Link to={createPageUrl('Catalog')}>
          <Button>Выбрать книгу</Button>
        </Link>
      </div>
    );
  }

  if (!recentBooks || recentBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <div>
          <h3 className="text-xl font-semibold text-foreground">Начните читать книги</h3>
          <p className="mt-2 text-sm text-muted-foreground">Добавьте книгу в свою библиотеку, чтобы увидеть прогресс чтения и заметки.</p>
        </div>
        <Link to={createPageUrl('Catalog')}>
          <Button>Выбрать книгу</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <section className="relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-white shadow-sm">
          {bannerBackgroundUrl ? (
            <img
              src={bannerBackgroundUrl}
              alt={`Фоновое изображение книги «${currentBook.title}»`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background/80" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/30" aria-hidden="true" />

          <div className="relative flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 text-white/80">
              <span className="flex items-center gap-2 text-base font-semibold text-white">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Читаю сейчас
              </span>
              {recentBooks.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Предыдущая книга"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="text-white/70">
                    {Math.min(currentIndex + 1, recentBooks.length)} / {recentBooks.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex === recentBooks.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Следующая книга"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid w-full gap-6 lg:grid-cols-[auto,1fr] lg:items-end">
              <div className="flex items-start gap-4">
                <img
                  src={currentBook.cover_images?.default || currentBook.cover_url || '/api/placeholder/144/216'}
                  alt={`Обложка книги «${currentBook.title}»`}
                  width={144}
                  height={216}
                  className="h-[108px] w-[72px] rounded-lg object-cover shadow-lg ring-1 ring-black/30 sm:h-[144px] sm:w-[96px]"
                />
                <div className="flex-1 space-y-4 text-white">
                  <div>
                    <h3 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl line-clamp-2">{currentBook.title}</h3>
                    <p className="mt-2 text-sm font-medium text-white/80">{currentBook.author}</p>
                  </div>

                  <div className="space-y-3 text-sm text-white/80">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide">
                        <span>Прогресс</span>
                        <span>{progressValue}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={progressValue}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="relative h-2 w-full overflow-hidden rounded-full bg-white/30"
                      >
                        <span className="sr-only">Прочитано {progressValue}%</span>
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-white transition-all duration-500"
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                    </div>

                    <Link to={createPageUrl(`Reader?bookId=${currentBook.id}`)} className="block">
                      <Button
                        size="lg"
                        className="w-full bg-white text-black hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                        Продолжить чтение
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
          <div className="relative h-48 sm:h-56">
            {notesCoverUrl ? (
              <img
                src={notesCoverUrl}
                alt={`Фон заметок для книги «${currentBook.title}»`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : fallbackNotesCover ? (
              <img
                src={fallbackNotesCover}
                alt={`Фон по умолчанию из обложки книги «${currentBook.title}»`}
                className="absolute inset-0 h-full w-full scale-105 object-cover blur-sm"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-background/85" aria-hidden="true" />
            )}
            <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px]" aria-hidden="true" />

            <div className="relative flex h-full flex-col justify-between gap-4 p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold leading-tight sm:text-2xl">Мои заметки в этой книге</h3>
                  <p className="mt-2 text-sm text-white/85">{notesSummaryText}</p>
                </div>
                {isAuthorUser && currentBook.id && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openUploadDialog(currentBook.id)}
                    className="bg-background/75 text-foreground hover:bg-background/85"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    {notesCoverUrl ? 'Изменить фон' : 'Загрузить фон'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6">
            {noteCount > 0 ? (
              <ul className="space-y-4">
                {currentBook.notes.map((note, index) => {
                  const noteDate = parseNoteDate(note.date);
                  const formattedDate = noteDate
                    ? noteDate.toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '—';

                  return (
                    <li
                      key={`${note.page}-${index}`}
                      className="group rounded-xl border border-border/60 bg-muted/40 p-4 transition hover:border-primary/60 hover:bg-muted/60"
                    >
                      <p className="text-sm text-foreground/90 sm:text-base">{note.text}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground/80">
                          <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                          Стр. {note.page}
                        </span>
                        <span className="text-muted-foreground/80">{formattedDate}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/30 p-8 text-center">
                <StickyNote className="h-10 w-10 text-muted-foreground/70" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Заметок пока нет. Добавьте первую заметку, чтобы сохранить важные мысли.</p>
                <Link to={createPageUrl(`Reader?bookId=${currentBook.id}#notes`)}>
                  <Button variant="outline" size="sm">
                    Открыть книгу
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => (open ? null : closeUploadDialog())}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{existingDialogCover ? 'Изменить фон заметок' : 'Загрузить фон заметок'}</DialogTitle>
            <DialogDescription>
              Загрузите изображение PNG, JPG или WebP до 5 МБ. Рекомендуемое соотношение сторон — 3:1 (например, 1600×530 пикселей).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-6 text-center">
              {coverPreview ? (
                <div className="space-y-3">
                  <img
                    src={coverPreview}
                    alt="Предпросмотр фонового изображения для заметок"
                    className="mx-auto h-36 w-full max-w-2xl rounded-lg object-cover"
                  />
                  <p className="text-xs text-muted-foreground">Предпросмотр обложки заметок</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <ImagePlus className="h-10 w-10" aria-hidden="true" />
                  <p className="text-sm">Перетащите файл сюда или выберите его вручную</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                id="note-cover-upload"
                onChange={handleFileChange}
              />
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingCover}>
                  Выбрать файл
                </Button>
                {existingDialogCover && (
                  <Button type="button" variant="ghost" onClick={handleRemoveCover} disabled={isUploadingCover}>
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Удалить фон
                  </Button>
                )}
              </div>
            </div>

            {uploadErrorMessage && <p className="text-sm text-destructive">{uploadErrorMessage}</p>}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={closeUploadDialog} disabled={isUploadingCover}>
              Отмена
            </Button>
            <Button type="button" onClick={handleUploadSubmit} disabled={isUploadingCover || !pendingCoverFile}>
              {isUploadingCover ? 'Сохранение…' : 'Сохранить фон'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-muted/30 p-6">
        <div className="flex h-full flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-muted-foreground/30" />
            <div className="flex gap-4">
              <div className="h-[108px] w-[72px] animate-pulse rounded-lg bg-muted-foreground/20" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-3/4 animate-pulse rounded-full bg-muted-foreground/30" />
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted-foreground/20" />
                <div className="space-y-2">
                  <div className="h-2 w-full animate-pulse rounded-full bg-muted-foreground/20" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-muted-foreground/20" />
                </div>
              </div>
            </div>
          </div>
          <div className="h-4 w-24 animate-pulse rounded-full bg-muted-foreground/20" />
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-6">
        <div className="h-40 w-full animate-pulse rounded-2xl bg-muted-foreground/20" />
        <div className="mt-6 space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted-foreground/20" />
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-muted-foreground/20" />
          <div className="space-y-2">
            <div className="h-16 w-full animate-pulse rounded-xl bg-muted-foreground/10" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-muted-foreground/10" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-muted-foreground/10" />
          </div>
        </div>
      </div>
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
