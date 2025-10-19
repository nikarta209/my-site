import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card'; // Card and CardContent are still imported but not directly used in the new return structure
import { Badge } from '@/components/ui/badge'; // Badge is still imported but not directly used in the new return structure
import { Button } from '@/components/ui/button'; // Button is still imported but not directly used in the new return structure
import { Star, Heart, ShoppingCart, Eye, Plus, Bot, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth, useSubscription } from '../auth/Auth';
import { UserBookRating } from '@/api/entities';
import { getPersonalizedReview } from '@/api/functions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getBookCoverUrl } from '@/lib/books/coverImages';
// Assuming 'sonner' for toasts, if not available, change to console.log
// import { toast } from 'sonner';

export default function BookCard({ 
  book, 
  size = 'default', 
  onAddToCart, 
  onAddToWishlist,
  className = "" 
}) {
  // Removed: isWishlisted, isHovered states as the UI elements depending on them are removed in the new outline.
  const { user, isAuthenticated } = useAuth();
  const subscription = useSubscription();
  const [personalRating, setPersonalRating] = useState(null);
  const [showPersonalReview, setShowPersonalReview] = useState(false);
  const [personalReview, setPersonalReview] = useState('');
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  // ИСПРАВЛЕНО: Правильная логика выбора обложки из outline
  const getCoverUrl = useCallback((targetSize) => {
    if (!book) {
      return `https://picsum.photos/300/450?random=${Math.random()}`;
    }

    const variantMap = {
      landscape: 'landscape',
      portrait_large: 'portrait',
      square: 'square',
      default: 'portrait',
    };

    const fallbackMap = {
      landscape: `https://picsum.photos/seed/${book.id}/600/400`,
      portrait_large: `https://picsum.photos/seed/${book.id}/300/450`,
      square: `https://picsum.photos/seed/${book.id}/300/300`,
      portrait: `https://picsum.photos/seed/${book.id}/300/450`,
    };

    const variant = variantMap[targetSize] || 'portrait';
    const fallback = fallbackMap[variant] || fallbackMap.portrait;

    return getBookCoverUrl(book, { variant, fallback });
  }, [book]);

  // Removed: handleWishlistClick and handleAddToCart functions as their UI elements are removed in the new outline.

  // ИСПРАВЛЕНО: Добавлен useCallback для loadPersonalRating
  const loadPersonalRating = useCallback(async () => {
    try {
      const ratings = await UserBookRating.filter({
        user_email: user.email,
        book_id: book.id
      });
      if (ratings.length > 0) {
        setPersonalRating(ratings[0]);
      } else {
        setPersonalRating(null); // Clear if no rating found
      }
    } catch (error) {
      console.error('Error loading personal rating:', error);
    }
  }, [user?.email, book?.id]);

  // Загрузка персонального рейтинга
  useEffect(() => {
    if (isAuthenticated && subscription.isActive && user?.email && book?.id) {
      loadPersonalRating();
    }
  }, [isAuthenticated, subscription.isActive, user?.email, book?.id, loadPersonalRating]); // ИСПРАВЛЕНО: добавлена зависимость

  const handleGetPersonalReview = async (e) => {
    e.preventDefault(); // Prevent navigation or other default actions
    e.stopPropagation(); // Stop event propagation
    if (!subscription.isActive) {
      // toast.info('Персональные рецензии доступны только подписчикам Premium');
      console.log('Персональные рецензии доступны только подписчикам Premium');
      return;
    }

    setIsLoadingReview(true);
    try {
      const response = await getPersonalizedReview({ bookId: book.id });
      if (response && response.data) { // Check for response and response.data
        setPersonalReview(response.data.review);
        setShowPersonalReview(true);
      } else {
        // toast.error('Не удалось получить персональную рецензию: пустой ответ');
        console.error('Не удалось получить персональную рецензию: пустой ответ');
      }
    } catch (error) {
      console.error('Error getting personal review:', error);
      // toast.error('Не удалось получить персональную рецензию');
      console.error('Не удалось получить персональную рецензию');
    } finally {
      setIsLoadingReview(false);
    }
  };

  const cardStyles = {
    default: "aspect-[2/3]",
    portrait_large: "aspect-[4/5]", 
    landscape: "aspect-video", 
    square: "aspect-square"
  };

  const currentAspect = cardStyles[size] || cardStyles.default;
  // coverSrc is now handled dynamically within the JSX by calling getCoverUrl(book, size)

  return (
    <>
      <motion.div
        className={`group relative bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        // Removed: onMouseEnter, onMouseLeave as isHovered is no longer used for the overlay.
      >
        {/* Обложка книги */}
        <Link to={createPageUrl(`BookDetails?id=${book.id}`)}>
          <div className={`relative overflow-hidden ${currentAspect}`}> {/* Using currentAspect as defined earlier */}
            <img
              src={getCoverUrl(size)}
              alt={book.title || "Book Cover"} // Added default alt text
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null; // Prevents infinite loop if fallback also fails
                e.target.src = getCoverUrl('portrait');
              }}
            />
            {/* Removed: Overlay with buttons (wishlist, add to cart, eye) based on the outline */}
          </div>
        </Link>

        {/* Информация о книге */}
        <div className="p-3 space-y-2">
          <Link to={createPageUrl(`BookDetails?id=${book.id}`)}>
            <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
          </Link>
          
          <p className="text-xs text-muted-foreground line-clamp-1">
            {book.author}
          </p>

          {/* Рейтинги */}
          <div className="flex items-center justify-between">
            {/* Пользовательский рейтинг */}
            {book.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-muted-foreground font-medium">
                  {book.rating.toFixed(1)}
                </span>
              </div>
            )}

            {/* Персональный AI рейтинг */}
            {personalRating && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(personalRating.ai_rating)
                          ? 'text-gray-400 fill-gray-400'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleGetPersonalReview}
                  disabled={isLoadingReview}
                  className="ml-1 p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  title="Получить персональную рецензию"
                >
                  {isLoadingReview ? (
                    <span className="animate-spin inline-block w-3 h-3 border-b-2 border-gray-500 rounded-full"></span>
                  ) : (
                    <Bot className="w-3 h-3 text-gray-500" />
                  )}
                </button>
              </div>
            )}
            {/* Removed: Genre Badge based on the outline */}
          </div>
        </div>
      </motion.div>

      {/* Модальное окно персональной рецензии */}
      <Dialog open={showPersonalReview} onOpenChange={setShowPersonalReview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Персональная рецензия: {book.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {personalRating && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Ваша персональная оценка:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(personalRating.ai_rating)
                          ? 'text-gray-600 fill-gray-600'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {personalRating.ai_rating.toFixed(1)}/5
                </span>
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed">
                {personalReview || "Загрузка рецензии..."} {/* Display loading text if review is not yet loaded */}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}