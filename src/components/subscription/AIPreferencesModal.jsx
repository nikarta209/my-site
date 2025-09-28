import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, BookOpen, Heart, Settings, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { UserAIPreferences } from '@/api/entities';
import { useAuth } from '../auth/Auth';

const AVAILABLE_GENRES = [
  { value: 'fiction', label: 'Художественная литература' },
  { value: 'fantasy', label: 'Фэнтези' },
  { value: 'sci-fi', label: 'Научная фантастика' },
  { value: 'romance', label: 'Романтика' },
  { value: 'mystery', label: 'Детектив' },
  { value: 'thriller', label: 'Триллер' },
  { value: 'horror', label: 'Ужасы' },
  { value: 'adventure', label: 'Приключения' },
  { value: 'historical', label: 'Историческая проза' },
  { value: 'biography', label: 'Биография' },
  { value: 'self-help', label: 'Саморазвитие' },
  { value: 'business', label: 'Бизнес' },
  { value: 'psychology', label: 'Психология' },
  { value: 'philosophy', label: 'Философия' },
  { value: 'poetry', label: 'Поэзия' },
  { value: 'drama', label: 'Драма' },
  { value: 'comedy', label: 'Комедия' },
  { value: 'young-adult', label: 'Молодежная литература' }
];

const MOOD_OPTIONS = [
  { value: 'uplifting', label: 'Поднимающее настроение' },
  { value: 'dark', label: 'Темное' },
  { value: 'mysterious', label: 'Загадочное' },
  { value: 'romantic', label: 'Романтичное' },
  { value: 'adventurous', label: 'Авантюрное' },
  { value: 'thoughtful', label: 'Заставляющее думать' },
  { value: 'funny', label: 'Смешное' },
  { value: 'melancholic', label: 'Меланхоличное' },
  { value: 'intense', label: 'Интенсивное' },
  { value: 'peaceful', label: 'Спокойное' }
];

const DISLIKE_OPTIONS = [
  { value: 'violence', label: 'Насилие' },
  { value: 'explicit_content', label: 'Откровенный контент' },
  { value: 'sad_endings', label: 'Грустные концовки' },
  { value: 'slow_pace', label: 'Медленный темп' },
  { value: 'complex_language', label: 'Сложный язык' },
  { value: 'multiple_povs', label: 'Множественные точки зрения' },
  { value: 'cliffhangers', label: 'Открытые концовки' },
  { value: 'long_descriptions', label: 'Длинные описания' }
];

export default function AIPreferencesModal({ isOpen, onClose, initialData }) {
  const { user } = useAuth();
  const [favoriteGenres, setFavoriteGenres] = useState(initialData?.favorite_genres || []);
  const [favoriteBooks, setFavoriteBooks] = useState(initialData?.favorite_books || '');
  const [readingPreferences, setReadingPreferences] = useState(initialData?.reading_preferences || '');
  const [dislikedElements, setDislikedElements] = useState(initialData?.disliked_elements || []);
  const [preferredLength, setPreferredLength] = useState(initialData?.preferred_book_length || 'any');
  const [moodPreferences, setMoodPreferences] = useState(initialData?.mood_preferences || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGenre = (genre) => {
    if (favoriteGenres.includes(genre)) {
      setFavoriteGenres(favoriteGenres.filter(g => g !== genre));
    } else {
      setFavoriteGenres([...favoriteGenres, genre]);
    }
  };

  const toggleMood = (mood) => {
    if (moodPreferences.includes(mood)) {
      setMoodPreferences(moodPreferences.filter(m => m !== mood));
    } else {
      setMoodPreferences([...moodPreferences, mood]);
    }
  };

  const toggleDislike = (element) => {
    if (dislikedElements.includes(element)) {
      setDislikedElements(dislikedElements.filter(e => e !== element));
    } else {
      setDislikedElements([...dislikedElements, element]);
    }
  };

  const handleSave = async () => {
    if (!user?.email) {
      toast.error('Необходимо войти в систему');
      return;
    }

    if (favoriteGenres.length === 0) {
      toast.error('Выберите хотя бы один любимый жанр');
      return;
    }

    setIsSubmitting(true);

    try {
      const preferences = {
        user_email: user.email,
        favorite_genres: favoriteGenres,
        favorite_books: favoriteBooks,
        reading_preferences: readingPreferences,
        disliked_elements: dislikedElements,
        preferred_book_length: preferredLength,
        mood_preferences: moodPreferences
      };

      // Проверяем, существуют ли уже предпочтения
      const existing = await UserAIPreferences.filter({ user_email: user.email });
      
      if (existing.length > 0) {
        await UserAIPreferences.update(existing[0].id, preferences);
      } else {
        await UserAIPreferences.create(preferences);
      }

      toast.success('Настройки ИИ сохранены! Персональные рекомендации будут готовы в течение 24 часов.');
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения настроек ИИ:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            Настройка ИИ-рекомендаций
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Любимые жанры */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Любимые жанры
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GENRES.map(genre => (
                  <Badge
                    key={genre.value}
                    variant={favoriteGenres.includes(genre.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleGenre(genre.value)}
                  >
                    {genre.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Любимые книги */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Любимые книги
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Напишите названия ваших любимых книг и авторов. Например: 'Гарри Поттер, Властелин колец, произведения Стивена Кинга...'"
                value={favoriteBooks}
                onChange={(e) => setFavoriteBooks(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Описание вкуса */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Ваш вкус в книгах
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Опишите, что вам нравится в книгах. Например: 'Люблю сложные персонажи, неожиданные повороты сюжета, книги с элементами магии и мистики. Не люблю затянутые описания природы...'"
                value={readingPreferences}
                onChange={(e) => setReadingPreferences(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Настроения */}
          <Card>
            <CardHeader>
              <CardTitle>Предпочитаемые настроения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map(mood => (
                  <Badge
                    key={mood.value}
                    variant={moodPreferences.includes(mood.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMood(mood.value)}
                  >
                    {mood.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Предпочтения по длине */}
          <Card>
            <CardHeader>
              <CardTitle>Предпочитаемая длина книг</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={preferredLength} onValueChange={setPreferredLength}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Короткие (до 200 страниц)</SelectItem>
                  <SelectItem value="medium">Средние (200-400 страниц)</SelectItem>
                  <SelectItem value="long">Длинные (400+ страниц)</SelectItem>
                  <SelectItem value="any">Любая длина</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Что не нравится */}
          <Card>
            <CardHeader>
              <CardTitle>Что вам не нравится в книгах</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {DISLIKE_OPTIONS.map(dislike => (
                  <Badge
                    key={dislike.value}
                    variant={dislikedElements.includes(dislike.value) ? "destructive" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDislike(dislike.value)}
                  >
                    {dislike.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Сохраняем...' : 'Сохранить настройки'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}