
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Star, 
  BookOpen, 
  Heart, 
  Award,
  Clock,
  Coffee,
  Zap,
  Crown,
  Filter
} from 'lucide-react';
import { useAuth } from '../components/auth/Auth';
import { useTheme } from '../components/layout/ThemeProvider'; // Import useTheme
import { Book } from '@/api/entities';
import BookCarousel from '../components/home/BookCarousel';
import { toast } from 'sonner';

const AI_SECTIONS = [
  { 
    key: 'new-releases', 
    label: 'Новинки', 
    subtitle: 'новые релизы',
    filter: { status: 'approved' },
    sort: '-created_date',
    size: 'default',
    icon: Sparkles,
    color: 'from-blue-500 to-purple-600'
  },
  { 
    key: 'popular', 
    label: 'Популярное',
    subtitle: 'самые скачиваемые',
    filter: { status: 'approved' },
    sort: '-sales_count',
    size: 'portrait_large',
    icon: TrendingUp,
    color: 'from-green-500 to-teal-600'
  },
  { 
    key: 'top-sales', 
    label: 'Топ продаж',
    subtitle: 'хиты недели / месяца',
    filter: { status: 'approved' },
    sort: '-sales_count',
    size: 'default',
    icon: Crown,
    color: 'from-yellow-500 to-orange-600'
  },
  { 
    key: 'trending-now', 
    label: 'Читают сейчас',
    subtitle: 'в тренде',
    filter: { status: 'approved' },
    sort: '-likes_count',
    size: 'portrait_large',
    icon: Zap,
    color: 'from-pink-500 to-red-600'
  },
  { 
    key: 'top-rated', 
    label: 'Выбор читателей',
    subtitle: 'основано на рейтингах и отзывах',
    filter: { status: 'approved' },
    sort: '-rating',
    size: 'landscape',
    icon: Heart,
    color: 'from-red-500 to-pink-600'
  },
  { 
    key: 'editors-picks', 
    label: 'Выбор редакции',
    subtitle: 'кураторские подборки',
    filter: { status: 'approved', is_editors_pick: true },
    sort: '-created_date',
    size: 'default',
    icon: Award,
    color: 'from-purple-500 to-indigo-600'
  },
  { 
    key: 'bestsellers', 
    label: 'Бестселлеры',
    subtitle: 'проверенные хиты',
    filter: { status: 'approved', sales_count: { '$gte': 100 } },
    sort: '-sales_count',
    size: 'portrait_large',
    icon: Star,
    color: 'from-amber-500 to-yellow-600'
  },
  { 
    key: 'evening-reads', 
    label: 'Чтиво на вечер',
    subtitle: 'короткие книги, рассказы',
    filter: { status: 'approved', page_count: { '$lte': 150 } },
    sort: '-rating',
    size: 'default',
    icon: Coffee,
    color: 'from-orange-500 to-amber-600'
  },
  { 
    key: 'inspiring', 
    label: 'Вдохновляющее',
    subtitle: 'для настроения',
    filter: { status: 'approved', genres: { '$in': ['lichnostnyy-rost', 'motivatsiya', 'psikhologiya-uspekha'] } },
    sort: '-rating',
    size: 'landscape',
    icon: Sparkles,
    color: 'from-teal-500 to-cyan-600'
  },
  { 
    key: 'classic-literature', 
    label: 'Классика',
    subtitle: 'вечные произведения',
    filter: { status: 'approved', genres: { '$in': ['klassicheskaya-literatura'] } },
    sort: '-rating',
    size: 'portrait_large',
    icon: BookOpen,
    color: 'from-gray-600 to-gray-800'
  },
  { 
    key: 'modern', 
    label: 'Современное',
    subtitle: 'актуальные авторы и темы',
    filter: { status: 'approved', genres: { '$in': ['sovremennaya-proza'] } },
    sort: '-created_date',
    size: 'default',
    icon: Clock,
    color: 'from-indigo-500 to-blue-600'
  },
];

export default function AIRecommendations() {
  const { user, isAuthenticated } = useAuth();
  const { isMobile } = useTheme(); // Get isMobile from useTheme
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAISections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sectionPromises = AI_SECTIONS.map(async (section) => {
        try {
          const books = await Book.filter(section.filter, section.sort, 20);
          return {
            ...section,
            books: books || []
          };
        } catch (err) {
          console.warn(`Failed to load section ${section.key}:`, err);
          return {
            ...section,
            books: []
          };
        }
      });

      const loadedSections = await Promise.all(sectionPromises);
      setSections(loadedSections.filter(section => section.books.length > 0));
      
    } catch (err) {
      console.error('Error loading AI sections:', err);
      setError('Не удалось загрузить рекомендации. Попробуйте обновить страницу.');
      toast.error('Ошибка загрузки рекомендаций');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAISections();
  }, [loadAISections]);

  const handleAddToWishlist = (book) => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('kasbook_wishlist') || '[]');
      const isAlreadyInWishlist = wishlist.some(item => item.id === book.id);

      if (isAlreadyInWishlist) {
        toast.info(`"${book.title}" уже в избранном`);
      } else {
        wishlist.push(book);
        localStorage.setItem('kasbook_wishlist', JSON.stringify(wishlist));
        toast.success(`"${book.title}" добавлена в избранное!`);
      }
    } catch (error) {
      console.error('Ошибка добавления в избранное:', error);
      toast.error('Не удалось добавить в избранное');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="text-center py-16">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
          </div>
          
          {/* Sections Skeleton */}
          <div className="space-y-16">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground/50 mb-6" />
          <h2 className="text-2xl font-bold mb-4">Не удалось загрузить рекомендации</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={loadAISections}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-border">
        <div className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              ИИ-подборки
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Персональные рекомендации и кураторские подборки, созданные с помощью искусственного интеллекта 
              {isAuthenticated ? ` специально для вас, ${user?.full_name?.split(' ')[0] || 'читатель'}` : ''}
            </p>
            
            <div className="flex items-center justify-center gap-2 mt-6">
              <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <Filter className="w-3 h-3 mr-1" />
                {sections.length} подборок
              </Badge>
              <Badge variant="outline">
                Обновляется ежедневно
              </Badge>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sections */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-16">
          <AnimatePresence>
            {sections.map((section, index) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {section.label}
                      </h2>
                      <p className="text-muted-foreground">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <BookCarousel
                  title=""
                  books={section.books}
                  isLoading={false}
                  size={isMobile ? 'default' : section.size}
                  onAddToWishlist={handleAddToWishlist}
                  showViewAll={false}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Call to Action */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-20 text-center"
          >
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-12 border border-purple-200/50 dark:border-purple-800/50">
              <Brain className="w-16 h-16 mx-auto text-purple-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4">
                Получайте персональные рекомендации
              </h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Войдите в систему, чтобы получать рекомендации на основе ваших покупок и предпочтений
              </p>
              <Button
                onClick={() => window.location.href = '/api/auth/login'}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Brain className="w-5 h-5 mr-2" />
                Войти для персонализации
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
