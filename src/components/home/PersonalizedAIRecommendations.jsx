import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Star, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSubscription } from '../auth/Auth';
import { InvokeLLM } from '@/api/integrations';
import { Book } from '@/api/entities';
import { toast } from 'sonner';

export default function PersonalizedAIRecommendations({ user }) {
  const subscription = useSubscription();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePersonalizedRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Получаем случайные одобренные книги для анализа
      const availableBooks = await Book.filter({ status: 'approved' }, '-rating', 20);
      
      if (!availableBooks || availableBooks.length < 3) {
        throw new Error('Недостаточно книг для рекомендаций');
      }

      // Выбираем 3 случайные книги
      const selectedBooks = availableBooks
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      // Формируем промпт для ИИ с информацией о пользователе
      const userContext = `
Пользователь: ${user.full_name || 'Читатель'}
Предпочтения языков: ${user.preferred_languages?.join(', ') || 'русский'}
Статус подписки: ${subscription.isActive ? 'премиум' : 'базовый'}
Время активности: ${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'новый пользователь'}
`;

      const booksInfo = selectedBooks.map((book, index) => `
Книга ${index + 1}: "${book.title}" 
Автор: ${book.author}
Жанры: ${book.genres?.join(', ') || 'не указаны'}
Описание: ${book.description || 'Описание отсутствует'}
Рейтинг: ${book.rating || 0}/5
`).join('\n');

      const prompt = `${userContext}

Создай 3 персональных рекомендации для этих книг в формате JSON:

${booksInfo}

Каждая рекомендация должна быть уникальной, привлекательной и персонализированной для пользователя. 
Учитывай жанры, настроение книг и предпочтения пользователя.
Длина каждого описания: 80-120 слов.

Ответ строго в JSON формате:
{
  "recommendations": [
    {
      "bookId": "id_книги",
      "personalizedDescription": "персональное описание почему эта книга подойдет пользователю"
    }
  ]
}`;

      const aiResponse = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bookId: { type: "string" },
                  personalizedDescription: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (aiResponse.recommendations) {
        const enrichedRecommendations = aiResponse.recommendations.map((rec, index) => ({
          ...rec,
          book: selectedBooks[index],
          layoutType: ['image-left', 'text-left', 'image-left'][index] // Последовательность макетов
        }));
        
        setRecommendations(enrichedRecommendations);
      }

    } catch (err) {
      console.error('Ошибка создания рекомендаций:', err);
      setError('Не удалось создать персональные рекомендации');
    } finally {
      setIsLoading(false);
    }
  }, [user, subscription.isActive]);

  useEffect(() => {
    if (user && subscription.isActive) {
      generatePersonalizedRecommendations();
    }
  }, [generatePersonalizedRecommendations, user, subscription.isActive]);

  // Не показываем компонент если нет активной подписки
  if (!subscription.isActive) {
    return null;
  }

  const RecCard = ({ recommendation, index }) => {
    const { book, personalizedDescription, layoutType } = recommendation;
    
    const coverUrl = book.cover_images?.default || book.cover_url || 
      `https://picsum.photos/seed/${book.id}/300/400`;

    if (layoutType === 'text-left') {
      return (
        <Card className="h-full bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex h-full">
              <div className="flex-1 p-6 flex flex-col justify-center">
                <Badge className="bg-purple-600 text-white w-fit mb-3">
                  <Brain className="w-3 h-3 mr-1" />
                  ИИ рекомендует
                </Badge>
                <h3 className="font-bold text-lg mb-2">{book.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{book.author}</p>
                <p className="text-sm leading-relaxed mb-4 text-gray-700">
                  {personalizedDescription}
                </p>
                <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 w-fit">
                  <Link to={createPageUrl(`BookDetails?id=${book.id}`)}>
                    Подробнее <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
              <div className="w-32 flex-shrink-0">
                <img 
                  src={coverUrl} 
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex h-full">
            <div className="w-32 flex-shrink-0">
              <img 
                src={coverUrl} 
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center">
              <Badge className="bg-blue-600 text-white w-fit mb-3">
                <Sparkles className="w-3 h-3 mr-1" />
                Для вас
              </Badge>
              <h3 className="font-bold text-lg mb-2">{book.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{book.author}</p>
              <p className="text-sm leading-relaxed mb-4 text-gray-700">
                {personalizedDescription}
              </p>
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 w-fit">
                <Link to={createPageUrl(`BookDetails?id=${book.id}`)}>
                  Читать <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="my-8"
    >
      <Card className="bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Brain className="w-6 h-6" />
            Персональные рекомендации ИИ
            <Badge className="bg-purple-600 text-white">ПРЕМИУМ</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-white rounded-lg p-4">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={generatePersonalizedRecommendations} variant="outline">
                Попробовать снова
              </Button>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={`${rec.book.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="h-48"
                >
                  <RecCard recommendation={rec} index={index} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Нет доступных рекомендаций
              </p>
              <Button onClick={generatePersonalizedRecommendations} variant="outline">
                Создать рекомендации
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}