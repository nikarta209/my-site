import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, FileText, Image as ImageIcon, Check, Trash2, Lock } from 'lucide-react';
import { useTheme } from '../layout/ThemeProvider';

function DropZone({ onDrop, accept, multiple = false, maxSize, children, className = '' }) {
    const [isDragActive, setIsDragActive] = React.useState(false);
    const inputRef = React.useRef(null);
  
    const handleDrag = React.useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setIsDragActive(true);
      } else if (e.type === "dragleave") {
        setIsDragActive(false);
      }
    }, []);
  
    const handleDrop = React.useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
  
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        // Валидация файлов
        onDrop(multiple ? files : files[0]);
      }
    }, [multiple, onDrop]);
  
    const handleChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        onDrop(multiple ? files : files[0]);
      }
    };
  
    return (
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer ${
          isDragActive ? 'border-purple-500 bg-purple-100' : 'border-gray-300 hover:border-purple-400'
        } ${className}`}
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

const BookCoverUpload = ({ coverFile, onFileChange, onRemove, size = 'default', disabled = false, unlockCondition }) => {
  const { isMobile } = useTheme();
  
  const options = {
    default: {
      title: "Стандартная обложка (портрет) *",
      description: "Размер: 400×600 • PNG, JPG, WEBP • До 5MB",
      width: 400,
      height: 600,
      accent: 'purple'
    },
    square: {
      title: "Квадратная обложка",
      description: "Размер: 600×600 • Открывается за 2 продаж/мес",
      width: 600,
      height: 600,
      accent: 'blue'
    },
    portrait_large: {
      title: "Высокая обложка",
      description: "Размер: 800×1000 • Открывается за 1,000 продаж/мес",
      width: 800,
      height: 1000,
      accent: 'green'
    },
    landscape: {
      title: "Широкая обложка",
      description: "Размер: 1600×900 • Открывается за 350 продаж/мес",
      width: 1600,
      height: 900,
      accent: 'orange'
    },
    main_banner: {
        title: "Баннер на главной",
        description: "Размер: 1920x640 • Открывается за 10,000 продаж/мес",
        width: 1920,
        height: 640,
        accent: 'red'
    }
  };

  const currentOptions = options[size];

  const handleCoverFileSelect = useCallback((file) => {
    if (!file) {
      if (onFileChange) onFileChange(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      if (onFileChange) onFileChange(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < currentOptions.width * 0.8 || img.height < currentOptions.height * 0.8) {
          toast.warning(`Размер изображения меньше рекомендуемого`, {
            description: `Рекомендуется ${currentOptions.width}x${currentOptions.height}. Изображение может выглядеть нечетким.`
          });
        }
        if (onFileChange) onFileChange(file);
      };
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  }, [onFileChange, currentOptions]);

  if (disabled) {
    return (
      <Card className="bg-muted/50 border-dashed border-gray-400">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-500 text-base">
            <Lock className="w-5 h-5" />
            {currentOptions.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center p-6 sm:p-8">
            <p className="font-medium text-gray-600 text-sm">Функция заблокирована</p>
            <p className="text-xs text-gray-500 mt-1">
                {unlockCondition}
            </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-${currentOptions.accent}-50 to-pink-50 border-2 border-${currentOptions.accent}-200 shadow-lg`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 text-base text-${currentOptions.accent}-800`}>
          <ImageIcon className={`w-5 h-5 text-${currentOptions.accent}-600`} />
          {currentOptions.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DropZone
          onDrop={handleCoverFileSelect}
          accept="image/png, image/jpeg, image/webp"
          maxSize={10 * 1024 * 1024} // 10MB
          className="p-6 text-center"
        >
          {coverFile ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-3"
            >
              <Check className="w-10 h-10 mx-auto text-green-500" />
              <div>
                <p className="font-medium text-green-700 text-sm truncate">{coverFile.name}</p>
                <p className="text-xs text-green-600">
                  {(coverFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRemove) onRemove();
                }}
                className="mt-2"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Удалить
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Upload className={`w-10 h-10 mx-auto text-${currentOptions.accent}-500`} />
              </motion.div>
              <div>
                <p className={`text-sm font-medium text-${currentOptions.accent}-700`}>
                  Перетащите файл или нажмите для выбора
                </p>
                <p className={`text-xs text-${currentOptions.accent}-600 mt-1`}>
                  {currentOptions.description}
                </p>
              </div>
            </div>
          )}
        </DropZone>
      </CardContent>
    </Card>
  );
};

export default BookCoverUpload;