import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Star, TrendingUp } from 'lucide-react';

const BookCarouselItem = ({ book, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay: index * 0.05 }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="flex-none w-48 mr-4"
  >
    <Card className="overflow-hidden h-full shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardContent className="p-0">
        <div className="relative">
          <img 
            src={book.cover_url} 
            alt={book.title}
            className="w-full h-64 object-cover"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-800 text-xs">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {book.rating}
            </Badge>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-1 line-clamp-1">{book.title}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{book.author}</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#4CAF50] text-sm">{book.price_kas} KAS</span>
            <span className="text-xs text-gray-500">{book.likes} ❤️</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const AuthorCarouselItem = ({ author, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay: index * 0.05 }}
    whileHover={{ scale: 1.05 }}
    className="flex-none w-48 mr-4"
  >
    <Card className="overflow-hidden h-full shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardContent className="p-4 text-center">
        <img 
          src={author.avatar} 
          alt={author.name}
          className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
          loading="lazy"
        />
        <h3 className="font-semibold text-sm mb-1">{author.name}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{author.bio}</p>
        <Badge variant="outline" className="text-xs">
          <TrendingUp className="w-3 h-3 mr-1" />
          {author.totalSales} продаж
        </Badge>
      </CardContent>
    </Card>
  </motion.div>
);

const SkeletonItem = () => (
  <div className="flex-none w-48 mr-4">
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0">
        <Skeleton className="w-full h-64" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function HorizontalCarousel({ title, subtitle, items, type, loading }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const itemWidth = 200; // width + margin
  const maxScroll = Math.max(0, (items.length * itemWidth) - (4 * itemWidth));

  const scrollLeft = () => {
    setScrollPosition(prev => Math.max(0, prev - itemWidth * 2));
  };

  const scrollRight = () => {
    setScrollPosition(prev => Math.min(maxScroll, prev + itemWidth * 2));
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={scrollLeft}
            disabled={scrollPosition === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={scrollRight}
            disabled={scrollPosition >= maxScroll}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${scrollPosition}px)` }}
        >
          {loading ? (
            Array(12).fill(0).map((_, i) => <SkeletonItem key={i} />)
          ) : (
            items.map((item, index) => (
              type === 'authors' ? (
                <AuthorCarouselItem key={item.id} author={item} index={index} />
              ) : (
                <BookCarouselItem key={item.id} book={item} index={index} />
              )
            ))
          )}
        </div>
      </div>
    </div>
  );
}