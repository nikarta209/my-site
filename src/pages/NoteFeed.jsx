import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart, MessageCircle, Share2, StickyNote, RefreshCw } from 'lucide-react';
import { UserBookData } from '@/api/entities';
import { Book } from '@/api/entities';
import { User } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { toast } from 'sonner';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

export default function NoteFeed() {
  const [sharedNotes, setSharedNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSharedNotes();
  }, []);

  const loadSharedNotes = async () => {
    setIsLoading(true);
    try {
      // Здесь будет логика загрузки опубликованных заметок
      // Пока что используем моковые данные
      const mockSharedNotes = [
        {
          id: '1',
          user: { full_name: 'Артем Антипин', email: 'artem@example.com', avatar_url: null },
          book: {
            title: 'Дюна',
            author: 'Фрэнк Герберт',
            cover_images: { default: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop' }
          },
          note: {
            selected_text: 'Страх — это убийца разума. Страх — это малая смерть, которая приносит полное забвение.',
            note_text: 'Одна из самых мощных цитат в книге. Показывает философию Бене Гессерит.',
            highlight_color: 'yellow',
            page_number: 42
          },
          created_at: '2023-10-26T10:30:00Z',
          likes: 15,
          comments: 3
        },
        {
          id: '2', 
          user: { full_name: 'Мария Иванова', email: 'maria@example.com', avatar_url: null },
          book: {
            title: 'Искусство войны',
            author: 'Сунь-цзы',
            cover_images: { default: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop' }
          },
          note: {
            selected_text: 'Высшее искусство войны — покорить врага без боя.',
            note_text: 'Актуально не только в военном деле, но и в бизнесе и повседневной жизни.',
            highlight_color: 'blue',
            page_number: 15
          },
          created_at: '2023-10-25T15:45:00Z',
          likes: 8,
          comments: 1
        }
      ];
      
      setSharedNotes(mockSharedNotes);
    } catch (error) {
      console.error('Ошибка загрузки ленты заметок:', error);
      toast.error('Не удалось загрузить ленту заметок');
    } finally {
      setIsLoading(false);
    }
  };

  const highlightColors = {
    yellow: 'bg-yellow-200 text-yellow-900 border-yellow-300',
    green: 'bg-green-200 text-green-900 border-green-300',
    blue: 'bg-blue-200 text-blue-900 border-blue-300', 
    pink: 'bg-pink-200 text-pink-900 border-pink-300',
    orange: 'bg-orange-200 text-orange-900 border-orange-300'
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-400">Загрузка ленты заметок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Лента заметок</h1>
            <p className="text-gray-600 dark:text-slate-400">Открывайте новые идеи через заметки других читателей</p>
          </div>
          <Button
            variant="outline"
            onClick={loadSharedNotes}
            className="border-amber-300 dark:border-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
        </div>

        {sharedNotes.length === 0 ? (
          <Card className="bg-amber-50 dark:bg-slate-800 border-amber-200 dark:border-slate-700">
            <CardContent className="text-center py-12">
              <StickyNote className="w-16 h-16 mx-auto text-amber-400 dark:text-slate-500 mb-4" />
              <p className="text-amber-600 dark:text-slate-400">В ленте пока нет заметок</p>
              <p className="text-sm text-amber-500 dark:text-slate-500 mt-2">
                Станьте первым, кто поделится своими мыслями о книгах!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sharedNotes.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={item.user.avatar_url} />
                          <AvatarFallback className="bg-amber-200 dark:bg-slate-700 text-amber-900 dark:text-slate-300">
                            {getInitials(item.user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.user.full_name}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            {new Date(item.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={getCoverOrPlaceholder(item.book, `https://picsum.photos/seed/${item.book.title}/200/280`)}
                        alt={item.book.title}
                        className="w-12 h-16 object-cover rounded border border-gray-200 dark:border-slate-600 flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.book.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{item.book.author}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Страница {item.note.page_number}
                        </Badge>
                      </div>
                    </div>

                    <div className={`border-l-4 pl-4 py-3 rounded-r ${highlightColors[item.note.highlight_color]}`}>
                      {item.note.selected_text && (
                        <blockquote className="italic mb-2">
                          "{item.note.selected_text}"
                        </blockquote>
                      )}
                      {item.note.note_text && (
                        <p className="font-medium">{item.note.note_text}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-slate-400">
                        <Heart className="w-4 h-4 mr-1" />
                        {item.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-slate-400">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {item.comments}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}