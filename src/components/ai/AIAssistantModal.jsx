import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Send, BookOpen, Heart, Star, Bot, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Book } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIAssistantModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Простая логика поиска по ключевым словам
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      
      // Поиск книг по названию, автору или описанию
      const books = await Book.filter({ 
        status: 'approved',
        '$or': [
          { title: { '$regex': searchTerms[0], '$options': 'i' } },
          { author: { '$regex': searchTerms[0], '$options': 'i' } },
          { description: { '$regex': searchTerms[0], '$options': 'i' } }
        ]
      }, '-rating', 6);

      // Если не нашли по первому термину, попробуем общие рекомендации
      if (!books || books.length === 0) {
        const popularBooks = await Book.filter({ status: 'approved' }, '-sales_count', 6);
        setRecommendations(popularBooks || []);
      } else {
        setRecommendations(books);
      }

      setHasSearched(true);
    } catch (error) {
      console.error('Error searching books:', error);
      toast.error('Не удалось найти книги. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const resetSearch = () => {
    setQuery('');
    setRecommendations([]);
    setHasSearched(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            ИИ-помощник для подбора книг
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Form */}
          {!hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Расскажите, что хотите почитать</h3>
                <p className="text-muted-foreground">
                  Опишите жанр, настроение, автора или любые предпочтения
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Например: 'Хочу почитать что-то про космос и приключения' или 'Посоветуйте классическую фантастику'"
                  className="min-h-[100px]"
                  disabled={isLoading}
                />
                
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={!query.trim() || isLoading}>
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Найти книги
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Results */}
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Рекомендации для: "{query}"
                </h3>
                <Button variant="ghost" onClick={resetSearch}>
                  Новый поиск
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {recommendations.map((book) => (
                  <Card key={book.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <img
                          src={book.cover_url || `https://picsum.photos/80/120?random=${book.id}`}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                            {book.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {book.author}
                          </p>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                              <span className="text-xs ml-1">
                                {book.rating ? book.rating.toFixed(1) : '0.0'}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button asChild size="sm" className="text-xs px-2 py-1">
                              <Link to={createPageUrl(`BookDetails?id=${book.id}`)}>
                                Подробнее
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2 py-1"
                              onClick={() => handleAddToWishlist(book)}
                            >
                              <Heart className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {recommendations.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Книги не найдены</h3>
                  <p className="text-muted-foreground mb-4">
                    Попробуйте изменить запрос или использовать другие ключевые слова
                  </p>
                  <Button onClick={resetSearch}>
                    Попробовать снова
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}