import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Check,
  Trash2,
  Languages,
  DollarSign,
  Zap,
  Shield,
  BookOpen,
  Loader2
} from 'lucide-react';

import { useAuth } from '../auth/Auth';
import { UploadFile } from '@/api/integrations';
import { detectLanguageFromFile, getLanguageMetadata, isSameLanguage } from '@/utils/languageDetection';
import { buildSupabasePath } from '@/utils/storagePaths';
import { createBook } from '../utils/supabase';
import { determineFileType, extractRawTextFromFileBlob, htmlFromRawText } from '@/utils/bookContent';

const GENRES = [
  { value: 'fiction', label: 'Художественная литература', emoji: '📚' },
  { value: 'non-fiction', label: 'Документальная литература', emoji: '📖' },
  { value: 'science', label: 'Наука', emoji: '🔬' },
  { value: 'history', label: 'История', emoji: '🏛️' },
  { value: 'business', label: 'Бизнес', emoji: '💼' },
  { value: 'romance', label: 'Романтика', emoji: '💕' },
  { value: 'mystery', label: 'Детектив', emoji: '🔍' },
  { value: 'fantasy', label: 'Фэнтези', emoji: '🧙‍♂️' },
  { value: 'biography', label: 'Биография', emoji: '👤' },
  { value: 'self-help', label: 'Саморазвитие', emoji: '🌟' }
];

const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'pt', label: 'Português', flag: '🇵🇹' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' }
];

const SHOULD_CONVERT_TO_HTML = new Set(['pdf', 'epub', 'docx', 'txt']);

const wrapHtmlDocument = (body = '', lang = 'ru') =>
  `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8" /></head><body>${body}</body></html>`;

