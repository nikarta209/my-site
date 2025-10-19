
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { X, Save, Share, Image as ImageIcon, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useSubscription } from '../auth/Auth';
import { createPageUrl } from '@/utils';
import { getBookCoverUrl } from '@/lib/books/coverImages';

const HIGHLIGHT_COLORS = [
  { value: 'yellow', label: 'Жёлтый', class: 'bg-yellow-200 text-yellow-800' },
  { value: 'green', label: 'Зелёный', class: 'bg-green-200 text-green-800' },
  { value: 'blue', label: 'Голубой', class: 'bg-blue-200 text-blue-800' },
  { value: 'pink', label: 'Розовый', class: 'bg-pink-200 text-pink-800' },
  { value: 'orange', label: 'Оранжевый', class: 'bg-orange-200 text-orange-800' }
];

export default function AddNoteModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onShare,
  selectedText = '', 
  pageNumber = 1,
  book = null 
}) {
  const { isAuthenticated } = useAuth();
  const { isActive: isPremium } = useSubscription();
  const [noteText, setNoteText] = useState('');
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [selectedCover, setSelectedCover] = useState('default');

  const getAvailableCoversForNotes = useCallback(() => {
    if (!book) return [];
    
    const covers = [];
    
    const defaultCover = getBookCoverUrl(book, { variant: 'portrait', fallback: null });
    if (defaultCover) {
      covers.push({
        key: 'default',
        url: defaultCover,
        label: 'Стандартная обложка'
      });
    }

    // ИСПРАВЛЕНО: Проверяем наличие специальных обложек для заметок
    if (book.cover_images?.notes_1) {
      covers.push({
        key: 'notes_1',
        url: book.cover_images.notes_1,
        label: 'Обложка для заметок #1'
      });
    }

    if (book.cover_images?.notes_2) {
      covers.push({
        key: 'notes_2',
        url: book.cover_images.notes_2,
        label: 'Обложка для заметок #2'
      });
    }

    return covers;
  }, [book]);

  const availableCovers = getAvailableCoversForNotes();

  const handleSave = () => {
    // ИСПРАВЛЕНО: Передаем все обязательные поля
    const noteData = {
      selectedText: selectedText, // ОБЯЗАТЕЛЬНОЕ ПОЛЕ
      highlightColor: highlightColor,
      noteText: noteText,
      pageNumber: pageNumber, // ОБЯЗАТЕЛЬНОЕ ПОЛЕ
      coverType: selectedCover // Renamed to coverType as per outline
    };

    console.log('Сохраняем заметку с данными:', noteData); // Для отладки

    onSave(noteData);
    handleClose();
  };

  const handleShare = () => {
    if (!onShare) return;
    const sharedNoteData = {
      selectedText: selectedText,
      note_text: noteText,
      highlight_color: highlightColor,
      pageNumber: pageNumber,
      cover_type: selectedCover, // Kept as cover_type for sharing
      cover_image_url: availableCovers.find(c => c.key === selectedCover)?.url
    };

    onShare(sharedNoteData);
    handleClose();
  };

  const handleClose = () => {
    setNoteText('');
    setHighlightColor('yellow');
    setSelectedCover('default');
    onClose();
  };
  
  const handlePremiumAction = () => {
    if (!isPremium) {
      window.open(createPageUrl('SubscriptionPage'), '_blank');
    }
    // else: open file picker logic here
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Создать заметку
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Выделенный фрагмент */}
          <div>
            <label className="text-sm font-medium mb-2 block">Выделенный фрагмент:</label>
            <div className={`p-4 rounded-lg border-l-4 ${
              HIGHLIGHT_COLORS.find(c => c.value === highlightColor)?.class || 'bg-yellow-100 border-yellow-400'
            }`}>
              <p className="text-sm leading-relaxed">"{selectedText}"</p>
            </div>
          </div>

          <Tabs defaultValue="note" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="note">Заметка</TabsTrigger>
              <TabsTrigger value="color">Цвет</TabsTrigger>
              <TabsTrigger value="cover">Обложка</TabsTrigger>
            </TabsList>

            <TabsContent value="note" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ваша заметка:</label>
                <Textarea
                  placeholder="Добавьте свои мысли об этом фрагменте..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    Страница {pageNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {noteText.length}/500
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="color" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Цвет выделения:</label>
                <div className="grid grid-cols-5 gap-3">
                  {HIGHLIGHT_COLORS.map(color => (
                    <motion.button
                      key={color.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setHighlightColor(color.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        highlightColor === color.value 
                          ? `${color.class} border-current shadow-lg` 
                          : `${color.class} border-transparent hover:shadow-md`
                      }`}
                    >
                      <div className="text-xs font-medium">{color.label}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cover" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Обложка для заметки:
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableCovers.map(cover => (
                    <motion.div
                      key={cover.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`p-3 cursor-pointer transition-all ${
                          selectedCover === cover.key 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedCover(cover.key)}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={cover.url}
                            alt={cover.label}
                            className="w-12 h-16 object-cover rounded shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {cover.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Доступно
                            </p>
                          </div>
                          {selectedCover === cover.key && (
                            <Badge variant="default" className="text-xs">
                              Выбрано
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                  
                  {/* Загрузка своей обложки для Premium пользователей */}
                  <div 
                    className={`p-3 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
                      isPremium 
                      ? 'border-primary/50 hover:bg-primary/5 cursor-pointer' 
                      : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
                    }`}
                    onClick={handlePremiumAction}
                    title={!isPremium ? "Требуется подписка KASBOOK Premium" : "Загрузить свою обложку"}
                  >
                    <Crown className={`w-6 h-6 mb-2 ${isPremium ? 'text-primary' : 'text-gray-400 dark:text-gray-600'}`} />
                    <span className={`font-semibold text-sm ${isPremium ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                      Загрузить свою
                    </span>
                    {!isPremium && <Badge variant="secondary" className="mt-2 bg-yellow-400/20 text-yellow-600">Premium</Badge>}
                  </div>
                </div>

                {availableCovers.length === 0 && (
                   <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Автор не загрузил специальные обложки для заметок</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Действия */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Отменить
            </Button>
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Сохранить заметку
            </Button>
            {onShare && (
              <Button onClick={handleShare} variant="outline" className="flex-1">
                <Share className="w-4 h-4 mr-2" />
                Поделиться
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
