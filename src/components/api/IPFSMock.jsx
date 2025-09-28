import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Globe,
  DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from './apiClient';

// Компонент для имитации IPFS загрузки с интеграцией n8n
export default function IPFSMock({ 
  file, 
  selectedLanguages = [], 
  onSuccess, 
  onError,
  bookId 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [result, setResult] = useState(null);

  const calculatePrice = () => {
    // Цена за язык: $2-5 в зависимости от размера файла
    const basePrice = 2;
    const sizeMultiplier = Math.min(file?.size / (10 * 1024 * 1024), 1.5); // До 1.5x за большие файлы
    const pricePerLanguage = basePrice + (sizeMultiplier * 3);
    return (pricePerLanguage * selectedLanguages.length).toFixed(2);
  };

  const simulateProgress = (duration = 3000) => {
    const increment = 100 / (duration / 100);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + increment + Math.random() * 5;
      });
    }, 100);
    return interval;
  };

  const handleUpload = async () => {
    if (!file || selectedLanguages.length === 0 || !bookId) {
      toast.error('Необходимо выбрать файл и языки для перевода');
      return;
    }

    setIsUploading(true);
    setStatus('uploading');
    setProgress(0);

    try {
      // Фаза 1: Симуляция загрузки файла
      const uploadInterval = simulateProgress(2000);
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(uploadInterval);
      setProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Фаза 2: Обработка через n8n
      setStatus('processing');
      setProgress(0);
      
      const processingInterval = simulateProgress(4000);
      
      // Создаем FormData для отправки в n8n webhook
      const formData = new FormData();
      formData.append('file', file);
      formData.append('languages', JSON.stringify(selectedLanguages));
      formData.append('bookId', bookId);

      // Отправляем в наш backend, который перенаправит в n8n
      const response = await api.postFormData('/api/n8n-translate', formData, {
        timeout: 60000, // 60 секунд для перевода
      });

      clearInterval(processingInterval);
      setProgress(100);

      if (response.data.success) {
        setStatus('success');
        setResult(response.data);
        toast.success(`Перевод завершен! Обработано ${selectedLanguages.length} языков`);
        onSuccess?.(response.data);
      } else {
        throw new Error(response.data.error || 'Ошибка перевода');
      }

    } catch (error) {
      console.error('Upload/translation error:', error);
      setStatus('error');
      setResult({ error: error.message });
      
      toast.error('Ошибка перевода', {
        description: 'Попробуйте еще раз или обратитесь в поддержку',
        action: {
          label: 'Повторить',
          onClick: () => handleUpload(),
        },
      });
      
      onError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Загрузка файла...';
      case 'processing':
        return 'Обработка и перевод...';
      case 'success':
        return 'Перевод завершен успешно!';
      case 'error':
        return 'Ошибка при обработке';
      default:
        return 'Готов к загрузке';
    }
  };

  if (!file) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-6 text-center">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Выберите файл для начала процесса перевода</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Автоматический перевод
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Информация о файле */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>

          {/* Выбранные языки */}
          {selectedLanguages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Языки для перевода:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Цена */}
          {selectedLanguages.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-medium">
                Стоимость перевода: ${calculatePrice()} USD
              </span>
            </div>
          )}

          {/* Прогресс-бар */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{getStatusText()}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress 
                value={progress} 
                className="w-full"
                style={{
                  '--progress-color': status === 'uploading' ? '#3b82f6' : '#10b981'
                }}
              />
            </div>
          )}

          {/* Результат */}
          {status === 'success' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="font-medium text-green-800 mb-2">
                ✅ Перевод завершен успешно!
              </p>
              <p className="text-sm text-green-700">
                Переведено на {result.languages_processed?.length || 0} языков
              </p>
              {result.translated_files && (
                <div className="mt-2 space-y-1">
                  {result.translated_files.map((url, index) => (
                    <p key={index} className="text-xs text-green-600 font-mono">
                      {selectedLanguages[index]?.toUpperCase()}: {url.split('/').pop()}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Ошибка */}
          {status === 'error' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="font-medium text-red-800 mb-2">
                ❌ Ошибка при переводе
              </p>
              <p className="text-sm text-red-700">
                {result.error || 'Неизвестная ошибка'}
              </p>
            </motion.div>
          )}

          {/* Кнопка действия */}
          <div className="flex justify-end">
            {status === 'idle' && (
              <Button 
                onClick={handleUpload}
                disabled={selectedLanguages.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Запустить перевод (${calculatePrice()})
              </Button>
            )}
            
            {(status === 'error') && (
              <Button onClick={handleUpload} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Попробовать снова
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}