// Drag & Drop зона с анимацией
const DropZone = ({ onDrop, accept, maxSize, children, isDragActive, className = '' }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = React.useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Проверка размера
      if (maxSize && file.size > maxSize) {
        toast.error(`Файл слишком большой. Максимум: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }

      // Проверка типа
      if (accept) {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const fileType = file.type;
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type.toLowerCase();
          }
          return fileType.startsWith(type.split('/')[0]);
        });

        if (!isAccepted) {
          toast.error('Неподдерживаемый тип файла');
          return;
        }
      }

      onDrop(file);
    }
  }, [accept, maxSize, onDrop]);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Те же проверки
      if (maxSize && file.size > maxSize) {
        toast.error(`Файл слишком большой. Максимум: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }

      onDrop(file);
    }
  }, [maxSize, onDrop]);

  const isActive = dragActive || isDragActive;

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden
        ${isActive 
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20 scale-105 glow-border' 
          : 'border-border hover:border-primary/50 hover:bg-primary/[0.02]'
        }
        ${className}
      `}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      {children}
      
      {/* Glow effect для активного состояния */}
      <style jsx>{`
        .glow-border {
          box-shadow: 0 0 20px rgba(106, 76, 147, 0.3);
          background: linear-gradient(135deg, rgba(106, 76, 147, 0.1) 0%, rgba(255, 107, 0, 0.05) 100%);
        }
        
        @media (prefers-reduced-motion: reduce) {
          .glow-border {
            box-shadow: none;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default function BookUploadForm({ onUploadSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Files
  const [bookFile, setBookFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [languageDetectionError, setLanguageDetectionError] = useState(null);
  const [languageDetectionInfo, setLanguageDetectionInfo] = useState(null);

  // Form data
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [plagiarismResult, setPlagiarismResult] = useState(null);
  const [translationPrice, setTranslationPrice] = useState(0);

  const originalLanguage = detectedLanguage || 'ru';
  const originalLanguageMeta = React.useMemo(
    () => getLanguageMetadata(originalLanguage),
    [originalLanguage]
  );
  const translationLanguages = React.useMemo(
    () => LANGUAGES.filter((lang) => !isSameLanguage(lang.value, originalLanguage)),
    [originalLanguage]
  );

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      title: '',
      description: '',
      price_kas: 5.0
    }
  });

  // Расчет цены перевода
  React.useEffect(() => {
    if (bookFile && selectedLanguages.length > 0) {
      const basePrice = 2; // $2 базовая цена
      const sizeMultiplier = Math.min(bookFile.size / (10 * 1024 * 1024), 3); // до 3x за размер
      const pricePerLang = basePrice + sizeMultiplier;
      const total = selectedLanguages.length * pricePerLang;
      setTranslationPrice(Math.min(total, 5 * selectedLanguages.length)); // макс $5 за язык
    } else {
      setTranslationPrice(0);
    }
  }, [bookFile, selectedLanguages]);

  React.useEffect(() => {
    setSelectedLanguages((prev) => prev.filter((lang) => translationLanguages.some((option) => option.value === lang)));
  }, [translationLanguages]);

  const handleGenreToggle = (genreValue) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreValue)) {
        return prev.filter(g => g !== genreValue);
      } else if (prev.length < 3) {
        return [...prev, genreValue];
      } else {
        toast.warning('Можно выбрать максимум 3 жанра');
        return prev;
      }
    });
  };

  const handleLanguageToggle = (langValue) => {
    if (!translationLanguages.some((lang) => lang.value === langValue)) {
      toast.info('Этот язык уже является языком оригинала и не требует перевода.');
      return;
    }

    setSelectedLanguages(prev => {
      if (prev.includes(langValue)) {
        return prev.filter(l => l !== langValue);
      } else if (prev.length < 10) {
        return [...prev, langValue];
      } else {
        toast.warning('Можно выбрать максимум 10 языков');
        return prev;
      }
    });
  };

  const handleBookFileDrop = useCallback(async (file) => {
    setBookFile(file);
    setDetectedLanguage(null);
    setLanguageDetectionError(null);
    setLanguageDetectionInfo(null);
    setSelectedLanguages([]);
    setPlagiarismResult(null);

    if (!file) {
      setIsDetectingLanguage(false);
      return;
    }

    const detectionToastId = 'language-detection';
    setIsDetectingLanguage(true);
    toast.loading('Определяем язык книги...', { id: detectionToastId });

    try {
      const language = await detectLanguageFromFile(file);
      if (language) {
        setDetectedLanguage(language);
        setLanguageDetectionInfo(null);
        setSelectedLanguages((prev) => prev.filter((value) => !isSameLanguage(value, language)));
        const meta = getLanguageMetadata(language);
        toast.success(`Язык оригинала: ${meta.flag} ${meta.label}`, { id: detectionToastId });
      } else {
        setDetectedLanguage(null);
        setLanguageDetectionError(null);
        const message = 'Не удалось автоматически определить язык книги. По умолчанию используется русский.';
        setLanguageDetectionInfo(message);
        toast.warning(message, { id: detectionToastId });
      }
    } catch (error) {
      console.error('Language detection error:', error);
      const message = error instanceof Error ? error.message : 'Не удалось определить язык книги.';
      setDetectedLanguage(null);
      setLanguageDetectionError(message);
      setLanguageDetectionInfo(null);
      toast.error(message, { id: detectionToastId });
    } finally {
      setIsDetectingLanguage(false);
    }

    // Запуск проверки на плагиат (мок)
    toast.loading('Проверка на плагиат...', { id: 'plagiarism' });

    setTimeout(() => {
      const mockScore = Math.floor(Math.random() * 20) + 5; // 5-25%
      setPlagiarismResult({
        score: mockScore,
        risk: mockScore > 15 ? 'high' : mockScore > 10 ? 'medium' : 'low'
      });
      toast.success(`Проверка завершена: ${mockScore}% совпадений`, { id: 'plagiarism' });
    }, 2000);
  }, []);

  const handleCoverFileDrop = useCallback((file) => {
    // Проверка размеров обложки
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width !== 400 || img.height !== 600) {
          toast.error(`Неверный размер: ${img.width}x${img.height}. Требуется: 400x600px`);
          return;
        }
        setCoverFile(file);
        toast.success('Обложка соответствует требованиям!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const onSubmit = async (data) => {
    if (!bookFile || !coverFile) {
      toast.error('Пожалуйста, загрузите все необходимые файлы');
      return;
    }

    if (selectedGenres.length === 0) {
      toast.error('Выберите хотя бы один жанр');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const kind = determineFileType(bookFile);
      let fileToUpload = bookFile;
      let uploadExtension = (bookFile.name.split('.').pop() || '').toLowerCase();
      let uploadFormat = kind === 'unknown' ? uploadExtension : kind;
      let isHtmlAsset = kind === 'html';

      if (SHOULD_CONVERT_TO_HTML.has(kind)) {
        toast.info('Конвертация книги в HTML...', { id: 'upload-convert' });
        const rawText = await extractRawTextFromFileBlob(bookFile);
        if (rawText && rawText.trim()) {
          const htmlBody = htmlFromRawText(rawText);
          const safeName = bookFile.name.replace(/\.[^/.]+$/, '') || 'book';
          const langCode = detectedLanguage || 'ru';
          const htmlDocument = wrapHtmlDocument(htmlBody, langCode);
          const htmlBlob = new Blob([htmlDocument], { type: 'text/html' });
          fileToUpload = new File([htmlBlob], `${safeName}.html`, { type: 'text/html' });
          uploadExtension = 'html';
          uploadFormat = 'html';
          isHtmlAsset = true;
          toast.success('Файл конвертирован в HTML', { id: 'upload-convert' });
        } else {
          toast.dismiss('upload-convert');
          toast.warning('Не удалось извлечь текст из файла. Загружаем оригинальный файл.');
        }
      }

      // 1. Загрузка файлов
      setUploadProgress(25);
      toast.loading('Загрузка файлов...', { id: 'upload' });

      const originalLang = detectedLanguage || 'ru';
      const [{ file_url: bookUrl }, { file_url: coverUrl }] = await Promise.all([
        UploadFile({ file: fileToUpload, path: buildSupabasePath('books/originals', fileToUpload) }),
        UploadFile({ file: coverFile, path: buildSupabasePath('books/covers', coverFile) })
      ]);

      // 2. Создание книги
      setUploadProgress(50);
      toast.loading('Создание книги...', { id: 'upload' });
      
      const coverImages = {
        default: coverUrl,
        portrait_large: coverUrl,
      };

      const bookData = {
        title: data.title,
        author: user?.full_name || 'Неизвестный автор',
        author_email: user?.email,
        author_id: user?.id,
        description: data.description,
        price_kas: parseFloat(data.price_kas),
        genre: selectedGenres[0],
        genres: selectedGenres,
        cover_images: coverImages,
        languages: [
          {
            lang: originalLang,
            title: data.title,
            description: data.description,
            file_url: bookUrl,
            original: true,
            extension: uploadExtension,
            format: uploadFormat,
            isHtml: isHtmlAsset
          }
        ],
        status: 'pending'
      };

      const createdBook = await createBook(bookData);
      setUploadProgress(75);

      if (selectedLanguages.length > 0) {
        toast.info('Автоматический перевод временно отключен. Выбранные языки сохранены для последующей обработки.', { id: 'upload' });
      }

      setUploadProgress(100);
      toast.success('Книга успешно загружена!', { id: 'upload' });
      
      // Сброс формы
      setBookFile(null);
      setCoverFile(null);
      setSelectedGenres([]);
      setSelectedLanguages([]);
      setPlagiarismResult(null);
      setDetectedLanguage(null);
      setLanguageDetectionError(null);
      setLanguageDetectionInfo(null);
      setStep(1);
      
      onUploadSuccess?.(createdBook);

    } catch (error) {
      console.error('Upload error:', error);

      if (error instanceof Error && error.message.includes('Требуется аутентификация')) {
        toast.error('Сессия истекла. Пожалуйста, войдите снова, чтобы продолжить загрузку книги.', {
          id: 'upload'
        });
      } else {
        toast.error('Ошибка при загрузке книги: ' + error.message, { id: 'upload' });
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Прогресс */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <motion.div
            key={stepNumber}
            className={`flex items-center ${stepNumber < 3 ? 'flex-1' : ''}`}
          >
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all
                ${stepNumber <= step 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-muted text-muted-foreground border-muted-foreground/30'
                }
              `}
            >
              {stepNumber < step ? <Check className="w-5 h-5" /> : stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`h-0.5 flex-1 mx-4 ${stepNumber < step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </motion.div>
        ))}
      </div>

      {isUploading && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Загрузка книги...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress 
                value={uploadProgress} 
                className="h-3 transition-all duration-300"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={stepVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Основная информация о книге
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">Название книги *</Label>
                    <Input
                      id="title"
                      {...register('title', { required: 'Введите название книги' })}
                      className="mt-1 min-h-[48px]"
                      placeholder="Введите название..."
                    />
                    {errors.title && (
                      <p className="text-destructive text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="price_kas">Цена (KAS) *</Label>
                    <Input
                      id="price_kas"
                      type="number"
                      step="0.1"
                      min="0.1"
                      {...register('price_kas', { 
                        required: 'Укажите цену',
                        min: { value: 0.1, message: 'Минимальная цена 0.1 KAS' }
                      })}
                      className="mt-1 min-h-[48px]"
                    />
                    {errors.price_kas && (
                      <p className="text-destructive text-sm mt-1">{errors.price_kas.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Описание книги *</Label>
                  <Textarea
                    id="description"
                    {...register('description', { required: 'Добавьте описание' })}
                    className="mt-1 min-h-[120px]"
                    placeholder="Расскажите о сюжете, главных героях..."
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Жанры */}
                <div>
                  <Label className="text-base font-medium">Жанры (до 3-х)</Label>
                  <div className="grid md:grid-cols-2 gap-3 mt-3">
                    {GENRES.map((genre) => (
                      <motion.div
                        key={genre.value}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <Checkbox
                          id={genre.value}
                          checked={selectedGenres.includes(genre.value)}
                          onCheckedChange={() => handleGenreToggle(genre.value)}
                          disabled={!selectedGenres.includes(genre.value) && selectedGenres.length >= 3}
                        />
                        <Label
                          htmlFor={genre.value}
                          className="flex items-center gap-2 cursor-pointer flex-1 min-h-[24px]"
                        >
                          <span className="text-lg">{genre.emoji}</span>
                          <span className="text-sm">{genre.label}</span>
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                  {selectedGenres.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedGenres.map((genreValue) => {
                        const genre = GENRES.find(g => g.value === genreValue);
                        return (
                          <Badge key={genreValue} variant="secondary">
                            {genre?.emoji} {genre?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep(2)}
                    disabled={!watch('title') || selectedGenres.length === 0}
                    className="min-h-[48px] px-8"
                  >
                    Далее: Файлы
                    <FileText className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Загрузка файла книги */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Файл книги
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DropZone
                    onDrop={handleBookFileDrop}
                    accept=".pdf,.epub,.txt,.doc,.docx"
                    maxSize={100 * 1024 * 1024} // 100MB
                    className="p-8 text-center min-h-[200px] flex flex-col items-center justify-center"
                  >
                    {bookFile ? (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="space-y-4"
                      >
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-700">{bookFile.name}</p>
                          <p className="text-sm text-green-600">
                            {(bookFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookFile(null);
                            setPlagiarismResult(null);
                          }}
                          className="min-h-[48px]"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Upload className="w-12 h-12 text-muted-foreground" />
                        </motion.div>
                        <div>
                          <p className="text-lg font-medium">
                            Перетащите файл книги или нажмите для выбора
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            PDF, EPUB, TXT, DOC, DOCX • До 100MB
                          </p>
                        </div>
                      </div>
                    )}
                  </DropZone>

                  {isDetectingLanguage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <Alert className="border-primary/20">
                        <AlertDescription className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          Определяем язык книги...
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {!isDetectingLanguage && detectedLanguage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <Alert className="border-green-500/40 bg-green-50/40 dark:bg-green-950/20">
                        <AlertDescription className="flex items-center gap-2 text-sm">
                          <span className="text-xl">{originalLanguageMeta.flag}</span>
                          <span>
                            Язык оригинала: <span className="font-medium">{originalLanguageMeta.label}</span>
                          </span>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {!isDetectingLanguage && languageDetectionInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <Alert className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
                        <AlertDescription className="text-sm">{languageDetectionInfo}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {!isDetectingLanguage && languageDetectionError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <Alert variant="destructive">
                        <AlertDescription className="text-sm">{languageDetectionError}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Результат проверки на плагиат */}
                  {plagiarismResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <Alert className={plagiarismResult.risk === 'high' ? 'border-destructive' : 'border-green-500'}>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-medium">
                              Проверка на плагиат: {plagiarismResult.score}% совпадений
                            </p>
                            <Progress 
                              value={plagiarismResult.score} 
                              className={`h-2 ${plagiarismResult.risk === 'high' ? 'bg-red-100' : 'bg-green-100'}`}
                            />
                            <p className="text-xs text-muted-foreground">
                              {plagiarismResult.risk === 'high' 
                                ? 'Высокий риск плагиата. Рекомендуется проверить оригинальность содержания.'
                                : 'Низкий риск плагиата. Содержание выглядит оригинальным.'
                              }
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Загрузка обложки */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-primary" />
                    Обложка книги
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DropZone
                    onDrop={handleCoverFileDrop}
                    accept="image/png,image/jpeg,image/webp"
                    maxSize={5 * 1024 * 1024} // 5MB
                    className="p-6 text-center min-h-[150px] flex flex-col items-center justify-center"
                  >
                    {coverFile ? (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="space-y-3"
                      >
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-700">{coverFile.name}</p>
                          <p className="text-sm text-green-600">400×600px</p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Загрузите обложку</p>
                          <p className="text-xs text-muted-foreground">
                            Размер: точно 400×600px • PNG, JPG, WEBP • До 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </DropZone>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="min-h-[48px] px-8"
                >
                  Назад
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  disabled={!bookFile || !coverFile}
                  className="min-h-[48px] px-8"
                >
                  Далее: Переводы
                  <Languages className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="w-6 h-6 text-primary" />
                  Автоматический перевод (опционально)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                    <span className="text-lg">{originalLanguageMeta.flag}</span>
                    <span className="text-sm font-medium">Язык оригинала: {originalLanguageMeta.label}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Выберите языки, отличные от оригинала, для будущего перевода
                  </span>
                </div>

                {!detectedLanguage && !isDetectingLanguage && (
                  <Alert className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
                    <AlertDescription className="text-xs">
                      Не удалось автоматически определить язык файла. По умолчанию используется русский.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {translationLanguages.map((lang) => (
                    <motion.div
                      key={lang.value}
                      whileHover={{ scale: 1.05 }}
                      className={`
                        p-3 border-2 rounded-lg cursor-pointer transition-all
                        ${selectedLanguages.includes(lang.value)
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50 hover:bg-primary/[0.02]'
                        }
                      `}
                      onClick={() => handleLanguageToggle(lang.value)}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{lang.flag}</div>
                        <div className="text-sm font-medium">{lang.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Alert className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
                  <AlertDescription className="text-sm">
                    Автоматический перевод временно отключен. Мы сохраним выбранные языки и запустим перевод позднее.
                  </AlertDescription>
                </Alert>

                {selectedLanguages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-4 rounded-lg border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Стоимость перевода:</span>
                      </div>
                      <div className="text-xl font-bold text-green-700">
                        ${translationPrice.toFixed(2)}
                      </div>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      {selectedLanguages.length} языков × ${(translationPrice / selectedLanguages.length).toFixed(2)} за язык
                    </p>
                  </motion.div>
                )}

                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(2)}
                    className="min-h-[48px] px-8"
                  >
                    Назад
                  </Button>
                  <Button 
                    onClick={handleSubmit(onSubmit)}
                    disabled={isUploading}
                    className="min-h-[48px] px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {isUploading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Загрузка...
                      </>
                    ) : selectedLanguages.length > 0 ? (
                      <>
                        Загрузить книгу (перевод позже)
                        <Zap className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Загрузить книгу
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}