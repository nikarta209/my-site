
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, ProtectedRoute } from '../components/auth/Auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Check,
  X,
  Download,
  Copy,
  Shield,
  User,
  Calendar,
  FileText,
  Tag,
  DollarSign,
  AlertCircle,
  ImageIcon,
  Eye
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { invalidateCache } from '@/components/utils/supabase';
import { Link } from 'react-router-dom';
import { Book } from '@/api/entities'; // ИСПРАВЛЕНИЕ: Прямой импорт сущности
import { moderateBook } from '@/api/moderation';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

const GROK_PROMPT = `Анализируй предоставленный текст книжного произведения по следующим критериям. Будь объективен, цитируй фрагменты для обоснования выводов и предоставь их для ручного анализа человеком. Если текст подозрительный по какому-либо критерию, укажи точные цитаты и страницы (если доступны). Выводы делай четкими: "соответствует" или "не соответствует" с объяснением. Основная цель - выявить потенциально вредоносный контент, который может нанести физический вред читателю.

Критерии анализа:

1. **Целостность истории**: Проверь, является ли книга coherentной историей с сюжетом, персонажами и развитием. Если текст - повторяющееся слово/фраза на многих страницах, повторяющиеся страницы или бессмысленный набор символов без повествования, отметь это как несоответствие.

2. **Пропаганда наркотиков**: Нет прямых советов по созданию/изготовлению/употреблению наркотиков. Допустимо, если персонаж употребляет в контексте истории. Исключения: обучающая литература (состав, влияние на организм, отрицательные факторы - укажи, если упоминаются только положительные). Для исторических событий - без пропаганды. Если подозрение, предоставь фрагменты.

3. **Побуждение к убийствам, насилию, терроризму, суициду, изготовлению оружия**: Нет прямых призывов. Допустимо, если персонаж совершает действия в сюжете (e.g., суицид от безумия). Для подозрительных частей предоставь фрагменты для ручного анализа. То же для всех критериев.

4. **Критика власти**: Допустима, включая альтернативные предложения правления - не считать вредом.

5. **Общий вывод**: Книга не должна нести вред, причиняющий физический вред читателю (e.g., инструкции по самоубийству/изготовлению оружия/наркотиков). Рекомендация: "Одобрить", "Отклонить" или "На ручной анализ" с причинами.`;

