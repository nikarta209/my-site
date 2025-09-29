
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from "@/components/ui/switch";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Check,
  Trash2,
  PlusCircle,
  Languages,
  Info,
  Bot,
  Globe,
  DollarSign,
  Sparkles,
  Zap,
  X,
  Lock, // Added Lock icon
  CheckCircle, // Added CheckCircle icon
  Trophy, // Added Trophy icon
  Newspaper, // Added Newspaper icon
  Library, // Added Library icon
  Tv, // Added Tv icon
  Loader2
} from 'lucide-react';

import { Book } from '@/api/entities';
import { useAuth } from '../auth/Auth';
import { UploadFile } from '@/api/integrations';
import { useExchangeRate } from '../utils/ExchangeRateContext';
import { useCoinGecko, AnimatedPrice } from '../api/CoinGeckoAPI';
import { getAuthorStats } from '@/api/functions'; // Added getAuthorStats
import { detectLanguageFromFile, getLanguageMetadata, isSameLanguage } from '@/utils/languageDetection';
import { buildSupabasePath } from '@/utils/storagePaths';

const GENRES_DATA = [
    {
        category: '📚 Художественная литература',
        genres: [
            { value: 'roman', label: 'Роман' },
            { value: 'povest', label: 'Повесть' },
            { value: 'rasskaz', label: 'Рассказ' },
            { value: 'novella', label: 'Новелла' },
            { value: 'poeziya', label: 'Поэзия' },
            { value: 'drama', label: 'Драма' },
            { value: 'esse', label: 'Эссе' },
            { value: 'stsenarii', label: 'Сценарии' },
            { value: 'sovremennaya-proza', label: 'Современная проза' },
            { value: 'klassicheskaya-literatura', label: 'Классическая литература' },
            { value: 'istoricheskaya-proza', label: 'Историческая проза' },
            { value: 'psikhologicheskaya-proza', label: 'Психологическая проза' },
            { value: 'lyubovnyy-roman', label: 'Любовный роман' },
            { value: 'satira-yumor', label: 'Сатира / юмор' },
            { value: 'avantyurnyy-roman', label: 'Авантюрный роман' },
            { value: 'sotsialnaya-proza', label: 'Социальная проза' },
        ]
    },
    {
        category: '🌌 Фантастика и фэнтези',
        genres: [
            { value: 'fentezi', label: 'Фэнтези' },
            { value: 'nauchnaya-fantastika', label: 'Научная фантастика' },
            { value: 'postapokalipsis', label: 'Постапокалипсис' },
            { value: 'antiutopiya', label: 'Антиутопия' },
            { value: 'kiberpank', label: 'Киберпанк' },
            { value: 'stimpank', label: 'Стимпанк' },
            { value: 'kosmicheskaya-opera', label: 'Космическая опера' },
            { value: 'alternativnaya-istoriya', label: 'Альтернативная история' },
            { value: 'mistika', label: 'Мистика' },
            { value: 'uzhasy', label: 'Ужасы' },
            { value: 'paranormalnoe', label: 'Паранормальное' },
        ]
    },
    {
        category: '🔍 Детективы и триллеры',
        genres: [
            { value: 'klassicheskiy-detektiv', label: 'Классический детектив' },
            { value: 'politseyskiy-detektiv', label: 'Полицейский детектив' },
            { value: 'psikhologicheskiy-triller', label: 'Психологический триллер' },
            { value: 'yuridicheskiy-triller', label: 'Юридический триллер' },
            { value: 'shpionskiy-roman', label: 'Шпионский роман' },
            { value: 'kriminalnaya-drama', label: 'Криминальная драма' },
            { value: 'nuar', label: 'Нуар' },
            { value: 'saspens', label: 'Саспенс' },
            { value: 'cozy-detektiv', label: 'Уютный детектив' },
            { value: 'voennyy-triller', label: 'Военный триллер' },
        ]
    },
    {
        category: '🌍 Нон-фикшн / Документальная литература',
        genres: [
            { value: 'biografii-memuary', label: 'Биографии и мемуары' },
            { value: 'istoriya', label: 'История' },
            { value: 'publitsistika', label: 'Публицистика' },
            { value: 'nauchno-populyarnoe', label: 'Научно-популярное' },
            { value: 'politika', label: 'Политика' },
            { value: 'filosofiya', label: 'Философия' },
            { value: 'religiya-dukhovnye-praktiki', label: 'Религия и духовные практики' },
            { value: 'psikhologiya', label: 'Психология' },
            { value: 'sotsiologiya', label: 'Социология' },
            { value: 'kulturologiya', label: 'Культурология' },
            { value: 'zhurnalistskie-rassledovaniya', label: 'Журналистские расследования' },
            { value: 'ekologiya', label: 'Экология' },
        ]
    },
    {
        category: '🧠 Саморазвитие и образование',
        genres: [
            { value: 'lichnostnyy-rost', label: 'Личностный рост' },
            { value: 'psikhologiya-uspekha', label: 'Психология успеха' },
            { value: 'effektivnost-taym-menedzhment', label: 'Эффективность и тайм-менеджмент' },
            { value: 'biznes-literatura', label: 'Бизнес-литература' },
            { value: 'finansovaya-gramotnost', label: 'Финансовая грамотность' },
            { value: 'marketing-reklama', label: 'Маркетинг и реклама' },
            { value: 'upravlenie-liderstvo', label: 'Управление и лидерство' },
            { value: 'publichnye-vystupleniya', label: 'Публичные выступления' },
            { value: 'motivatsiya', label: 'Мотивация' },
        ]
    },
    {
        category: '🧒 Детская и подростковая литература',
        genres: [
            { value: 'dlya-malyshey', label: 'Книги для малышей (0–3)' },
            { value: 'dlya-doshkolnikov', label: 'Книги для дошкольников (3–6)' },
            { value: 'dlya-mladshego-shkolnogo-vozrasta', label: 'Книги для младшего школьного возраста' },
            { value: 'young-adult', label: 'Подростковая литература (Young Adult)' },
            { value: 'skazki', label: 'Сказки' },
            { value: 'detskoe-fentezi-priklyucheniya', label: 'Детское фэнтези и приключения' },
        ]
    },
    {
        category: '🥘 Хобби, досуг и творчество',
        genres: [
            { value: 'kulinariya', label: 'Кулинария' },
            { value: 'rukodelie-diy', label: 'Рукоделие / DIY' },
            { value: 'dom-interer', label: 'Дом и интерьер' },
            { value: 'sad-ogorod', label: 'Сад и огород' },
            { value: 'zhivopis-risovanie', label: 'Живопись / Рисование' },
            { value: 'muzyka', label: 'Музыка' },
            { value: 'moda-stil', label: 'Мода и стиль' },
            { value: 'puteshestviya-putevoditeli', label: 'Путешествия / путеводители' },
        ]
    },
    {
        category: '🧘 Здоровье и тело',
        genres: [
            { value: 'fizicheskoe-zdorove', label: 'Физическое здоровье' },
            { value: 'pitanie-diety', label: 'Питание и диеты' },
            { value: 'fitnes-yoga', label: 'Фитнес / Йога' },
            { value: 'psikhosomatika', label: 'Психосоматика' },
        ]
    },
    {
        category: '💻 Техника и технологии',
        genres: [
            { value: 'programmirovanie', label: 'Программирование' },
            { value: 'iskusstvennyy-intellekt', label: 'Искусственный интеллект' },
            { value: 'informatsionnye-tekhnologii', label: 'Информационные технологии' },
            { value: 'matematika', label: 'Математика' },
            { value: 'fizika-astronomiya', label: 'Физика и астрономия' },
            { value: 'biologiya', label: 'Биология' },
        ]
    }
];


