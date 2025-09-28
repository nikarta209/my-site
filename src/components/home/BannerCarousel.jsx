import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, BookOpen, Users, Zap } from 'lucide-react';

export default function BannerCarousel() {
  const [carouselApi, setCarouselApi] = React.useState(null);

  React.useEffect(() => {
    if (!carouselApi) return;

    const interval = setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselApi]);

  const banners = [
    {
      key: 'author',
      title: 'До 90% роялти авторам!',
      description: 'Публикуйте свои произведения и получайте максимальный доход с каждой продажи.',
      buttonText: 'Стать автором',
      link: 'https://author.kasbook.io',
      icon: Users,
      gradient: 'from-black/80 via-orange-900/60 to-orange-500/40'
    },
    {
      key: 'catalog',
      title: 'Откройте мир знаний',
      description: 'Тысячи книг в вашем распоряжении. Начните читать сегодня!',
      buttonText: 'В каталог',
      link: createPageUrl('Catalog'),
      icon: BookOpen,
      gradient: 'from-black/80 via-purple-900/60 to-purple-500/40'
    },
    {
      key: 'ecosystem',
      title: 'Экосистема на KAS',
      description: 'Покупайте и продавайте книги с помощью быстрой и надежной криптовалюты.',
      buttonText: 'Подробнее',
      link: '#',
      icon: Zap,
      gradient: 'from-black/80 via-blue-900/60 to-indigo-500/40'
    },
  ];

  return (
    <div className="relative mb-8">
      <Carousel
        setApi={setCarouselApi}
        className="w-full"
        opts={{ loop: true }}
      >
        <CarouselContent>
          {banners.map((banner, index) => {
            const IconComponent = banner.icon;
            return (
              <CarouselItem key={index}>
                <motion.div 
                  className="relative w-full h-64 sm:h-80 md:h-96 kasbook-rounded-xl overflow-hidden shadow-xl"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=1500)` 
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient}`} />
                  
                  {/* Content - Адаптивный для мобильных */}
                  <div className="relative z-10 flex items-center justify-center h-full text-center text-white p-4 sm:p-8">
                    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                      <motion.div 
                        className="mb-3 sm:mb-6"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                      >
                        <IconComponent className="w-8 h-8 sm:w-12 md:w-16 sm:h-12 md:h-16 mx-auto mb-2 sm:mb-4 opacity-90" />
                      </motion.div>
                      
                      <motion.h1 
                        className="text-xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 sm:mb-6 leading-tight"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        {banner.title}
                      </motion.h1>
                      
                      <motion.p 
                        className="text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-4 sm:mb-8 opacity-90 leading-relaxed px-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                      >
                        {banner.description}
                      </motion.p>
                      
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                      >
                        <Button 
                          asChild 
                          size="lg" 
                          className="kasbook-btn-primary text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 kasbook-rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {banner.link.startsWith('http') ? (
                            <a 
                              href={banner.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              {banner.buttonText}
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </a>
                          ) : (
                            <Link to={banner.link} className="flex items-center gap-2">
                              {banner.buttonText}
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Link>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        <CarouselPrevious className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 hidden md:flex bg-white/20 hover:bg-white/30 border-white/30 text-white kasbook-rounded-full" />
        <CarouselNext className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 hidden md:flex bg-white/20 hover:bg-white/30 border-white/30 text-white kasbook-rounded-full" />
      </Carousel>
      
      {/* Indicators */}
      <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className="w-2 h-2 sm:w-3 sm:h-3 kasbook-rounded-full bg-muted-foreground/30 hover:bg-primary transition-colors duration-200"
            onClick={() => carouselApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}