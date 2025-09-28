import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, TrendingUp, Users, ShoppingCart } from 'lucide-react';
import { Book } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Алгоритм скоринга: 0.4*sales + 0.3*likes + 0.3*rating
const calculateRecommendationScore = (book) => {
  const normalizedSales = Math.min(book.sales_count / 1000, 1); // Нормализуем до 1
  const normalizedLikes = Math.min(book.likes / 500, 1); // Нормализуем до 1
  const normalizedRating = book.rating / 5; // Уже от 0 до 1

  return (0.4 * normalizedSales + 0.3 * normalizedLikes + 0.3 * normalizedRating) * 100;
};

// Получение истории пользователя из localStorage
const getUserHistory = (userEmail) => {
  try {
    const history = localStorage.getItem(`user_history_${userEmail}`) || '{}';
    return JSON.parse(history);
  } catch (error) {
    return { purchases: [], views: [], likes: [], searches: [] };
  }
};

// Сохранение активности пользователя
const saveUserActivity = (userEmail, activity) => {
  try {
    const history = getUserHistory(userEmail);
    const activityType = activity.type; // 'purchase', 'view', 'like', 'search'
    
    if (!history[`${activityType}s`]) {
      history[`${activityType}s`] = [];
    }
    
    history[`${activityType}s`].unshift({
      ...activity,
      timestamp: Date.now()
    });

    // Ограничиваем историю последними 100 записями
    history[`${activityType}s`] = history[`${activityType}s`].slice(0, 100);
    
    localStorage.setItem(`user_history_${userEmail}`, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving user activity:', error);
  }
};

// Персонализация рекомендаций на основе истории
const personalizeRecommendations = (books, userHistory) => {
  const userGenres = {};
  const userAuthors = {};
  const userLanguages = {};

  // Анализируем предпочтения пользователя
  [...(userHistory.purchases || []), ...(userHistory.views || [])].forEach(activity => {
    if (activity.genre) {
      userGenres[activity.genre] = (userGenres[activity.genre] || 0) + 1;
    }
    if (activity.author) {
      userAuthors[activity.author] = (userAuthors[activity.author] || 0) + 1;
    }
    if (activity.language) {
      userLanguages[activity.language] = (userLanguages[activity.language] || 0) + 1;
    }
  });

  return books.map(book => {
    let personalizedScore = calculateRecommendationScore(book);
    
    // Бонусы за совпадение с предпочтениями
    if (userGenres[book.genre]) {
      personalizedScore += userGenres[book.genre] * 5;
    }
    if (userAuthors[book.author]) {
      personalizedScore += userAuthors[book.author] * 10;
    }
    if (userLanguages[book.language]) {
      personalizedScore += userLanguages[book.language] * 3;
    }

    return {
      ...book,
      recommendationScore: personalizedScore,
      personalizedReasons: {
        genreMatch: !!userGenres[book.genre],
        authorMatch: !!userAuthors[book.author],
        languageMatch: !!userLanguages[book.language]
      }
    };
  });
};

const RecommendationCard = ({ book, onBookView }) => {
  const handleCardClick = () => {
    onBookView(book);
  };

  const getRecommendationReasons = () => {
    const reasons = [];
    if (book.personalizedReasons?.genreMatch) {
      reasons.push(`Ваш любимый жанр: ${book.genre}`);
    }
    if (book.personalizedReasons?.authorMatch) {
      reasons.push(`Знакомый автор: ${book.author}`);
    }
    if (book.personalizedReasons?.languageMatch) {
      reasons.push(`Предпочитаемый язык: ${book.language}`);
    }
    if (book.recommendationScore > 80) {
      reasons.push('Высокий рейтинг и популярность');
    }
    return reasons;
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <Link to={createPageUrl(`BookDetails?id=${book.id}`)} onClick={handleCardClick}>
        <div className="relative">
          <img
            src={book.cover_url || 'https://via.placeholder.com/300x400'}
            alt={book.title}
            className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <Badge className="absolute top-2 right-2 bg-green-600">
            {book.recommendationScore.toFixed(0)}%
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{book.title}</h3>
          <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
          
          <div className="flex items-center gap-2 mb-3 text-xs">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span>{book.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-500" />
              <span>{book.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>{book.sales_count}</span>
            </div>
          </div>

          <div className="space-y-1 mb-3">
            {getRecommendationReasons().slice(0, 2).map((reason, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {reason}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="font-bold">
              {book.price_kas} KAS
            </Badge>
            <Button size="sm" variant="outline">
              <ShoppingCart className="w-3 h-3 mr-1" />
              Купить
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default function PersonalizedRecommendations({ limit = 8 }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Получаем текущего пользователя
      const currentUser = await User.me().catch(() => null);
      setUser(currentUser);

      // Загружаем все книги
      const allBooks = await Book.filter({ status: 'approved' }, '-created_date', 100);
      
      // Получаем историю пользователя
      const userHistory = currentUser ? getUserHistory(currentUser.email) : { purchases: [], views: [], likes: [], searches: [] };
      
      // Персонализируем рекомендации
      const personalizedBooks = personalizeRecommendations(allBooks, userHistory);
      
      // Сортируем по скору и берём топ рекомендаций
      const topRecommendations = personalizedBooks
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);

      setRecommendations(topRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
    setIsLoading(false);
  };

  const handleBookView = (book) => {
    if (user) {
      saveUserActivity(user.email, {
        type: 'view',
        bookId: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        language: book.language
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Рекомендации для вас</h2>
          <p className="text-sm text-muted-foreground">
            {user ? 'Персонализированные на основе ваших предпочтений' : 'Популярные книги'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRecommendations}>
          Обновить
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recommendations.map(book => (
          <RecommendationCard
            key={book.id}
            book={book}
            onBookView={handleBookView}
          />
        ))}
      </div>
    </div>
  );
}

// Экспортируем утилиты для использования в других компонентах
export { saveUserActivity, getUserHistory, calculateRecommendationScore };