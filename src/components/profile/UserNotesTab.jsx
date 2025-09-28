
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, BookOpen, StickyNote, Eye } from 'lucide-react';
import { UserBookData } from '@/api/entities';
import { Book } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { SharedNote } from '@/api/entities';
import { useAuth } from '../auth/Auth';
import { toast } from 'sonner';

export default function UserNotesTab({ user }) {
  const { user: authUser } = useAuth();
  const [userNotes, setUserNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyPublishCount, setDailyPublishCount] = useState(0);
  const DAILY_PUBLISH_LIMIT = 5;

  const loadUserNotes = useCallback(async () => {
    if (!authUser?.email) return;
    
    setIsLoading(true);
    try {
      // Загружаем все заметки пользователя
      const userBookData = await UserBookData.filter({ user_email: authUser.email });
      
      // Фильтруем только те записи, где есть заметки
      const notesWithBooks = [];
      for (const data of userBookData) {
        if (data.notes && data.notes.length > 0) {
          try {
            const book = await Book.get(data.book_id);
            if (book) {
              notesWithBooks.push({
                ...data,
                book: book,
                notes: data.notes || []
              });
            }
          } catch (error) {
            console.warn(`Не удалось загрузить книгу ${data.book_id}:`, error);
          }
        }
      }
      
      setUserNotes(notesWithBooks);

      // Загружаем количество опубликованных заметок сегодня
      try {
        const today = new Date().toISOString().split('T')[0];
        const todaySharedNotes = await SharedNote.filter({
          user_email: authUser.email,
          created_at: { '$gte': today }
        });
        setDailyPublishCount(todaySharedNotes.length);
      } catch (error) {
        console.warn('Не удалось загрузить статистику публикаций:', error);
      }

    } catch (error) {
      console.error('Ошибка загрузки заметок:', error);
      toast.error('Не удалось загрузить заметки');
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.email]);

  useEffect(() => {
    loadUserNotes();
  }, [loadUserNotes]);

  const shareNote = async (note, bookData) => {
    // Проверяем дневной лимит
    if (dailyPublishCount >= DAILY_PUBLISH_LIMIT) {
      toast.error(`Достигнут дневной лимит публикаций (${DAILY_PUBLISH_LIMIT} заметок в день)`);
      return;
    }

    try {
      // TODO: Временно отключена проверка на покупку книги для демонстрации
      /*
      const purchases = await Purchase.filter({ 
        book_id: bookData.book_id, 
        buyer_email: authUser.email 
      });
      
      if (purchases.length === 0) {
        toast.error('Можно делиться заметками только из купленных книг');
        return;
      }
      */

      // Проверяем, не была ли уже опубликована эта заметка
      const existingSharedNote = await SharedNote.filter({
          user_email: authUser.email,
          book_id: bookData.book_id,
          note_text: note.note_text,
          selected_text: note.selected_text
      });

      if (existingSharedNote.length > 0) {
          toast.info('Вы уже делились этой заметкой');
          return;
      }
      
      // Создаем новую запись в SharedNote
      await SharedNote.create({
        user_email: authUser.email,
        user_name: authUser.full_name,
        book_id: bookData.book_id,
        book_title: bookData.book.title,
        book_author: bookData.book.author,
        book_genre: bookData.book.genre,
        note_text: note.note_text,
        selected_text: note.selected_text,
        highlight_color: note.highlight_color,
        page_number: note.page_number,
        likes_count: 0
      });
      
      setDailyPublishCount(prev => prev + 1);
      toast.success(`Заметка опубликована! Осталось публикаций сегодня: ${DAILY_PUBLISH_LIMIT - dailyPublishCount - 1}`);
      
    } catch (error) {
      console.error('Ошибка при публикации заметки:', error);
      toast.error('Не удалось опубликовать заметку');
    }
  };

  const highlightColors = {
    yellow: 'bg-yellow-200 text-yellow-900',
    green: 'bg-green-200 text-green-900', 
    blue: 'bg-blue-200 text-blue-900',
    pink: 'bg-pink-200 text-pink-900',
    orange: 'bg-orange-200 text-orange-900'
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-2 text-amber-600 dark:text-slate-400">Загрузка заметок...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-amber-900 dark:text-slate-200">Мои заметки</h3>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-amber-200 dark:bg-slate-700 text-amber-800 dark:text-slate-300">
            <StickyNote className="w-4 h-4 mr-1" />
            {userNotes.reduce((total, data) => total + data.notes.length, 0)} заметок
          </Badge>
          <Badge 
            variant={dailyPublishCount >= DAILY_PUBLISH_LIMIT ? "destructive" : "outline"}
            className="flex items-center gap-1"
          >
            Опубликовано сегодня: {dailyPublishCount}/{DAILY_PUBLISH_LIMIT}
          </Badge>
        </div>
      </div>

      {userNotes.length === 0 ? (
        <Card className="bg-amber-50 dark:bg-slate-800 border-amber-200 dark:border-slate-700">
          <CardContent className="text-center py-12">
            <StickyNote className="w-16 h-16 mx-auto text-amber-400 dark:text-slate-500 mb-4" />
            <p className="text-amber-600 dark:text-slate-400">У вас пока нет заметок</p>
            <p className="text-sm text-amber-500 dark:text-slate-500 mt-2">
              Создавайте заметки во время чтения книг
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {userNotes.map((bookData) => (
            <Card key={bookData.book_id} className="bg-amber-50 dark:bg-slate-800 border-amber-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={bookData.book.cover_url} 
                      alt={bookData.book.title}
                      className="w-12 h-16 object-cover rounded border border-amber-300 dark:border-slate-600"
                    />
                    <div>
                      <CardTitle className="text-lg text-amber-900 dark:text-slate-200">{bookData.book.title}</CardTitle>
                      <p className="text-sm text-amber-600 dark:text-slate-400">{bookData.book.author}</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-200 dark:bg-slate-700 text-amber-800 dark:text-slate-300">
                    {bookData.notes.length} заметок
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookData.notes.map((note) => (
                  <motion.div 
                    key={note.id}
                    className="border border-amber-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-900"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={`${highlightColors[note.highlight_color]} text-xs`}>
                        Страница {note.page_number}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => shareNote(note, bookData)}
                        disabled={dailyPublishCount >= DAILY_PUBLISH_LIMIT}
                        className="text-amber-600 dark:text-slate-400 hover:text-amber-800 dark:hover:text-slate-200 disabled:opacity-50"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {note.selected_text && (
                      <blockquote className="border-l-4 border-amber-300 dark:border-slate-600 pl-3 mb-3 italic text-amber-700 dark:text-slate-300">
                        "{note.selected_text}"
                      </blockquote>
                    )}
                    
                    {note.note_text && (
                      <p className="text-amber-800 dark:text-slate-300">{note.note_text}</p>
                    )}
                    
                    <p className="text-xs text-amber-500 dark:text-slate-500 mt-2">
                      {new Date(note.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
