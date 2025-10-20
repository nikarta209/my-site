
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Eye,
  Share2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Clock,
  BookOpen,
  Users,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Gift,
  Play,
  Bot // Added Bot icon
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useTranslation, useDynamicTranslation } from '../components/i18n/SimpleI18n';
import { useCart } from '../components/cart/CartContext';
import { toast } from 'sonner';
import { Book } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { Review } from '@/api/entities';
import { useAuth } from '../components/auth/Auth';
import ReviewsSection from '../components/book/ReviewsSection';
import BookCarousel from '../components/home/BookCarousel';
import { getBookCoverUrl } from '@/lib/books/coverImages';
import PartialStar from '../components/book/PartialStar'; // Импортируем новый компонент
import { useExchangeRate } from '../components/utils/ExchangeRateContext'; // Импортируем хук курса
import { supabase } from '@/api/supabaseClient';

function parseMaybeJSON(v) {
  if (!v) return v;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
}

function parsePgArray(str) {
  if (!str || Array.isArray(str)) return str || [];
  // {"a","b"} -> ["a","b"]
  return String(str)
    .replace(/^{|}$/g, '')
    .split(',')
    .map(s => s.replace(/^"|"$/g, '').trim())
    .filter(Boolean);
}

// Преобразование книги к удобному для UI виду
function normalizeBook(raw) {
  const languages = parseMaybeJSON(raw.languages) || [];
  const cover_images = parseMaybeJSON(raw.cover_images) || {};
  const genres = parsePgArray(raw.genres);

  const price_kas = raw?.price_kas != null ? Number(raw.price_kas) : null;
  const price_usd = raw?.price_usd != null ? Number(raw.price_usd) : null;

  return { ...raw, languages, cover_images, genres, price_kas, price_usd };
}

// Выбор описания: локализованное > общее
function pickDescription(book, getCurrentLang = () => (navigator.language || 'ru').slice(0, 2)) {
  const lang = getCurrentLang();
  const loc = Array.isArray(book.languages)
    ? (book.languages.find(l => l?.lang === lang) || book.languages[0])
    : null;

  return (loc && loc.description) || book.description || '';
}

// Формирование подписи цены
function formatPrice(book) {
  const parts = [];
  if (typeof book.price_kas === 'number' && !Number.isNaN(book.price_kas)) {
    parts.push(`${book.price_kas} KAS`);
  }
  if (book.is_usd_fixed && typeof book.price_usd === 'number' && !Number.isNaN(book.price_usd)) {
    parts.push(`$${book.price_usd}`);
  }
  return parts.join(' · ');
}

