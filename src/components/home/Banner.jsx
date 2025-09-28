import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  BookOpen, 
  Sparkles,
  TrendingUp,
  Crown,
  Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '../auth/Auth';

export default function Banner({ banners = [], className = '' }) {
  const { user } = useAuth();
  const [currentBanner, setCurrentBanner] = useState(0);

  // Default banners if none provided
  const defaultBanners = [
    {
      id: 'welcome',
      type: 'personalized',
      title: user ? `Добро пожаловать, ${user.full_name?.split(' ')[0] || 'читатель'}!` : 'Добро пожаловать в KASBOOK',
      subtitle: user ? 'Ваши персональные рекомендации ждут вас' : 'Откройте мир книг на блокчейне',
      cta: 'Начать чтение',
      href: user ? createPageUrl('Library') : createPageUrl('Catalog'),
      gradient: 'from-purple-600 via-blue-600 to-purple-800',
      icon: user ? Heart : BookOpen,
      accentColor: '#FF6B00'
    },
    {
      id: 'trending',
      type: 'promotional',
      title: '🔥 Горячие новинки недели',
      subtitle: 'Самые популярные книги от лучших авторов',
      cta: 'Посмотреть',
      href: createPageUrl('Catalog') + '?sort=trending',
      gradient: 'from-orange-500 via-red-500 to-pink-600',
      icon: TrendingUp,
      badge: 'HOT',
      accentColor: '#FFD700'
    },
    {
      id: 'premium',
      type: 'premium',
      title: '👑 Эксклюзивная коллекция',
      subtitle: 'Премиум-контент для истинных ценителей',
      cta: 'Открыть коллекцию',
      href: createPageUrl('Catalog') + '?premium=true',
      gradient: 'from-yellow-600 via-amber-600 to-orange-600',
      icon: Crown,
      badge: 'PREMIUM',
      accentColor: '#FF6B00'
    }
  ];

  const activeBanners = banners.length > 0 ? banners : defaultBanners;
  const currentBannerData = activeBanners[currentBanner];

  const nextBanner = useCallback(() => {
    setCurrentBanner((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const prevBanner = useCallback(() => {
    setCurrentBanner((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  // Auto-rotate banners
  React.useEffect(() => {
    if (activeBanners.length <= 1) return;
    
    const interval = setInterval(nextBanner, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length, nextBanner]);

  const bannerVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const IconComponent = currentBannerData.icon;

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div 
          className={`relative h-64 md:h-80 bg-gradient-to-r ${currentBannerData.gradient} flex items-center overflow-hidden`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 400 400">
              <defs>
                <pattern id="books" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <BookOpen x="10" y="10" width="20" height="20" fill="white" opacity="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#books)" />
            </svg>
          </div>

          {/* Navigation Arrows */}
          {activeBanners.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevBanner}
                className="absolute left-4 z-10 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="Предыдущий баннер"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextBanner}
                className="absolute right-4 z-10 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="Следующий баннер"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </motion.button>
            </>
          )}

          {/* Banner Content */}
          <AnimatePresence mode="wait" custom={currentBanner}>
            <motion.div
              key={currentBanner}
              custom={currentBanner}
              variants={bannerVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="w-full px-8 md:px-16 flex items-center justify-between"
            >
              {/* Left Content */}
              <div className="flex-1 text-white space-y-4 max-w-2xl">
                {/* Badge */}
                {currentBannerData.badge && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge 
                      className="bg-white/20 text-white border-white/30 text-xs font-bold px-3 py-1"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {currentBannerData.badge}
                    </Badge>
                  </motion.div>
                )}

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
                >
                  {currentBannerData.title}
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg md:text-xl max-w-lg"
                >
                  {currentBannerData.subtitle}
                </motion.p>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    asChild
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-white/90 font-semibold text-lg px-8 py-4 min-h-[48px] rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{
                      boxShadow: `0 4px 20px ${currentBannerData.accentColor}40`
                    }}
                  >
                    <Link to={currentBannerData.href}>
                      {currentBannerData.cta}
                      <IconComponent className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </motion.div>
              </div>

              {/* Right Illustration */}
              <div className="hidden md:block">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="w-48 h-48 relative"
                >
                  {/* Floating Books */}
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute top-0 left-8 w-20 h-24 bg-white/20 rounded-lg backdrop-blur-sm"
                  />
                  
                  <motion.div
                    animate={{ 
                      y: [0, 15, 0],
                      rotate: [0, -3, 0]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute top-12 right-4 w-16 h-20 bg-white/15 rounded-lg backdrop-blur-sm"
                  />

                  <motion.div
                    animate={{ 
                      y: [0, -8, 0],
                      rotate: [0, 2, 0]
                    }}
                    transition={{ 
                      duration: 3.5, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    className="absolute bottom-8 left-0 w-18 h-22 bg-white/25 rounded-lg backdrop-blur-sm"
                  />

                  {/* Central Icon */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <IconComponent className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {activeBanners.map((_, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-3 h-3 rounded-full transition-all min-w-[48px] min-h-[48px] flex items-center justify-center ${
                    index === currentBanner 
                      ? 'bg-white' 
                      : 'bg-white/50'
                  }`}
                  aria-label={`Перейти к баннеру ${index + 1}`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    index === currentBanner ? 'bg-gray-900' : 'bg-white'
                  }`} />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Reduced Motion Support */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .banner-motion,
          .banner-motion * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </Card>
  );
}