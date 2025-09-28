
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from 'sonner';
import { Book } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { useExchangeRate } from '../utils/ExchangeRateContext';
import { Save, X, ImageIcon, Upload } from 'lucide-react';
import { getAuthorStats } from '@/api/functions';
import { useAuth } from '../auth/Auth';

const GENRES = [
  { value: 'fiction', label: 'Художественная литература' },
  { value: 'non-fiction', label: 'Документальная литература' },
  { value: 'science', label: 'Наука' },
  { value: 'history', label: 'История' },
  { value: 'business', label: 'Бизнес' },
  { value: 'romance', label: 'Романтика' },
  { value: 'mystery', label: 'Детектив' },
  { value: 'fantasy', label: 'Фэнтези' },
  { value: 'biography', label: 'Биография' },
  { value: 'self-help', label: 'Саморазвитие' }
];

const MOODS = [
  { value: 'inspiring', label: 'Вдохновляющее' },
  { value: 'relaxing', label: 'Расслабляющее' },
  { value: 'exciting', label: 'Захватывающее' },
  { value: 'educational', label: 'Познавательное' },
  { value: 'emotional', label: 'Эмоциональное' },
  { value: 'thoughtful', label: 'Заставляющее думать' }
];

export default function EditBookSheet({ book, isOpen, onClose, onBookUpdated }) {
  const { user, hasFullAccess } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const { kasRate } = useExchangeRate();
  const [authorStats, setAuthorStats] = useState({ monthlySales: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm();

  const priceKas = watch('price_kas');
  const priceUsd = watch('price_usd');
  const isUsdFixed = watch('is_usd_fixed');

  // Sales thresholds
  const SALES_THRESHOLDS = {
      SQUARE: 50,
      LANDSCAPE: 350,
      PORTRAIT_LARGE: 1000,
      NOTES_1: 5,
      NOTES_2: 25,
      LIBRARY_HERO: 15,
      MAIN_BANNER: 10000
  };

  const hasAccess = useCallback((level) => {
      if (hasFullAccess) return true; // Full access bypasses sales thresholds
      if (isLoadingStats) return false;
      return authorStats.monthlySales >= level;
  }, [authorStats.monthlySales, isLoadingStats, hasFullAccess]);

  useEffect(() => {
    const fetchStats = async () => {
      if (user && isOpen) {
        setIsLoadingStats(true);
        try {
          const { data } = await getAuthorStats();
          setAuthorStats(data);
        } catch (error) {
          console.error("Не удалось загрузить статистику автора:", error);
        } finally {
          setIsLoadingStats(false);
        }
      }
    };
    fetchStats();
  }, [user, isOpen]);

  useEffect(() => {
    if (book) {
      // Заполняем форму данными книги с проверкой на существование свойств
      reset({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        price_kas: book.price_kas || 0,
        price_usd: book.price_usd || 0,
        is_usd_fixed: book.is_usd_fixed || false,
        mood: book.mood || ''
      });
      
      // Устанавливаем выбранные жанры с проверкой
      const genres = book.genres || (book.genre ? [book.genre] : []);
      setSelectedGenres(genres.filter(Boolean));
    } else {
      // Сбрасываем форму если книга не передана
      reset({
        title: '',
        author: '',
        description: '',
        price_kas: 0,
        price_usd: 0,
        is_usd_fixed: false,
        mood: ''
      });
      setSelectedGenres([]);
    }
  }, [book, reset]);

  useEffect(() => {
    if (kasRate > 0) {
      if (isUsdFixed) {
        const currentUsdValue = parseFloat(priceUsd || 0);
        const newKasPrice = currentUsdValue / kasRate;
        if (Math.abs(newKasPrice - (parseFloat(priceKas || 0))) > 0.0001) {
          setValue('price_kas', newKasPrice.toFixed(4), { shouldValidate: true });
        }
      } else {
        const currentKasValue = parseFloat(priceKas || 0);
        const newUsdPrice = currentKasValue * kasRate;
        if (Math.abs(newUsdPrice - (parseFloat(priceUsd || 0))) > 0.0001) {
          setValue('price_usd', newUsdPrice.toFixed(2), { shouldValidate: true });
        }
      }
    }
  }, [priceKas, priceUsd, isUsdFixed, kasRate, setValue]);

  const handleGenreToggle = (genreValue) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreValue)) {
        return prev.filter(g => g !== genreValue);
      } else if (prev.length < 3) {
        return [...prev, genreValue];
      } else {
        toast.warning('Можно выбрать не более 3 жанров');
        return prev;
      }
    });
  };

  const handleCoverUpload = async (file, coverType) => {
    if (!file || !book) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение для обложки');
      return;
    }

    try {
      setIsUploading(true);
      const { file_url } = await UploadFile({ file });
      
      const currentCoverImages = book.cover_images || {};
      
      const updatedBook = await Book.update(book.id, {
        cover_images: {
          ...currentCoverImages,
          [coverType]: file_url,
        }
      });
      
      toast.success(`Обложка '${coverType}' обновлена`);
      if (onBookUpdated) {
        onBookUpdated(updatedBook); // Обновляем данные на лету
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Не удалось загрузить обложку');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!book) {
      toast.error('Нет данных книги для обновления');
      return;
    }

    if (selectedGenres.length === 0) {
      toast.error('Выберите хотя бы один жанр');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        title: data.title,
        author: data.author,
        description: data.description,
        price_kas: parseFloat(data.price_kas),
        price_usd: parseFloat(data.price_usd),
        is_usd_fixed: data.is_usd_fixed,
        mood: data.mood,
        genre: selectedGenres[0], // Основной жанр
        genres: selectedGenres // Все жанры
      };

      const updatedBook = await Book.update(book.id, updateData);
      toast.success('Книга успешно обновлена!');
      
      if (onBookUpdated) {
        onBookUpdated(updatedBook);
      }
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('Ошибка обновления книги:', error);
      toast.error(`Не удалось обновить книгу: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Не рендерим компонент если нет книги
  if (!book) {
    return null;
  }

  const coverUploadOptions = [
    { type: 'default', label: 'Стандарт (400x600)', threshold: 0 },
    { type: 'square', label: 'Квадрат (600x600)', threshold: SALES_THRESHOLDS.SQUARE },
    { type: 'notes_1', label: 'Заметки 1 (600x400)', threshold: SALES_THRESHOLDS.NOTES_1 },
    { type: 'notes_2', label: 'Заметки 2 (600x400)', threshold: SALES_THRESHOLDS.NOTES_2 },
    { type: 'library_hero', label: 'Библиотека (1200x400)', threshold: SALES_THRESHOLDS.LIBRARY_HERO },
    { type: 'landscape', label: 'Разделы (1600x900)', threshold: SALES_THRESHOLDS.LANDSCAPE },
    { type: 'portrait_large', label: 'Популярное (800x1000)', threshold: SALES_THRESHOLDS.PORTRAIT_LARGE },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Редактировать книгу</SheetTitle>
          <SheetDescription>
            Внесите изменения в информацию о книге
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Название книги *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Введите название книги' })}
                placeholder="Введите название книги"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="author">Автор</Label>
              <Input
                id="author"
                {...register('author')}
                placeholder="Имя автора"
              />
            </div>

            <div>
              <Label htmlFor="description">Описание *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Добавьте описание книги' })}
                className="min-h-[120px]"
                placeholder="Опишите сюжет, героев, основные темы..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <Label className="mb-2 block font-semibold">Менеджер обложек</Label>
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                {coverUploadOptions.map(opt => {
                  const canUpload = hasAccess(opt.threshold);
                  const currentCover = book.cover_images?.[opt.type];
                  return (
                    <div key={opt.type} className={`p-2 rounded-md ${canUpload ? 'bg-card' : 'bg-muted'}`}>
                      <Label htmlFor={`cover_${opt.type}`} className={`flex items-center justify-between text-sm ${!canUpload ? 'text-muted-foreground' : ''}`}>
                        <span>{opt.label}</span>
                        {!canUpload && <Badge variant="outline">Нужно {opt.threshold} продаж</Badge>}
                      </Label>
                      {canUpload ? (
                        <div className="flex items-center gap-2 mt-1">
                          {currentCover && <img src={currentCover} alt={opt.label} className="w-10 h-10 object-cover rounded" />}
                          <Input
                              id={`cover_${opt.type}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCoverUpload(e.target.files?.[0], opt.type)}
                              className="text-xs"
                              disabled={isUploading}
                          />
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block">Цена *</Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_usd">Цена в USD</Label>
                  <Input
                    id="price_usd"
                    type="number"
                    step="0.01"
                    {...register('price_usd', { valueAsNumber: true })}
                    className={`${!isUsdFixed ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400' : ''}`}
                    placeholder="9.99"
                    disabled={!isUsdFixed}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_usd_fixed"
                    checked={isUsdFixed}
                    onCheckedChange={(checked) => setValue('is_usd_fixed', checked)}
                  />
                  <Label htmlFor="is_usd_fixed" className="cursor-pointer">
                    Зафиксировать цену в USD
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_kas">Цена в KAS</Label>
                  <Input
                    id="price_kas"
                    type="number"
                    step="0.01"
                    min="1"
                    {...register('price_kas', {
                      required: 'Укажите цену книги',
                      min: { value: 1, message: 'Минимальная цена 1 KAS' },
                      valueAsNumber: true
                    })}
                    className={`${isUsdFixed ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400' : ''}`}
                    placeholder="25.00"
                    disabled={isUsdFixed}
                  />
                  {errors.price_kas && <p className="text-red-500 text-sm mt-1">{errors.price_kas.message}</p>}
                  {kasRate > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Текущий курс KAS/USD: {kasRate.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="mood">Настроение книги</Label>
              <Select onValueChange={(value) => setValue('mood', value)} value={watch('mood')}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите настроение" />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map(mood => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground font-semibold">Жанры (до 3-х)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {GENRES.map(genre => (
                  <div key={genre.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={genre.value}
                      checked={selectedGenres.includes(genre.value)}
                      onCheckedChange={() => handleGenreToggle(genre.value)}
                      disabled={!selectedGenres.includes(genre.value) && selectedGenres.length >= 3}
                    />
                    <Label htmlFor={genre.value} className="text-sm cursor-pointer">
                      {genre.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedGenres.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Выбранные жанры:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedGenres.map(genreValue => (
                      <Badge key={genreValue} className="bg-amber-200 dark:bg-slate-600 text-amber-800 dark:text-slate-200">
                        {GENRES.find(g => g.value === genreValue)?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading || isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
