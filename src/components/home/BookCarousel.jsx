
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import BookCard from './BookCard';
import { toast } from 'sonner';

export default function BookCarousel({ title, books = [], isLoading = false, size = 'default' }) {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

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

  const basisClasses = {
    default: 'basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6',
    portrait_large: 'basis-1/2 sm:basis-1/3 md:basis-1/3 lg:basis-1/5',
    landscape: 'basis-full sm:basis-1/2 lg:basis-1/3',
    square: 'basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5'
  };

  const currentBasis = basisClasses[size] || basisClasses.default;
  const carouselPadding = size === 'landscape' ? 'px-1' : 'px-0';

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, j) => (
            <div key={j} className="space-y-2">
              <Skeleton className={`w-full rounded-lg ${
                size === 'landscape' ? 'aspect-video' : 'aspect-[2/3]'
              }`} />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className={`flex items-center justify-between ${carouselPadding}`}>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Смотреть все
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Carousel - адаптированный для мобильных */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            skipSnaps: false,
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className={`-ml-4 ${carouselPadding}`}>
            {books.map((book, index) => (
              <CarouselItem 
                key={`${book.id}-${size}-${index}`} 
                className={`pl-4 ${currentBasis}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                >
                  <BookCard 
                    book={book}
                    size={size}
                    onAddToWishlist={handleAddToWishlist}
                    className="h-full"
                  />
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className={`kasbook-rounded-full ml-2 sm:ml-4 border-border bg-card hover:bg-muted ${size === 'landscape' ? 'top-1/3' : 'top-1/2'}`} />
          <CarouselNext className={`kasbook-rounded-full mr-2 sm:mr-4 border-border bg-card hover:bg-muted ${size === 'landscape' ? 'top-1/3' : 'top-1/2'}`} />
        </Carousel>
      </motion.div>
    </section>
  );
}
