import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Bell, ShoppingCart, User, AlertTriangle, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import BookCarousel from '../components/home/BookCarousel';
import AIRecommendationSection from '../components/home/AIRecommendationSection';
import SubscriptionBanner from '../components/home/SubscriptionBanner'; // НОВЫЙ КОМПОНЕНТ
import PersonalizedAIRecommendations from '../components/home/PersonalizedAIRecommendations'; // НОВЫЙ КОМПОНЕНТ
import { useAuth } from '../components/auth/Auth';
import { useTheme } from '../components/layout/ThemeProvider';
import { getHomePageData } from '@/api/functions';
import { createPageUrl } from '@/utils';
import { useNavigate, Link } from 'react-router-dom';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSections] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const { theme, isMobile } = useTheme();
  const navigate = useNavigate();

  const banners = [
    {
      id: 1,
      title: "Новинки недели",
      subtitle: "Свежие релизы от лучших авторов",
      buttonText: "Посмотреть",
      gradient: "from-green-600 to-green-800",
      href: createPageUrl('Catalog') + '?sort=newest'
    },
    {
      id: 2,
      title: "Бестселлеры месяца", 
      subtitle: "Самые популярные книги прямо сейчас",
      buttonText: "Читать",
      gradient: "from-purple-600 to-purple-800",
      href: createPageUrl('Catalog') + '?sort=bestseller'
    },
    {
      id: 3,
      title: "Эксклюзивная коллекция",
      subtitle: "Уникальные произведения только на KASBOOK",
      buttonText: "Исследовать", 
      gradient: "from-orange-600 to-red-800",
      href: createPageUrl('Catalog') + '?exclusive=true'
    }
  ];

  const homeSections = useMemo(() => [
    { 
      key: 'new-releases', 
      label: 'Новинки', 
      filter: { status: 'approved' },
      sort: '-created_date',
      size: 'default'
    },
    { 
      key: 'popular', 
      label: 'Популярное',
      filter: { status: 'approved' },
      sort: '-sales_count',
      size: 'portrait_large'
    },
    { 
      key: 'editors-picks', 
      label: 'Выбор редакции',
      filter: { status: 'approved', is_editors_pick: true },
      sort: '-created_date',
      size: 'landscape'
    },
    { 
      key: 'top-sales', 
      label: 'Топ продаж',
      filter: { status: 'approved' },
      sort: '-sales_count',
      size: 'portrait_large'
    },
    { 
      key: 'trending-now', 
      label: 'Читают сейчас',
      filter: { status: 'approved' },
      sort: '-likes_count',
      size: 'default'
    },
    {
      key: 'top-rated',
      label: 'Выбор читателей',
      filter: { status: 'approved' },
      sort: '-rating',
      size: 'portrait_large',
    },
    { 
      key: 'classic-literature', 
      label: 'Классика',
      filter: { status: 'approved', genres: { '$in': ['klassicheskaya-literatura'] } },
      sort: '-rating',
      size: 'landscape'
    },
    { 
      key: 'evening-reads', 
      label: 'Чтиво на вечер',
      filter: { status: 'approved', page_count: { '$lte': 150 } },
      sort: '-likes_count',
      size: 'default'
    },
    { 
      key: 'inspiring', 
      label: 'Вдохновляющее',
      filter: { status: 'approved', genres: { '$in': ['motivatsiya', 'lichnostnyy-rost', 'psikhologiya-uspekha'] } },
      sort: '-sales_count',
      size: 'portrait_large'
    },
    { 
      key: 'modern-prose', 
      label: 'Современная проза',
      filter: { status: 'approved', genres: { '$in': ['sovremennaya-proza'] } },
      sort: '-created_date',
      size: 'default'
    },
  ], []);

  const fetchAllSections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: sectionsData, error: apiError } = await getHomePageData();

      if (apiError || !sectionsData) {
        throw new Error(apiError?.message || 'Не удалось получить данные');
      }

      const results = homeSections.map(sectionConfig => ({
        ...sectionConfig,
        books: sectionsData[sectionConfig.key] || []
      }));
      
      setSections(results);

    } catch (err) {
      console.error('Error fetching sections:', err);
      setError('Не удалось загрузить секции. Попробуйте обновить страницу.');
    } finally {
      setIsLoading(false);
    }
  }, [homeSections]);

  useEffect(() => {
    fetchAllSections();
  }, [fetchAllSections]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${createPageUrl('Catalog')}?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        {/* Hero Banner - уменьшенный */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentBanner}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className={`relative bg-gradient-to-r ${banners[currentBanner].gradient} rounded-xl overflow-hidden mb-8 h-48 flex items-center`}
          >
            <div className="flex items-center w-full h-full p-6">
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBanner(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentBanner ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Перейти к баннеру ${index + 1}`}
                  />
                ))}
              </div>
              
              <div className="text-white max-w-lg">
                <Badge className="bg-white/20 text-white border-white/30 mb-2">
                  Рекомендуем
                </Badge>
                <h2 className={`font-bold mb-3 leading-tight ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                  {banners[currentBanner].title}
                </h2>
                <p className={`text-white/90 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {banners[currentBanner].subtitle}
                </p>
                <Button 
                  asChild
                  className="bg-white text-gray-700 hover:bg-white/90"
                  size={isMobile ? "sm" : "default"}
                >
                  <Link to={banners[currentBanner].href}>
                    {banners[currentBanner].buttonText}
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Sections - уменьшенные интервалы */}
        <div className="space-y-6 md:space-y-8">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : error ? (
            <div className="text-center py-8 bg-muted rounded-lg">
              <AlertTriangle className="w-8 h-8 mx-auto text-destructive mb-3" />
              <h3 className="font-semibold text-base mb-2">Ошибка загрузки</h3>
              <p className="text-muted-foreground mb-4 text-sm">{error}</p>
              <Button onClick={fetchAllSections}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Попробовать снова
              </Button>
            </div>
          ) : (
            sections.map((section, index) => (
              <React.Fragment key={section.key}>
                <BookCarousel
                  title={section.label}
                  books={section.books}
                  isLoading={false}
                  size={isMobile ? 'default' : section.size}
                />
                
                {/* НОВЫЙ БАННЕР ПОДПИСКИ после раздела "Популярное" */}
                {section.key === 'popular' && (
                  <SubscriptionBanner />
                )}
                
                {/* НОВЫЕ ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ после "Топ продаж" */}
                {section.key === 'top-sales' && isAuthenticated && (
                  <PersonalizedAIRecommendations user={user} />
                )}
              </React.Fragment>
            ))
          )}
        </div>
        
        {/* AI Recommendations - уменьшенный отступ */}
        <div className="mt-8 md:mt-12">
          <AIRecommendationSection />
        </div>
      </div>
    </div>
  );
}