const RejectionDialog = ({ book, isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  const handleConfirm = () => {
    if (!reason) {
      toast.error('Пожалуйста, выберите причину отклонения.');
      return;
    }
    onConfirm({ reason, comment });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Причина отклонения книги "{book?.title}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select onValueChange={setReason} value={reason}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите основную причину" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plagiarism">Плагиат или нарушение авторских прав</SelectItem>
              <SelectItem value="low-quality">Низкое качество (оформление, ошибки)</SelectItem>
              <SelectItem value="harmful-content">Запрещенный / вредоносный контент</SelectItem>
              <SelectItem value="spam">Спам или бессмысленный текст</SelectItem>
              <SelectItem value="other">Другое (указать в комментарии)</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Оставьте развернутый комментарий для автора..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason}>
            Отклонить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// НОВЫЙ КОМПОНЕНТ: Галерея обложек
const CoverGallery = ({ coverImages }) => {
  if (!coverImages || Object.keys(coverImages).length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Загруженные обложки
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-4">Автор не загрузил дополнительных обложек.</p>
            </CardContent>
        </Card>
    );
  }

  const coverTypes = {
    default: "Стандартная (2:3)",
    portrait_large: "Высокая (4:5)",
    landscape: "Широкая (16:9)",
    square: "Квадратная (1:1)",
    notes_1: "Заметки #1",
    notes_2: "Заметки #2",
    library_hero: "Баннер в библиотеке",
    main_banner: "Главный баннер"
  };

  const availableCovers = Object.entries(coverImages)
    .filter(([, url]) => url)
    .map(([key, url]) => ({ key, url, label: coverTypes[key] || key }));

  if (availableCovers.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Загруженные обложки
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-4">Автор не загрузил дополнительных обложек.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Загруженные обложки
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableCovers.map(({ key, url, label }) => (
                    <div key={key} className="group relative">
                        <img 
                            src={url} 
                            alt={label} 
                            className="w-full h-auto object-contain rounded-md border bg-muted"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center p-1 rounded-b-md">
                            {label}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
  );
};


export default function BookModerationDetails() {
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Получаем ID книги из URL
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('bookId') || urlParams.get('id');

  const fetchBookDetails = useCallback(async () => {
    if (!bookId) {
      setError('Идентификатор книги не указан.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // ИСПРАВЛЕНИЕ: Используем прямой вызов Book.get вместо устаревшего API
      const data = await Book.get(bookId);
      if (!data) throw new Error('Книга с таким ID не найдена.');
      setBook(data);
    } catch (err) {
      setError(err.message);
      toast.error('Не удалось загрузить информацию о книге.');
    } finally {
      setIsLoading(false);
    }
  }, [bookId]); // bookId is a dependency for useCallback

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
    } else {
      setError('Идентификатор книги не указан.');
      setIsLoading(false);
    }
  }, [bookId, fetchBookDetails]); // fetchBookDetails is now a stable dependency

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(GROK_PROMPT);
      toast.success('Промпт для анализа скопирован в буфер обмена!');
    } catch (err) {
      toast.error('Не удалось скопировать промпт.');
    }
  };

  const handleDownloadFile = (url, filename) => {
    if (!url) {
      toast.error('URL файла отсутствует.');
      return;
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info(`Начинается скачивание ${filename}...`);
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      if (!book?.id) {
        throw new Error('Данные книги недоступны.');
      }
      let updated = null;
      try {
        updated = await moderateBook(book.id, { action: 'approved' });
      } catch (moderationError) {
        console.warn('[ModerationDetails] Fallback to direct Supabase update:', moderationError);
        updated = await Book.update(book.id, { status: 'approved', moderator_email: user.email });
      }
      setBook(prev => ({ ...(prev || {}), ...(updated || { status: 'approved', moderator_email: user.email }) }));
      invalidateCache();
      toast.success('Книга успешно одобрена!');
      window.history.back();
    } catch (err) {
      toast.error('Ошибка при одобрении: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (rejectionData) => {
    setIsProcessing(true);
    try {
      if (!book?.id) {
        throw new Error('Данные книги недоступны.');
      }
      let updated = null;
      try {
        updated = await moderateBook(book.id, {
          action: 'rejected',
          rejectionInfo: rejectionData,
          rejectionReason: rejectionData?.reason ?? null
        });
      } catch (moderationError) {
        console.warn('[ModerationDetails] Fallback to direct Supabase update:', moderationError);
        updated = await Book.update(book.id, {
          status: 'rejected',
          rejection_info: rejectionData,
          rejection_reason: rejectionData?.reason,
          moderator_email: user.email
        });
      }
      setBook(prev => ({
        ...(prev || {}),
        ...(updated || {}),
        status: updated?.status || 'rejected',
        moderator_email: updated?.moderator_email || user.email,
        rejection_info: updated?.rejection_info || rejectionData
      }));
      invalidateCache();
      toast.success('Книга отклонена.');
      setRejectionDialogOpen(false);
      window.history.back();
    } catch (err) {
      toast.error('Ошибка при отклонении: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireRole="moderator">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requireRole="moderator">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Ошибка загрузки</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchBookDetails}>Попробовать снова</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!book) {
    return (
      <ProtectedRoute requireRole="moderator">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Книга не найдена</h2>
            <Button asChild>
              <Link to={createPageUrl('ModerationPage')}>Вернуться к модерации</Link>
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireRole="moderator">
      <div className="container mx-auto px-4 py-8">
        {/* Навигация */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to={createPageUrl('ModerationPage')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Модерация книги</h1>
            <p className="text-muted-foreground">Подробная информация для принятия решения</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Обложка и основная информация */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <img
                    src={getCoverOrPlaceholder(book, `https://picsum.photos/seed/${book.id}/300/400`)}
                    alt={book.title || 'Обложка книги'}
                    className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{book.author_email || 'Автор неизвестен'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {book.created_at ? new Date(book.created_at).toLocaleDateString() : 'Дата не указана'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{book.genre || 'Не указан'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{book.price_kas || 0} KAS</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Детальная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Основная информация (Title and Description for the main book) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{book.title || 'Без названия'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {book.description || 'Описание отсутствует'}
                </p>
                
                {book.mood && (
                  <div className="mb-4">
                    <Badge variant="secondary">{book.mood}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Языковые версии - названия и описания */}
            {book.languages && book.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Языковые версии книги
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {book.languages.map((lang, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-sm font-medium">
                            {(lang.lang || 'unknown').toUpperCase()}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                          {lang.title || 'Название не указано'}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {lang.description || 'Описание отсутствует'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* НОВЫЙ БЛОК: Галерея обложек */}
            <CoverGallery coverImages={book.cover_images} />

            {/* Предпросмотр книги */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Предпросмотр книги
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1"
                  >
                    <Link
                      to={createPageUrl(`BookDetails?id=${book.id}&preview=true`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Страница книги
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="flex-1"
                  >
                    <Link
                      to={createPageUrl(`Reader?bookId=${book.id}&preview=true`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Открыть в ридере
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Ссылки откроются в новых вкладках и доступны даже для книг на модерации.
                </p>
              </CardContent>
            </Card>

            {/* Файлы для скачивания */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Файлы книги
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Основной файл */}
                  {book.file_url && (
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Основной файл</p>
                        <p className="text-sm text-muted-foreground">PDF файл книги</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(book.file_url, `${book.title || 'book'}.pdf`)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Скачать
                      </Button>
                    </div>
                  )}

                  {/* Файлы языковых версий */}
                  {book.languages && book.languages.map((lang, index) => {
                    if (!lang.file_url) return null; // Only render if file_url exists
                    
                    return (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {(lang.lang || 'unknown').toUpperCase()} - {lang.title || 'Без названия'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lang.description ? `${lang.description.substring(0, 100)}${lang.description.length > 100 ? '...' : ''}` : 'Описание отсутствует'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(
                            lang.file_url, 
                            `${lang.title || 'book'}_${lang.lang}.pdf`
                          )}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Скачать
                        </Button>
                      </div>
                    );
                  })}

                  {!book.file_url && (!book.languages || book.languages.filter(l => l.file_url).length === 0) && (
                    <p className="text-muted-foreground text-center py-4">
                      Файлы для скачивания отсутствуют
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Инструменты анализа */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Анализ контента
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Используйте промпт для анализа в Grok AI или другом ИИ-помощнике
                  </p>
                  
                  <Button
                    variant="outline"
                    onClick={handleCopyPrompt}
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Скопировать промпт для анализа
                  </Button>
                  
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Просмотреть промпт
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap">
                      {GROK_PROMPT}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>

            {/* Действия модератора */}
            <Card>
              <CardHeader>
                <CardTitle>Решение модератора</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Одобрить и опубликовать
                  </Button>
                  
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setRejectionDialogOpen(true)}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Отклонить
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Диалог отклонения */}
        <RejectionDialog
          book={book}
          isOpen={rejectionDialogOpen}
          onClose={() => setRejectionDialogOpen(false)}
          onConfirm={handleReject}
        />
      </div>
    </ProtectedRoute>
  );
}
