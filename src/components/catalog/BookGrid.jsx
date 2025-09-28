
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Heart, Star, Eye, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function BookGrid({
  books,
  isLoading,
  viewMode = 'grid',
  onAddToCart,
  onAddToWishlist,
  onPreview,
  linkToReader = false
}) {
  const getGridCols = (mode) => {
    switch (mode) {
      case 'list': return 'grid-cols-1';
      case 'compact': return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3';
      default: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6';
    }
  };

  if (isLoading) {
    return (
      <div className={`grid ${getGridCols(viewMode)}`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="w-full aspect-[2/3] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <h3 className="text-lg font-semibold mb-2">Книги не найдены</h3>
        <p className="text-muted-foreground text-sm">
          Попробуйте изменить фильтры поиска или сбросить их.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={`grid ${getGridCols(viewMode)}`}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
      initial="hidden"
      animate="show"
    >
      {books.map(book => (
        <motion.div
          key={book.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          <BookCard
            book={book}
            onAddToCart={onAddToCart}
            onAddToWishlist={onAddToWishlist}
            onPreview={onPreview}
            targetLink={linkToReader ? createPageUrl(`Reader?bookId=${book.id}`) : undefined}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Минималистичная карточка для каталога
function BookCard({ book, onAddToCart, onAddToWishlist, onPreview, targetLink }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('kasbook_wishlist') || '[]');
      setIsWishlisted(wishlist.some(item => item.id === book.id));
    } catch (error) {
      console.error('Ошибка чтения избранного:', error);
    }
  }, [book.id]);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      let wishlist = JSON.parse(localStorage.getItem('kasbook_wishlist') || '[]');
      const isAlreadyInWishlist = wishlist.some(item => item.id === book.id);

      if (isAlreadyInWishlist) {
        wishlist = wishlist.filter(item => item.id !== book.id);
        toast.success(`"${book.title}" удалена из избранного.`);
        setIsWishlisted(false);
      } else {
        wishlist.push(book);
        toast.success(`"${book.title}" добавлена в избранное!`);
        setIsWishlisted(true);
      }
      localStorage.setItem('kasbook_wishlist', JSON.stringify(wishlist));
      onAddToWishlist?.(book);
    } catch (error) {
      console.error('Ошибка добавления/удаления из избранного:', error);
      toast.error('Не удалось обновить избранное');
    }
  };

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(book);
  };

  const handlePreviewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPreview?.(book);
  };

  return (
    <Link
      to={targetLink || createPageUrl(`BookDetails?id=${book.id}`)}
      className="group block relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Обложка книги */}
        <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 aspect-[2/3]">
          <img
            src={book.cover_url || `https://picsum.photos/seed/${book.id}/300/450`}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Action buttons on cover */}
          <div className={`absolute top-2 right-2 flex flex-col gap-1 transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <button
              onClick={handleWishlistClick}
              className={`p-1.5 rounded-full transition-all duration-200 shadow-sm ${
                isWishlisted
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
              }`}
              title={isWishlisted ? "Удалить из избранного" : "Добавить в избранное"}
            >
              <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
            {onPreview && (
              <button
                onClick={handlePreviewClick}
                className="p-1.5 rounded-full bg-white/90 text-gray-600 hover:bg-white hover:text-primary transition-all duration-200 shadow-sm"
                title="Предпросмотр"
              >
                <Eye className="w-3 h-3" />
              </button>
            )}
          </div>

          {onAddToCart && (
            <button
              onClick={handleAddToCartClick}
              className={`absolute bottom-2 left-1/2 -translate-x-1/2 p-2 px-4 bg-primary text-primary-foreground rounded-full text-xs font-semibold transition-all duration-200 shadow-lg whitespace-nowrap
                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <ShoppingCart className="inline-block w-3 h-3 mr-1" /> Добавить в корзину
            </button>
          )}

        </div>

        {/* Информация о книге */}
        <div className="mt-2 space-y-0.5">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {book.author}
          </p>

          {/* Только рейтинг пользователей */}
          {book.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-muted-foreground font-medium">
                {book.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
