import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/Auth';
import { Review } from '@/api/entities';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StarRating = ({ rating, setRating, readonly = false }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-5 h-5 transition-colors cursor-pointer ${
          star <= rating 
            ? 'text-orange-500 fill-orange-500' 
            : 'text-gray-300 hover:text-orange-400'
        } ${readonly ? 'cursor-default' : ''}`}
        onClick={() => !readonly && setRating(star)}
      />
    ))}
  </div>
);

export default function ReviewsSection({ bookId, initialReviews = [] }) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!bookId) return;
    
    setIsLoading(true);
    try {
      const fetchedReviews = await Review.filter({ 
        book_id: bookId, 
        status: 'approved' 
      }, '-created_date', 20);
      setReviews(fetchedReviews || []);
    } catch (error) {
      console.error('Не удалось загрузить отзывы:', error);
      toast.error('Не удалось загрузить отзывы.');
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    if (initialReviews.length === 0) {
      fetchReviews();
    }
  }, [bookId, initialReviews.length, fetchReviews]);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Пожалуйста, войдите, чтобы оставить отзыв.');
      return;
    }
    if (rating === 0) {
      toast.error('Пожалуйста, поставьте оценку.');
      return;
    }
    if (newReview.trim() === '') {
      toast.error('Пожалуйста, напишите комментарий.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Review.create({
        book_id: bookId,
        reviewer_email: user.email,
        rating: rating,
        comment: newReview.trim(),
      });
      toast.success('Спасибо! Ваш отзыв отправлен на модерацию.');
      setNewReview('');
      setRating(0);
      // Перезагружаем отзывы после небольшой задержки
      setTimeout(fetchReviews, 1000);
    } catch (error) {
      console.error('Не удалось отправить отзыв:', error);
      toast.error('Не удалось отправить отзыв.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Недавно';
    }
  };

  const getInitials = (email) => {
    if (!email) return 'А';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Add Review Form */}
      {isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="kasbook-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Написать отзыв
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ваша оценка</label>
                <StarRating rating={rating} setRating={setRating} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Комментарий</label>
                <Textarea
                  placeholder="Поделитесь своим мнением о книге..."
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  className="min-h-24 resize-none"
                />
              </div>
              
              <Button 
                onClick={handleSubmitReview} 
                disabled={isSubmitting || rating === 0 || !newReview.trim()}
                className="kasbook-btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Отправляем...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Отправить отзыв
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="kasbook-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-24" />
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className="w-4 h-4 bg-muted rounded animate-pulse" />
                        ))}
                      </div>
                      <div className="h-16 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <AnimatePresence>
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="kasbook-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(review.reviewer_email)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">
                            {review.reviewer_email?.split('@')[0] || 'Аноним'}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(review.created_date)}
                          </span>
                        </div>
                        
                        <StarRating rating={review.rating} readonly />
                        
                        <p className="text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <Card className="kasbook-card">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Отзывов пока нет</h3>
              <p className="text-muted-foreground">
                Будьте первым, кто поделится мнением об этой книге!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}