function AIEvaluation({ text }) {
  const { translatedText, isLoading } = useDynamicTranslation(text);

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="w-5 h-5 text-primary" />
          <span>Анализ от ИИ</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            "{translatedText}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}


export default function BookDetails() {
  const { id } = useParams();
  const location = useLocation();
  const locationStateBook = location.state?.book ?? null;

  const [book, setBook] = useState(
    locationStateBook ? normalizeBook(locationStateBook) : null
  );
  const [reviews, setReviews] = useState([]);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(!locationStateBook);
  const [error, setError] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('text');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { language, t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { kasRate } = useExchangeRate(); // Получаем актуальный курс

  useEffect(() => {
    if (locationStateBook && locationStateBook.id === id) {
      setBook(normalizeBook(locationStateBook));
      setIsLoading(false);
      setError(null);
    }
  }, [id, locationStateBook]);

  useEffect(() => {
    if (!id) {
      setError('Идентификатор книги не указан');
      setIsLoading(false);
      return;
    }

    if (book && book.id !== id) {
      setBook(null);
      return;
    }

    let ignore = false;

    async function load() {
      if (book) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) {
          throw new Error('Книга не найдена');
        }

        if (!ignore) {
          setBook(normalizeBook(data));
        }
      } catch (e) {
        if (!ignore) {
          const message = e?.message || 'Не удалось загрузить книгу';
          setBook(null);
          setError(message);
          setReviews([]);
          setSimilarBooks([]);
          setIsPurchased(false);
          toast.error(`Ошибка загрузки: ${message}`);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [id, book]);

  useEffect(() => {
    let cancelled = false;

    async function loadRelatedData() {
      if (!book || !id) {
        return;
      }

      if (isAuthenticated && user) {
        try {
          const purchases = await Purchase.filter({
            book_id: id,
            buyer_email: user.email
          });
          if (!cancelled) {
            setIsPurchased(purchases.length > 0);
          }
        } catch (err) {
          console.warn('Не удалось проверить покупку:', err);
        }
      } else if (!cancelled) {
        setIsPurchased(false);
      }

      try {
        const bookReviews = await Review.filter({
          book_id: id,
          status: 'approved'
        }, '-created_date', 20);
        if (!cancelled) {
          setReviews(bookReviews || []);
        }
      } catch (err) {
        console.warn('Не удалось загрузить отзывы:', err);
        if (!cancelled) {
          setReviews([]);
        }
      }

      try {
        if (book?.genre) {
          const similar = await Book.filter({
            status: 'approved',
            genre: book.genre,
            id: { '$ne': id }
          }, '-rating', 10);
          if (!cancelled) {
            setSimilarBooks(similar || []);
          }
        } else if (!cancelled) {
          setSimilarBooks([]);
        }
      } catch (err) {
        console.warn('Не удалось загрузить похожие книги:', err);
        if (!cancelled) {
          setSimilarBooks([]);
        }
      }
    }

    loadRelatedData();

    return () => {
      cancelled = true;
    };
  }, [book, id, isAuthenticated, user]);

  const descriptionText = useMemo(() => (
    book
      ? pickDescription(book, () => {
          const resolved = typeof language === 'string' && language
            ? language
            : (typeof navigator !== 'undefined' && navigator.language) || 'ru';
          return resolved.slice(0, 2);
        })
      : ''
  ), [book, language]);

  const priceLabel = useMemo(() => (book ? formatPrice(book) : ''), [book]);

  const kasPriceValue = useMemo(() => {
    if (!book || typeof book.price_kas !== 'number' || Number.isNaN(book.price_kas)) {
      return null;
    }
    return book.price_kas;
  }, [book]);

  const hasLongDescription = Boolean(descriptionText && descriptionText.length > 500);

  const handleAddToCart = () => {
    if (book) {
      addToCart(book);
      toast.success('Книга добавлена в корзину');
    }
  };

  const handleReadBook = () => {
    if (!book) return;
    const url = createPageUrl(`Reader?bookId=${book.id}${!isPurchased ? '&preview=true' : ''}`);
    window.location.href = url;
  };

  const handleRetry = () => {
    setError(null);
    setBook(null);
    setReviews([]);
    setSimilarBooks([]);
    setIsPurchased(false);
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative h-96">
          <Skeleton className="absolute inset-0" />
        </div>
        <div className="container mx-auto px-4 py-8 -mt-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="aspect-[2/3] w-full max-w-sm mx-auto" />
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Книга не найдена'}</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Link to={createPageUrl('Catalog')}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к каталогу
            </Button>
          </Link>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  // --- ЛОГИКА ВЫБОРА ОБЛОЖЕК ---
  const placeholderUrl = `https://picsum.photos/400/600?random=${book.id}`;
  const mainCoverUrl = getBookCoverUrl(book, { variant: 'portrait', fallback: placeholderUrl });
  const bannerImageUrl =
    getBookCoverUrl(book, { variant: 'landscape', fallback: null }) ||
    getBookCoverUrl(book, { variant: 'banner', fallback: null }) ||
    mainCoverUrl;

  return (
    <div className="min-h-screen bg-background">
      {/* Blurred Background Header - теперь использует широкоформатную обложку */}
      <div 
        className="relative h-96 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${bannerImageUrl})` 
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Header Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-40">
          <div className="absolute top-4 left-4">
            <Link to={createPageUrl('Catalog')}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад к каталогу
              </Button>
            </Link>
          </div>
          
          <motion.div 
            className="max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {book.title}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-6">
              {book.author}
            </p>
            
            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {(book.genres || []).map(genre => (
                <Badge key={genre} variant="secondary" className="bg-white/20 text-white border-white/30">
                  {t(`genres.${genre}`, {}, genre)}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Book Cover - теперь использует стандартную обложку */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="kasbook-card p-6 bg-card/95 backdrop-blur-sm">
              <img
                src={mainCoverUrl}
                alt={book.title}
                className="w-full kasbook-rounded-lg shadow-2xl mb-6"
                onError={(e) => {
                  e.target.src = placeholderUrl;
                }}
              />

              {/* Gradient Price Block */}
              <motion.div
                className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-center shadow-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-white">
                  <div className="text-2xl font-bold mb-1">
                    {priceLabel || '—'}
                  </div>
                  <div className="text-white/80 text-sm">
                    {kasPriceValue != null
                      ? `≈ $${typeof kasRate === 'number'
                        ? (kasPriceValue * kasRate).toFixed(2)
                        : (kasPriceValue * 0.05).toFixed(2)} USD`
                      : '—'}
                  </div>
                </div>
              </motion.div>

              {/* Format Tabs */}
              <Tabs value={selectedFormat} onValueChange={setSelectedFormat} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Текст
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    <Play className="w-4 h-4 mr-2" />
                    Аудио
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Ratings Section */}
              <motion.div 
                className="mb-6 space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                {/* User Rating */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <PartialStar rating={book.rating || 0} size={20} />
                    <span className="text-sm font-medium">Пользователи</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-500 text-lg">
                      {book.rating ? book.rating.toFixed(1) : '0.0'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {book.reviews_count || 0} отзывов
                    </div>
                  </div>
                </div>

                {/* AI Rating */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium">Оценка ИИ</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-600 text-lg">
                      {book.ai_rating ? book.ai_rating.toFixed(1) : '0.0'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Анализ качества
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats - оставляем остальную статистику */}
              <motion.div 
                className="grid grid-cols-2 gap-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Eye className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-semibold text-muted-foreground">
                    {book.sales_count || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Продаж
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-semibold text-muted-foreground">
                    {new Date(book.created_date).getFullYear()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Год
                  </div>
                </div>
              </motion.div>

              {/* Desktop Action Buttons */}
              <div className="hidden lg:block space-y-3">
                <Button 
                  size="lg" 
                  className="w-full bg-purple-600 hover:bg-purple-700" 
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  В корзину
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleReadBook}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  {isPurchased ? 'Читать книгу' : 'Фрагмент Бесплатно'}
                </Button>
                <Button 
                  size="lg" 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  В подарок
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Book Details */}
          <div className="lg:col-span-2">
            {book.ai_evaluation_text && (
              <div className="mb-8">
                <AIEvaluation text={book.ai_evaluation_text} />
              </div>
            )}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="description">Описание</TabsTrigger>
                <TabsTrigger value="reviews">Отзывы</TabsTrigger>
                <TabsTrigger value="quotes">Цитаты</TabsTrigger>
                <TabsTrigger value="similar">Похожие</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className={`transition-all duration-300 ${!isDescriptionExpanded ? 'line-clamp-6' : ''}`}>
                        <p className="text-muted-foreground leading-relaxed">
                          {descriptionText || 'Описание отсутствует.'}
                        </p>
                      </div>

                      {hasLongDescription && (
                        <Button
                          variant="ghost"
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="flex items-center gap-1 text-primary"
                        >
                          {isDescriptionExpanded ? (
                            <>Свернуть <ChevronUp className="w-4 h-4" /></>
                          ) : (
                            <>Развернуть <ChevronDown className="w-4 h-4" /></>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-0">
                <ReviewsSection bookId={id} initialReviews={reviews} />
              </TabsContent>
              
              <TabsContent value="quotes" className="mt-0">
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Цитаты появятся здесь после того, как читатели начнут делиться ими</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="similar" className="mt-0">
                {similarBooks.length > 0 ? (
                  <BookCarousel title="Похожие книги" books={similarBooks} />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">Похожие книги не найдены</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Buttons */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 safe-area-inset-bottom">
        <div className="flex gap-3">
          <Button 
            className="flex-1 bg-purple-600 hover:bg-purple-700" 
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            В корзину
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleReadBook}
          >
            <Eye className="w-4 h-4 mr-2" />
            Фрагмент Бесплатно
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Gift className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Safe area for mobile buttons */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
