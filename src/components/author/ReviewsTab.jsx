import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Heart, Star, MessageSquare, BookOpen, TrendingUp } from 'lucide-react';
import { useAuth } from '../auth/Auth';

// Перемещаем mock данные за пределы компонента, чтобы избежать ошибок с зависимостями
const mockReviews = [
  {
    id: 1,
    bookTitle: "Тень дракона",
    reviewText: "Потрясающая книга! Захватывающий сюжет и прекрасно проработанные персонажи.",
    rating: 5,
    likes: 12,
    reviewerName: "Анна К.",
    date: "2024-01-15"
  },
  {
    id: 2,
    bookTitle: "Последний горизонт",
    reviewText: "Интересная научная фантастика, но концовка немного разочаровала.",
    rating: 4,
    likes: 7,
    reviewerName: "Михаил П.",
    date: "2024-01-10"
  },
  {
    id: 3,
    bookTitle: "Хроники ветра",
    reviewText: "Великолепное фэнтези! Не могу дождаться продолжения серии.",
    rating: 5,
    likes: 24,
    reviewerName: "Елена С.",
    date: "2024-01-08"
  }
];

export default function ReviewsTab() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Имитация загрузки
    const timer = setTimeout(() => {
      setReviews(mockReviews);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Теперь dependency array может быть пустым

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="bg-gray-200 h-16 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          Пока нет отзывов
        </h3>
        <p className="text-muted-foreground mb-6">
          Отзывы на ваши книги будут отображаться здесь
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>Опубликуйте больше книг</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>Продвигайте свои произведения</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              {reviews.length}
            </div>
            <div className="text-sm text-muted-foreground">Всего отзывов</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-2xl font-bold text-primary">
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
            </div>
            <div className="text-sm text-muted-foreground">Средний рейтинг</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-2xl font-bold text-primary">
                {reviews.reduce((sum, r) => sum + r.likes, 0)}
              </span>
              <Heart className="w-5 h-5 text-red-400 fill-current" />
            </div>
            <div className="text-sm text-muted-foreground">Всего лайков</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {review.bookTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {review.reviewerName} • {new Date(review.date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-400" />
                    {review.likes}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm font-medium">
                    {review.rating}/5
                  </span>
                </div>
                
                <p className="text-foreground leading-relaxed">
                  {review.reviewText}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}