const MOODS = [
  { value: 'inspiring', label: 'Вдохновляющее' },
  { value: 'relaxing', label: 'Расслабляющее' },
  { value: 'exciting', label: 'Захватывающее' },
  { value: 'educational', label: 'Познавательное' },
  { value: 'emotional', label: 'Эмоциональное' },
  { value: 'thoughtful', label: 'Заставляющее думать' }
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

function DropZone({ onDrop, accept, multiple = false, maxSize, children, className = '' }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const validatedFiles = files.filter(file => {
        if (maxSize && file.size > maxSize) {
          toast.error(`Файл ${file.name} слишком большой. Максимальный размер: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
          return false;
        }
        if (accept) {
          const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());
          const fileType = file.type.toLowerCase();
          const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

          const isAccepted = acceptedTypes.some(acceptedType => {
            if (acceptedType.startsWith('.')) {
              return fileExtension === acceptedType;
            } else if (acceptedType.endsWith('/*')) {
              return fileType.startsWith(acceptedType.split('/')[0]);
            }
            return fileType === acceptedType;
          });

          if (!isAccepted) {
            toast.error(`Файл ${file.name} имеет неподдерживаемый тип.`);
            return false;
          }
        }
        return true;
      });

      if (validatedFiles.length > 0) {
        onDrop(multiple ? validatedFiles : validatedFiles[0]);
      }
    }
  }, [accept, maxSize, multiple, onDrop]);

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validatedFiles = files.filter(file => {
        if (maxSize && file.size > maxSize) {
          toast.error(`Файл ${file.name} слишком большой. Максимальный размер: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
          return false;
        }
        if (accept) {
          const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());
          const fileType = file.type.toLowerCase();
          const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

          const isAccepted = acceptedTypes.some(acceptedType => {
            if (acceptedType.startsWith('.')) {
              return fileExtension === acceptedType;
            } else if (acceptedType.endsWith('/*')) {
              return fileType.startsWith(acceptedType.split('/')[0]);
            }
            return fileType === acceptedType;
          });

          if (!isAccepted) {
            toast.error(`Файл ${file.name} имеет неподдерживаемый тип.`);
            return false;
          }
        }
        return true;
      });

      if (validatedFiles.length > 0) {
        onDrop(multiple ? validatedFiles : validatedFiles[0]);
      }
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer
        ${isDragActive
          ? 'border-purple-500 bg-purple-100 shadow-lg shadow-purple-200 scale-105'
          : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
        }
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {children}
    </div>
  );
}

