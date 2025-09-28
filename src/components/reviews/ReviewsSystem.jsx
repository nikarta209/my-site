import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, Star, MessageCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Review } from '@/api/entities';
import { useAuth } from '../auth/Auth';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ReviewsSystem({ bookId, onReviewsUpdate }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [userLikes, setUserLikes] = useState(new Set());
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    loadReviews();
  }, [bookId]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const reviewsData = await Review.filter({ 
        book_id: bookId, 
        status: 'approved' 
      }, '-helpful_votes,-created_date', 50);
      
      setReviews(reviewsData);
      
      // Load user's likes
      if (user && reviewsData.length > 0) {
        const userLikedReviews = new Set();
        reviewsData.forEach(review => {
          if (review.likes && review.likes.includes(user.email)) {
            userLikedReviews.add(review.id);
          }
        });
        setUserLikes(userLikedReviews);
      }
      
      if (onReviewsUpdate) {
        onReviewsUpdate(reviewsData);
      }
      
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('Не удалось загрузить отзывы');
      // Fallback to empty state
      setReviews([]);
    }
    setIsLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Войдите, чтобы оставить отзыв');
      return;
    }
    
    if (!newReview.comment.trim()) {
      toast.error('Добавьте текст отзыва');
      return;
    }

    try {
      await Review.create({
        book_id: bookId,
        reviewer_email: user.email,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        status: 'pending'
      });

      toast.success('Отзыв отправлен на модерацию');
      setNewReview({ rating: 5, comment: '' });
      setShowAddReview(false);
      
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Не удалось отправить отзыв');
    }
  };

  const handleToggleLike = async (reviewId) => {
    if (!user) {
      toast.error('Войдите, чтобы оценить отзыв');
      return;
    }

    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    const currentLikes = review.likes || [];
    const isLiked = currentLikes.includes(user.email);
    
    if (isLiked) {
      toast.info('Вы уже оценили этот отзыв');
      return;
    }

    try {
      const updatedLikes = [...currentLikes, user.email];
      
      await Review.update(reviewId, {
        likes: updatedLikes
      });

      // Update local state
      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? { ...r, likes: updatedLikes, helpful_votes: updatedLikes.length }
          : r
      ));
      
      setUserLikes(prev => new Set([...prev, reviewId]));
      toast.success('Спасибо за оценку!');
      
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Не удалось оценить отзыв');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Отзывы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Отзывы ({reviews.length})
          </CardTitle>
          {isAuthenticated && (
            <Button
              onClick={() => setShowAddReview(!showAddReview)}
              size="sm"
              variant="outline"
            >
              Написать отзыв
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add Review Form */}
        {showAddReview && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Оценка:</span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setNewReview(prev => ({ ...prev, rating: i + 1 }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          i < newReview.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <Textarea
                placeholder="Поделитесь своими впечатлениями о книге..."
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                className="min-h-24"
              />
              
              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} size="sm">
                  Отправить отзыв
                </Button>
                <Button 
                  onClick={() => setShowAddReview(false)} 
                  variant="outline" 
                  size="sm"
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4" aria-live="polite">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <Badge variant="secondary">
                      {review.reviewer_email.split('@')[0]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(review.created_date), 'd MMMM yyyy', { locale: ru })}
                    </span>
                  </div>
                  
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleLike(review.id)}
                      disabled={userLikes.has(review.id)}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp 
                        className={`w-4 h-4 ${
                          userLikes.has(review.id) ? 'text-blue-500 fill-current' : ''
                        }`} 
                      />
                      {review.helpful_votes || 0}
                    </Button>
                  )}
                </div>
                
                <p className="text-sm leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" aria-live="polite">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Пока нет отзывов</h3>
            <p className="text-muted-foreground mb-4">
              Станьте первым, кто оставит отзыв об этой книге!
            </p>
            {isAuthenticated && (
              <Button onClick={() => setShowAddReview(true)}>
                Написать первый отзыв
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}