const BookCoverUpload = ({ coverFile, onFileChange, onRemove, size = 'default', disabled = false, unlockCondition = '' }) => {
  const options = {
    default: {
      title: "Стандартная обложка (портрет) *",
      description: "Размер: 400×600 пикселей • Формат: PNG, JPG, WEBP • Максимум: 5MB",
      width: 400,
      height: 600,
      maxSize: 5 * 1024 * 1024
    },
    portrait_large: {
      title: "Высокая обложка (для 'Популярного')",
      description: "Рекомендуемый размер: 800x1000 пикселей • Максимум: 8MB",
      width: 800,
      height: 1000,
      maxSize: 8 * 1024 * 1024
    },
    landscape: {
      title: "Широкая обложка (для 'Подборок')",
      description: "Рекомендуемый размер: 1600x900 пикселей • Максимум: 10MB",
      width: 1600,
      height: 900,
      maxSize: 10 * 1024 * 1024
    },
    square: {
      title: "Квадратная обложка (для баннеров)",
      description: "Рекомендуемый размер: 600x600 пикселей • Максимум: 5MB",
      width: 600,
      height: 600,
      maxSize: 5 * 1024 * 1024
    },
    main_banner: {
      title: "Главный баннер (для промо)",
      description: "Эта обложка будет отображаться на главной странице.",
      width: 1920,
      height: 1080,
      maxSize: 10 * 1024 * 1024
    },
    // NEW SIZES
    notes_1: {
      title: "Обложка для 'Заметки' (№1)",
      description: "Рекомендуемый размер: 600x400 пикселей • Максимум: 5MB",
      width: 600,
      height: 400,
      maxSize: 5 * 1024 * 1024
    },
    library_hero: {
      title: "Баннер для 'Библиотека'",
      description: "Рекомендуемый размер: 1200x400 пикселей • Максимум: 8MB",
      width: 1200,
      height: 400,
      maxSize: 8 * 1024 * 1024
    },
    notes_2: {
      title: "Обложка для 'Заметки' (№2)",
      description: "Рекомендуемый размер: 600x400 пикселей • Максимум: 5MB",
      width: 600,
      height: 400,
      maxSize: 5 * 1024 * 1024
    },
  };

  const currentOptions = options[size];

  const handleCoverFileSelect = useCallback((file) => {
    if (!file) {
      if (onFileChange) onFileChange(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение для обложки');
      if (onFileChange) onFileChange(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Only validate size if it's not the main_banner (which doesn't have a file input here)
        if (size !== 'main_banner' && (img.width < currentOptions.width * 0.9 || img.height < currentOptions.height * 0.9)) {
          toast.warning(`Размер обложки (${img.width}x${img.height}) меньше рекомендуемого`, {
            description: `Рекомендуется: ${currentOptions.width}x${currentOptions.height} пикселей. Изображение может выглядеть нечетким.`
          });
        }
        if (onFileChange) onFileChange(file);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, [onFileChange, currentOptions, size]);


  let accentColor = 'purple';
  let bgColorFrom = 'purple-50';
  let bgColorTo = 'pink-50';
  let borderColor = 'purple-200';
  let iconColor = 'purple-600';

  if (size === 'portrait_large') {
    accentColor = 'blue';
    bgColorFrom = 'blue-50';
    bgColorTo = 'cyan-50';
    borderColor = 'blue-200';
    iconColor = 'blue-600';
  } else if (size === 'landscape') {
    accentColor = 'green';
    bgColorFrom = 'green-50';
    bgColorTo = 'emerald-50';
    borderColor = 'green-200';
    iconColor = 'green-600';
  } else if (size === 'square') {
    accentColor = 'yellow';
    bgColorFrom = 'yellow-50';
    bgColorTo = 'orange-50';
    borderColor = 'yellow-200';
    iconColor = 'yellow-600';
  } else if (size === 'main_banner') {
    accentColor = 'red';
    bgColorFrom = 'red-50';
    bgColorTo = 'rose-50';
    borderColor = 'red-200';
    iconColor = 'red-600';
  } else if (size === 'notes_1' || size === 'notes_2') {
    accentColor = 'teal';
    bgColorFrom = 'teal-50';
    bgColorTo = 'emerald-50';
    borderColor = 'teal-200';
    iconColor = 'teal-600';
  } else if (size === 'library_hero') {
    accentColor = 'indigo';
    bgColorFrom = 'indigo-50';
    bgColorTo = 'blue-50';
    borderColor = 'indigo-200';
    iconColor = 'indigo-600';
  }


  return (
    <Card className={`bg-gradient-to-br from-${bgColorFrom} to-${bgColorTo} border-2 border-${borderColor} shadow-xl relative`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 text-${iconColor}`}>
          <ImageIcon className="w-6 h-6" />
          {currentOptions.title}
          {disabled && (
            <span className="ml-2 text-sm text-gray-500 flex items-center gap-1">
              <Lock className="w-4 h-4" /> Доступ заблокирован
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {disabled ? (
          <div className={`p-8 text-center flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg bg-${bgColorFrom}/50 text-gray-500`}>
            <Lock className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Для этой обложки нужен особый уровень</p>
            <p className="text-sm text-gray-600 mt-2">{unlockCondition}</p>
            <p className="text-xs text-gray-400 mt-1">Начните продавать книги, чтобы получить доступ!</p>
          </div>
        ) : (
          <DropZone
            onDrop={handleCoverFileSelect}
            accept="image/png, image/jpeg, image/webp"
            maxSize={currentOptions.maxSize}
            className="p-8 text-center"
            multiple={false}
          >
            {coverFile ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="space-y-4"
              >
                <Check className="w-12 h-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium text-green-700">{coverFile.name}</p>
                  <p className="text-sm text-green-600">
                    {(coverFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRemove) onRemove();
                  }}
                  className="mt-4"
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
                  <Upload className={`w-12 h-12 mx-auto text-${accentColor}-500`} />
                </motion.div>
                <div>
                  <p className={`text-lg font-medium text-${accentColor}-700`}>
                    Перетащите обложку или нажмите для выбора
                  </p>
                  <p className={`text-sm text-${accentColor}-600 mt-2`}>
                    {currentOptions.description}
                  </p>
                </div>
              </div>
            )}
          </DropZone>
        )}
      </CardContent>
    </Card>
  );
};


const BookFileUpload = ({
  file,
  onFileChange,
  isDetectingLanguage,
  detectedLanguage,
  languageDetectionError,
  languageDetectionInfo,
  originalLanguageMeta
}) => {
  const onDrop = useCallback((acceptedFile) => {
    if (acceptedFile) {
      onFileChange(acceptedFile);
    }
  }, [onFileChange]);

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-orange-600" />
          Файл книги *
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DropZone
          onDrop={onDrop}
          accept=".pdf,.epub,.txt,.html,.htm,.doc,.docx"
          maxSize={100 * 1024 * 1024}
          className="p-8 text-center"
        >
          {file ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="space-y-4"
            >
              <Check className="w-12 h-12 mx-auto text-green-500" />
              <div>
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-green-600">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
                className="mt-4"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Удалить
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              >
                <FileText className="w-12 h-12 mx-auto text-orange-500" />
              </motion.div>
              <div>
                <p className="text-lg font-medium text-orange-700">
                  Перетащите файл книги или нажмите для выбора
                </p>
                <p className="text-sm text-orange-600 mt-2">
                  Поддерживаемые форматы: PDF, EPUB, TXT, HTML, DOC, DOCX • Максимум: 100MB
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
                <span className="text-xl">{originalLanguageMeta?.flag}</span>
                <span>
                  Язык оригинала: <span className="font-medium">{originalLanguageMeta?.label}</span>
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
      </CardContent>
    </Card>
  );
};

const TranslationOptions = ({
  selectedLanguages,
  onLanguageToggle,
  pricePerLang,
  bookFile,
  availableLanguages,
  originalLanguageMeta,
  isDetectingLanguage,
  languageDetectionError,
  languageDetectionInfo
}) => {
  const totalTranslationPrice = selectedLanguages.length * pricePerLang;

  return (
    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-cyan-600" />
          <Sparkles className="w-5 h-5 text-yellow-500" />
          ИИ-перевод (опционально)
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Автоматический перевод на выбранные языки с помощью ИИ
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
            <span className="text-lg">{originalLanguageMeta?.flag}</span>
            <span className="text-sm font-medium">Язык оригинала: {originalLanguageMeta?.label}</span>
          </Badge>
          <span className="text-xs text-muted-foreground">
            Перевод доступен только на другие языки
          </span>
        </div>

        {isDetectingLanguage && (
          <Alert className="border-primary/20">
            <AlertDescription className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Определяем язык книги...
            </AlertDescription>
          </Alert>
        )}

        {!isDetectingLanguage && languageDetectionInfo && (
          <Alert className="border-amber-300 bg-amber-50/60">
            <AlertDescription className="text-xs">{languageDetectionInfo}</AlertDescription>
          </Alert>
        )}

        {!isDetectingLanguage && languageDetectionError && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{languageDetectionError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {availableLanguages.map(lang => (
            <motion.div
              key={lang.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-3 border-2 rounded-lg cursor-pointer transition-all duration-300
                ${selectedLanguages.includes(lang.value)
                  ? 'border-cyan-400 bg-cyan-100 shadow-lg shadow-cyan-200'
                  : 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 hover:shadow-md'
                }
              `}
              onClick={() => onLanguageToggle(lang.value)}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{lang.flag}</div>
                <div className="text-xs font-medium">{lang.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <Alert className="border-amber-300 bg-amber-50/60">
          <AlertDescription className="text-sm">
            Автоматический перевод временно отключен. Мы сохраним выбранные языки и запустим процесс позже.
          </AlertDescription>
        </Alert>

        {selectedLanguages.length > 0 && bookFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border border-green-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-medium">Стоимость перевода:</span>
              </div>
              <motion.div
                className="text-lg font-bold text-green-700"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
              >
                ${totalTranslationPrice.toFixed(2)} USD
              </motion.div>
            </div>
            <div className="text-sm text-green-600 mt-2">
              {selectedLanguages.length} языков × ~${pricePerLang.toFixed(2)} за язык
              <p className="text-xs text-green-500 mt-1">
                (Расчет основан на размере файла { (bookFile.size / 1024 / 1024).toFixed(1) }MB)
              </p>
            </div>
          </motion.div>
        )}
        {selectedLanguages.length > 0 && !bookFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            Для расчета стоимости перевода сначала загрузите файл книги.
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

const UploadActions = ({ onSubmit, isUploading, coverFile, bookFile, selectedLanguagesForTranslation, setCurrentStep, handleSubmit }) => (
  <div className="flex gap-4">
    <Button
      type="button"
      variant="outline"
      onClick={() => setCurrentStep(1)}
      disabled={isUploading}
      className="flex-1"
    >
      Назад
    </Button>
    <Button
      onClick={handleSubmit(onSubmit)}
      disabled={!coverFile || !bookFile || isUploading}
      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
      size="lg"
    >
      {isUploading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
          />
          Создание книги...
        </>
      ) : selectedLanguagesForTranslation.length > 0 ? (
        <>
          Создать книгу (перевод позже)
          <Zap className="w-5 h-5 ml-2" />
        </>
      ) : (
        <>
          Создать книгу
          <Check className="w-5 h-5 ml-2" />
        </>
      )}
    </Button>
  </div>
);

// Новый компонент для управления загрузкой обложек
const CoverUploadManager = ({ user, authorStats, isLoadingStats, coverFiles, setCoverFile, isGodMode }) => {
    
    const SALES_THRESHOLDS = {
        DEFAULT: 0,
        NOTES_1: 5,
        LIBRARY_HERO: 15,
        NOTES_2: 25,
        SQUARE: 50,
        LANDSCAPE: 350,
        PORTRAIT_LARGE: 1000,
        MAIN_BANNER: 10000,
    };

    const hasAccess = useCallback((level) => {
        if (isGodMode) return true;
        if (isLoadingStats) return false;
        if (user?.role === 'admin') return true; // Администраторы имеют доступ ко всему
        return authorStats.monthlySales >= level;
    }, [authorStats.monthlySales, isLoadingStats, user, isGodMode]);
    
    const coverTiers = [
        {
            size: 'default',
            threshold: SALES_THRESHOLDS.DEFAULT,
            title: "Стандарт",
            icon: ImageIcon,
            description: "400x600px"
        },
        {
            size: 'notes_1',
            threshold: SALES_THRESHOLDS.NOTES_1,
            title: "Заметки (№1)",
            icon: Newspaper,
            description: "600x400px"
        },
        {
            size: 'library_hero',
            threshold: SALES_THRESHOLDS.LIBRARY_HERO,
            title: "Библиотека",
            icon: Library,
            description: "1200x400px"
        },
        {
            size: 'notes_2',
            threshold: SALES_THRESHOLDS.NOTES_2,
            title: "Заметки (№2)",
            icon: Newspaper,
            description: "600x400px"
        },
        {
            size: 'square',
            threshold: SALES_THRESHOLDS.SQUARE,
            title: "Квадрат",
            icon: ImageIcon,
            description: "600x600px"
        },
        {
            size: 'landscape',
            threshold: SALES_THRESHOLDS.LANDSCAPE,
            title: "Разделы",
            icon: Tv,
            description: "1600x900px"
        },
        {
            size: 'portrait_large',
            threshold: SALES_THRESHOLDS.PORTRAIT_LARGE,
            title: "Популярное",
            icon: ImageIcon,
            description: "800x1000px"
        },
        {
            size: 'main_banner',
            threshold: SALES_THRESHOLDS.MAIN_BANNER,
            title: "Главная",
            icon: Trophy,
            description: "1920x640px"
        }
    ];

    const [expanded, setExpanded] = useState(false);
    
    const availableTiers = coverTiers.filter(tier => hasAccess(tier.threshold));

    return (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-purple-600" />
                        <span>Менеджер обложек</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                        {expanded ? "Свернуть" : "Развернуть"}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span>
                    Ваши месячные продажи: <span className="font-bold text-lg text-primary">{authorStats.monthlySales}</span>
                  </span>
                  <span>
                    Доступно: {availableTiers.length} из {coverTiers.length} обложек
                  </span>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
                    {coverTiers.map(tier => {
                        const isUnlocked = hasAccess(tier.threshold);
                        const Icon = tier.icon;
                        return (
                            <div
                                key={tier.size}
                                title={`${tier.title} (требуется ${tier.threshold} продаж)`}
                                className={`h-2.5 rounded-sm transition-all duration-300 relative group cursor-help
                                ${isUnlocked ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {tier.title} ({tier.threshold} продаж)
                                </span>
                            </div>
                        );
                    })}
                </div>
                
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                        >
                            {coverTiers.map(tier => ( // Changed to coverTiers to show all, but disable locked ones
                                <BookCoverUpload
                                    key={tier.size}
                                    coverFile={coverFiles[tier.size]}
                                    onFileChange={(file) => setCoverFile(tier.size, file)}
                                    onRemove={() => setCoverFile(tier.size, null)}
                                    size={tier.size}
                                    disabled={!hasAccess(tier.threshold)}
                                    unlockCondition={`Требуется ${tier.threshold} продаж в месяц`}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                 {!expanded && (
                    <div className="text-center text-muted-foreground text-sm p-4 bg-purple-50/50 rounded-lg">
                        Разверните менеджер, чтобы загрузить доступные вам обложки.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


export default function UploadTab() {
  const { user, hasFullAccess: isGodMode } = useAuth(); // Получаем флаг полного доступа
  const { kasRate } = useExchangeRate();
  const { kasPrice } = useCoinGecko();

  const [isUploading, setIsUploading] = useState(false);
  const [coverFiles, setCoverFiles] = useState({
    default: null,
    square: null,
    portrait_large: null,
    landscape: null,
    notes_1: null,
    notes_2: null,
    library_hero: null,
    // main_banner doesn't take a file directly as per previous comment.
    // It's just a display type in BookCoverUpload component.
  });
  const [bookFile, setBookFile] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [selectedLanguagesForTranslation, setSelectedLanguagesForTranslation] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedBookId, setUploadedBookId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [languageDetectionError, setLanguageDetectionError] = useState(null);
  const [languageDetectionInfo, setLanguageDetectionInfo] = useState(null);

  // New: Author stats for level system
  const [authorStats, setAuthorStats] = useState({ monthlySales: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const { register, handleSubmit, control, formState: { errors }, reset, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      author: '',
      description: '',
      price_kas: 1.0,
      price_usd: 0,
      is_usd_fixed: false,
      is_public_domain: false,
      mood: '',
      page_count: '',
      languages: [{ lang: 'ru', title: '', description: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'languages'
  });

  const priceKas = watch('price_kas');
  const priceUsd = watch('price_usd');
  const isUsdFixed = watch('is_usd_fixed');

  const originalLanguage = detectedLanguage || 'ru';
  const originalLanguageMeta = React.useMemo(
    () => getLanguageMetadata(originalLanguage),
    [originalLanguage]
  );
  const translationLanguages = React.useMemo(
    () => LANGUAGES.filter((lang) => !isSameLanguage(lang.value, originalLanguage)),
    [originalLanguage]
  );

  // New: Effect to fetch author stats
  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        setIsLoadingStats(true);
        try {
          const { data } = await getAuthorStats();
          setAuthorStats(data);
        } catch (error) {
          console.error("Не удалось загрузить статистику автора:", error);
          toast.error("Не удалось загрузить статистику для уровней доступа");
        } finally {
          setIsLoadingStats(false);
        }
      }
    };
    fetchStats();
  }, [user]);

  // Обновление цен при изменении курса
  useEffect(() => {
    if (kasRate > 0) {
      if (isUsdFixed) {
        const currentUsdValue = parseFloat(priceUsd || 0);
        const newKasPrice = currentUsdValue / kasRate;
        const roundedKasPrice = Math.round(newKasPrice * 100) / 100;
        if (Math.abs(roundedKasPrice - (parseFloat(priceKas || 0))) > 0.01) {
          setValue('price_kas', roundedKasPrice.toFixed(2), { shouldValidate: true });
        }
      } else {
        const currentKasValue = parseFloat(priceKas || 0);
        const newUsdPrice = currentKasValue * kasRate;
        if (Math.abs(newUsdPrice - (parseFloat(priceUsd || 0))) > 0.01) {
          setValue('price_usd', newUsdPrice.toFixed(2), { shouldValidate: true });
        }
      }
    }
  }, [priceKas, priceUsd, isUsdFixed, kasRate, setValue]);

  useEffect(() => {
    setSelectedLanguagesForTranslation((prev) =>
      prev.filter((lang) => translationLanguages.some((option) => option.value === lang))
    );
  }, [translationLanguages]);

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
  
  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev =>
        prev.includes(categoryName)
            ? prev.filter(c => c !== categoryName)
            : [...prev, categoryName]
    );
  };

  const handleBookFileChange = useCallback(async (file) => {
    setBookFile(file);
    setDetectedLanguage(null);
    setLanguageDetectionError(null);
    setLanguageDetectionInfo(null);
    setSelectedLanguagesForTranslation([]);
    setUploadedBookId(null);

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
        setSelectedLanguagesForTranslation((prev) => prev.filter((value) => !isSameLanguage(value, language)));
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
  }, []);

  const calculateTranslationPricePerLanguage = useCallback(() => {
    if (!bookFile) return 0;

    const basePrice = 2;
    const sizeMultiplier = Math.min(bookFile.size / (10 * 1024 * 1024), 1.5);
    const pricePerLanguage = basePrice + (sizeMultiplier * 3);
    return pricePerLanguage;
  }, [bookFile]);

  // New: Sales thresholds for different cover types (used in onSubmit logic)
  const SALES_THRESHOLDS = {
    DEFAULT: 0,
    NOTES_1: 5,
    LIBRARY_HERO: 15,
    NOTES_2: 25,
    SQUARE: 50,
    LANDSCAPE: 350,
    PORTRAIT_LARGE: 1000,
    MAIN_BANNER: 10000,
  };

  // New: Helper function to check access based on monthly sales
  const hasAccess = useCallback((level) => {
      // ИСПРАВЛЕНО: Проверка на полный доступ
      if (isGodMode) return true; 
      if (isLoadingStats) return false;
      if (user?.role === 'admin') return true;
      return authorStats.monthlySales >= level;
  }, [authorStats.monthlySales, isLoadingStats, user, isGodMode]);

  const setCoverFile = (size, file) => {
      setCoverFiles(prev => ({ ...prev, [size]: file }));
  };

  const handleLanguageToggle = useCallback((langValue) => {
    if (!translationLanguages.some((lang) => lang.value === langValue)) {
      toast.info('Этот язык уже является языком оригинала и не требует перевода.');
      return;
    }

    setSelectedLanguagesForTranslation(prev => {
      if (prev.includes(langValue)) {
        return prev.filter(l => l !== langValue);
      } else if (prev.length < 10) {
        return [...prev, langValue];
      } else {
        toast.warning('Можно выбрать максимум 10 языков для перевода');
        return prev;
      }
    });
  }, [translationLanguages]);

  const onSubmit = async (data) => {
    if (!coverFiles.default) {
      toast.error('Пожалуйста, загрузите стандартную обложку книги');
      return;
    }
    if (selectedGenres.length === 0) {
      toast.error('Выберите хотя бы один жанр');
      return;
    }
    if (!bookFile) {
      toast.error('Пожалуйста, загрузите файл книги');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const toastId = toast.loading('Создание книги...');

    try {
      // 1. Загрузка обложек
      const coverImages = {};
      
      setUploadProgress(10);
      toast.info('Загрузка обложек...', { id: toastId });
      
      const coverUploadPromises = Object.entries(coverFiles)
        .filter(([, file]) => file !== null) // Only consider files that are actually selected
        .map(async ([size, file]) => {
            const threshold = SALES_THRESHOLDS[size.toUpperCase()];
            if (hasAccess(threshold)) {
                toast.info(`Загрузка обложки: ${size}...`, { id: toastId });
                const { file_url } = await UploadFile({
                  file,
                  path: buildSupabasePath(`books/covers/${size}`, file)
                });
                coverImages[size] = file_url;
            } else {
                console.warn(`Cover type ${size} not uploaded: access denied (sales: ${authorStats.monthlySales}, required: ${threshold})`);
            }
        });

      await Promise.all(coverUploadPromises);

      // Ensure default cover is always present, if it was uploaded
      if (coverFiles.default && !coverImages.default) {
          const { file_url: defaultCoverUrl } = await UploadFile({
            file: coverFiles.default,
            path: buildSupabasePath('books/covers/default', coverFiles.default)
          });
          coverImages.default = defaultCoverUrl;
      }

      // 2. Загрузка основного файла
      setUploadProgress(60);
      toast.info('Загрузка файла книги...', { id: toastId });
      const { file_url: mainBookUrl } = await UploadFile({
        file: bookFile,
        path: buildSupabasePath('books/originals', bookFile)
      });

      // 3. Подготовка языковых версий (только русский пока, остальные через AI)
      setUploadProgress(80);
      const originalMeta = getLanguageMetadata(originalLanguage);
      const uploadedLanguages = [{
        lang: originalLanguage,
        label: originalMeta.label,
        flag: originalMeta.flag,
        title: data.title,
        description: data.description,
        file_url: mainBookUrl,
        original: true
      }];

      // 4. Создание записи в БД
      setUploadProgress(95);
      toast.info('Создание записи в базе данных...', { id: toastId });

      const finalPriceKas = parseFloat(data.price_kas);
      const finalPriceUsd = parseFloat(data.price_usd);

      const bookData = {
        title: data.title,
        author: data.author || user?.full_name || 'Неизвестный автор',
        author_email: user?.email,
        genres: selectedGenres,
        mood: data.mood,
        description: data.description,
        price_kas: finalPriceKas,
        price_usd: finalPriceUsd,
        is_usd_fixed: data.is_usd_fixed,
        is_public_domain: data.is_public_domain,
        page_count: data.page_count ? parseInt(data.page_count, 10) : null,
        cover_images: coverImages,
        languages: uploadedLanguages,
        status: 'pending'
      };

      const createdBook = await Book.create(bookData);
      setUploadedBookId(createdBook.id);
      setUploadProgress(100);

      toast.success('Книга успешно создана!', { id: toastId });

      if (selectedLanguagesForTranslation.length > 0) {
        setCurrentStep(3);
      } else {
        reset();
        setSelectedGenres([]);
        setCoverFiles({
            default: null,
            square: null,
            portrait_large: null,
            landscape: null,
            notes_1: null,
            notes_2: null,
            library_hero: null,
        });
        setBookFile(null);
        setDetectedLanguage(null);
        setLanguageDetectionError(null);
        setIsDetectingLanguage(false);
        setLanguageDetectionInfo(null);
        setSelectedLanguagesForTranslation([]);
        setCurrentStep(1);
      }

    } catch (error) {
      console.error('Ошибка при создании книги:', error);

      let errorMessage = 'Не удалось создать книгу';
      if (error instanceof Error) {
        if (error.message.includes('DatabaseTimeout')) {
          errorMessage = 'Превышено время ожидания базы данных. Попробуйте позже.';
        } else if (error.message.includes('integration') || error.message.includes('file upload')) {
          errorMessage = 'Ошибка загрузки файлов. Проверьте размер файлов или попробуйте снова.';
        } else {
          errorMessage = `Ошибка: ${error.message}`;
        }
      }

      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerTranslation = async () => {
    if (!uploadedBookId || !bookFile || selectedLanguagesForTranslation.length === 0) {
      toast.error('Недостаточно данных для перевода. Пожалуйста, попробуйте снова.');
      setCurrentStep(1);
      return;
    }

    toast.info('Автоматический перевод временно отключен. Мы сохранили выбранные языки для дальнейшей обработки.');
    reset();
    setSelectedGenres([]);
    setCoverFiles({
        default: null,
        square: null,
        portrait_large: null,
        landscape: null,
        notes_1: null,
        notes_2: null,
        library_hero: null,
    });
    setBookFile(null);
    setDetectedLanguage(null);
    setLanguageDetectionError(null);
    setIsDetectingLanguage(false);
    setLanguageDetectionInfo(null);
    setSelectedLanguagesForTranslation([]);
    setUploadedBookId(null);
    setCurrentStep(1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Информация о книге
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="title">Название книги *</Label>
                      <Input
                        id="title"
                        {...register('title', { required: 'Введите название книги' })}
                        className="bg-white border-blue-200 focus:border-blue-400"
                        placeholder="Введите название книги"
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="author">Автор</Label>
                      <Input
                        id="author"
                        {...register('author')}
                        className="bg-white border-blue-200 focus:border-blue-400"
                        placeholder={user?.full_name || 'Имя автора'}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Описание книги *</Label>
                    <Textarea
                      id="description"
                      {...register('description', { required: 'Добавьте описание книги' })}
                      className="bg-white border-blue-200 focus:border-blue-400 min-h-[120px]"
                      placeholder="Опишите сюжет, героев, основные темы..."
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                  </div>
                  
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <Label htmlFor="page_count">Количество страниц</Label>
                        <Input
                          id="page_count"
                          type="number"
                          {...register('page_count', { valueAsNumber: true })}
                          className="bg-white border-blue-200 focus:border-blue-400"
                          placeholder="Например: 350"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mood">Настроение книги</Label>
                        <Select onValueChange={(value) => setValue('mood', value)} value={watch('mood')}>
                          <SelectTrigger className="bg-white border-blue-200">
                            <SelectValue placeholder="Выберите настроение" />
                          </SelectTrigger>
                          <SelectContent>
                            {MOODS.map(mood => (
                              <SelectItem key={mood.value} value={mood.value}>{mood.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-blue-200">
                    <div>
                      <Label htmlFor="price_kas">Цена в KAS *</Label>
                      <Input
                        id="price_kas"
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register('price_kas', {
                          required: 'Укажите цену книги',
                          min: { value: 0.01, message: 'Минимальная цена 0.01 KAS' },
                          valueAsNumber: true
                        })}
                        className="bg-white"
                        disabled={isUsdFixed}
                      />
                      <AnimatedPrice amount={parseFloat(priceKas || 0)} className="mt-2" />
                      {errors.price_kas && <p className="text-red-500 text-sm mt-1">{errors.price_kas.message}</p>}
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="is_usd_fixed"
                        checked={isUsdFixed}
                        onCheckedChange={(checked) => setValue('is_usd_fixed', checked)}
                      />
                      <Label htmlFor="is_usd_fixed" className="cursor-pointer text-sm">
                        Зафиксировать цену в USD
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="is_public_domain" {...register('is_public_domain')} />
                    <Label htmlFor="is_public_domain">Книга является общественным достоянием</Label>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200">
                <CardHeader>
                  <CardTitle>Жанры (до 3-х)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {GENRES_DATA.map(categoryData => (
                      <div key={categoryData.category}>
                        <div className="flex items-center space-x-3 mb-3">
                          <Checkbox
                            id={`cat-${categoryData.category}`}
                            onCheckedChange={() => toggleCategory(categoryData.category)}
                            checked={expandedCategories.includes(categoryData.category)}
                          />
                          <Label
                            htmlFor={`cat-${categoryData.category}`}
                            className="text-lg font-semibold text-foreground/90 cursor-pointer"
                          >
                            {categoryData.category}
                          </Label>
                        </div>
                        <AnimatePresence>
                          {expandedCategories.includes(categoryData.category) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden pl-8"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 pt-2">
                                {categoryData.genres.map(genre => (
                                  <motion.div
                                    key={genre.value}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={genre.value}
                                      checked={selectedGenres.includes(genre.value)}
                                      onCheckedChange={() => handleGenreToggle(genre.value)}
                                      disabled={!selectedGenres.includes(genre.value) && selectedGenres.length >= 3}
                                    />
                                    <Label
                                      htmlFor={genre.value}
                                      className="text-sm cursor-pointer hover:text-green-700 transition-colors"
                                    >
                                      {genre.label}
                                    </Label>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                  {selectedGenres.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Выбранные жанры:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedGenres.map(genreValue => {
                          const genre = GENRES_DATA.flatMap(c => c.genres).find(g => g.value === genreValue);
                          return (
                            <Badge key={genreValue} className="bg-green-200 text-green-800">
                              {genre?.label || genreValue}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!watch('title') || selectedGenres.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              Продолжить к файлам
              <FileText className="w-5 h-5 ml-2" />
            </Button>
          </form>
        );

      case 2:
        return (
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <CoverUploadManager 
                user={user}
                authorStats={authorStats}
                isLoadingStats={isLoadingStats}
                coverFiles={coverFiles}
                setCoverFile={setCoverFile}
                isGodMode={isGodMode}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <BookFileUpload
                file={bookFile}
                onFileChange={handleBookFileChange}
                isDetectingLanguage={isDetectingLanguage}
                detectedLanguage={detectedLanguage}
                languageDetectionError={languageDetectionError}
                languageDetectionInfo={languageDetectionInfo}
                originalLanguageMeta={originalLanguageMeta}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TranslationOptions
                selectedLanguages={selectedLanguagesForTranslation}
                onLanguageToggle={handleLanguageToggle}
                pricePerLang={calculateTranslationPricePerLanguage()}
                bookFile={bookFile}
                availableLanguages={translationLanguages}
                originalLanguageMeta={originalLanguageMeta}
                isDetectingLanguage={isDetectingLanguage}
                languageDetectionError={languageDetectionError}
                languageDetectionInfo={languageDetectionInfo}
              />
            </motion.div>

            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Создание книги...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress
                  value={uploadProgress}
                  className="w-full h-3"
                />
              </motion.div>
            )}

            <UploadActions
              onSubmit={onSubmit}
              isUploading={isUploading}
              coverFile={coverFiles.default}
              bookFile={bookFile}
              selectedLanguagesForTranslation={selectedLanguagesForTranslation}
              setCurrentStep={setCurrentStep}
              handleSubmit={handleSubmit}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center space-y-4 mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto"
                >
                  <Bot className="w-16 h-16 text-blue-500" />
                </motion.div>
                <h2 className="text-2xl font-bold">Переводы будут обработаны позже</h2>
                <p className="text-muted-foreground">
                  Мы сохранили запрос на перевод на {selectedLanguagesForTranslation.length} языков. Как только команда запустит
                  обработку, вы получите уведомление.
                </p>
                <p className="text-sm text-gray-500">
                  Сейчас автоматический перевод временно отключен. Вы можете продолжать публиковать книги и вернуться к переводу
                  позже.
                </p>
              </div>
            </motion.div>

            <Button
              onClick={triggerTranslation}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Готово
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                reset();
                setSelectedGenres([]);
                setCoverFiles({
                    default: null,
                    square: null,
                    portrait_large: null,
                    landscape: null,
                    notes_1: null,
                    notes_2: null,
                    library_hero: null,
                });
                setBookFile(null);
                setSelectedLanguagesForTranslation([]);
                setUploadedBookId(null);
                setCurrentStep(1);
              }}
              className="w-full"
            >
              Вернуться к загрузке новой книги
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Загрузить книгу
          </h1>
          <p className="text-muted-foreground text-lg">
            Создайте новую книгу и опубликуйте ее для читателей по всему миру
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <motion.div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all
                    ${step <= currentStep
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-muted text-muted-foreground border-muted-foreground/30'
                    }
                  `}
                  animate={step === currentStep ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {step < 3 && step < currentStep ? <Check className="w-5 h-5" /> : step}
                  {step === 3 && step <= currentStep ? <Check className="w-5 h-5" /> : null}
                </motion.div>
                {step < 3 && (
                  <div className={`
                    w-12 h-0.5 mx-2 transition-colors
                    ${step < currentStep ? 'bg-blue-500' : 'bg-muted-foreground/30'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
