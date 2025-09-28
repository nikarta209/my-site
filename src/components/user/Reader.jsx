import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Sun, 
  Moon, 
  Settings, 
  BookOpen, 
  Highlighter, 
  StickyNote,
  Copy,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

import { storage } from '@/components/utils/localStorage';

export default function Reader({ book, user, isOpen, onClose }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [warmth, setWarmth] = useState(0);
  const [highlights, setHighlights] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [progress, setProgress] = useState({ page: 1, percentage: 0 });
  
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (book) {
      const savedProgress = storage.getReadingProgress(book.id);
      const savedHighlights = storage.getHighlights(book.id);
      
      setCurrentPage(savedProgress.page);
      setProgress(savedProgress);
      setHighlights(savedHighlights);
    }
  }, [book]);

  useEffect(() => {
    if (book) {
      const newProgress = {
        page: currentPage,
        percentage: (currentPage / book.pages) * 100
      };
      setProgress(newProgress);
      storage.setReadingProgress(book.id, newProgress);
    }
  }, [currentPage, book]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      setSelectedText(selection.toString());
      setShowNoteInput(true);
    }
  };

  const addHighlight = (color = 'yellow') => {
    if (selectedText.trim()) {
      const highlight = {
        text: selectedText,
        page: currentPage,
        color,
        note: noteText
      };
      
      const newHighlight = storage.addHighlight(book.id, highlight);
      setHighlights(prev => [...prev, newHighlight]);
      
      setSelectedText('');
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  const removeHighlight = (highlightId) => {
    storage.removeHighlight(book.id, highlightId);
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
  };

  const copyHighlight = (text) => {
    navigator.clipboard.writeText(text);
  };

  const goToPage = (pageNumber) => {
    const page = Math.max(1, Math.min(pageNumber, book.pages));
    setCurrentPage(page);
  };

  const getWarmthStyles = () => {
    const sepia = warmth * 0.3;
    const hueRotate = warmth * 0.5 - 15;
    const brightness = 100 + warmth * 0.2;
    const contrast = 100 - warmth * 0.1;
    
    return {
      filter: `sepia(${sepia}%) hue-rotate(${hueRotate}deg) brightness(${brightness}%) contrast(${contrast}%)`
    };
  };

  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-screen p-0 m-0">
        <div className="h-full flex flex-col">
          {/* Верхняя панель */}
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="font-semibold">{book.title}</h2>
                <p className="text-sm text-muted-foreground">{book.author}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Теплота:</span>
                <Slider
                  value={[warmth]}
                  onValueChange={([value]) => setWarmth(value)}
                  max={100}
                  step={1}
                  className="w-20"
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span>Размер:</span>
                <Slider
                  value={[fontSize]}
                  onValueChange={([value]) => setFontSize(value)}
                  min={12}
                  max={24}
                  step={1}
                  className="w-20"
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Основной контент */}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Область чтения */}
            <ResizablePanel defaultSize={75}>
              <div className="h-full flex flex-col">
                {/* Прогресс */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Страница {currentPage} из {book.pages}</span>
                    <span>{Math.round(progress.percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Контент книги */}
                <div className="flex-1 p-8 overflow-auto" style={getWarmthStyles()}>
                  <div 
                    className="max-w-4xl mx-auto prose prose-lg dark:prose-invert"
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
                    onMouseUp={handleTextSelection}
                  >
                    {/* Имитация содержимого книги */}
                    <h1 className="text-3xl font-bold mb-6">{book.title}</h1>
                    <p className="text-lg text-muted-foreground mb-8">Автор: {book.author}</p>
                    
                    <div className="space-y-6">
                      <p>
                        {book.description} Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad 
                        minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea 
                        commodo consequat.
                      </p>
                      
                      <p>
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                        eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
                        in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis 
                        unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.
                      </p>
                      
                      <p>
                        Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi 
                        architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem 
                        quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur 
                        magni dolores eos qui ratione voluptatem sequi nesciunt.
                      </p>
                      
                      {/* Выделенные фрагменты */}
                      {highlights
                        .filter(h => h.page === currentPage)
                        .map(highlight => (
                          <motion.div
                            key={highlight.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-3 rounded-lg border-l-4 animate-pulse ${
                              highlight.color === 'yellow' 
                                ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20' 
                                : 'bg-green-50 border-green-400 dark:bg-green-900/20'
                            }`}
                          >
                            <p className="font-medium">"{highlight.text}"</p>
                            {highlight.note && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Заметка: {highlight.note}
                              </p>
                            )}
                          </motion.div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Навигация по страницам */}
                <div className="flex items-center justify-between p-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Назад
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentPage}
                      onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                      className="w-16 text-center border rounded px-2 py-1"
                      min={1}
                      max={book.pages}
                    />
                    <span className="text-sm text-muted-foreground">из {book.pages}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= book.pages}
                  >
                    Вперёд
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Боковая панель с заметками */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="h-full flex flex-col bg-muted/50">
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    Заметки и выделения
                  </h3>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {highlights.length > 0 ? (
                      <Accordion type="single" collapsible>
                        {highlights.map(highlight => (
                          <AccordionItem key={highlight.id} value={highlight.id}>
                            <AccordionTrigger className="text-left">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Стр. {highlight.page}</Badge>
                                <span className="truncate text-sm">
                                  "{highlight.text.substring(0, 30)}..."
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                <p className="text-sm font-medium">"{highlight.text}"</p>
                                {highlight.note && (
                                  <p className="text-sm text-muted-foreground">
                                    Заметка: {highlight.note}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyHighlight(highlight.text)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => goToPage(highlight.page)}
                                  >
                                    <BookOpen className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeHighlight(highlight.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />  
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Highlighter className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Пока нет выделений</p>
                        <p className="text-xs">
                          Выделите текст, чтобы создать заметку
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* Модальное окно для добавления заметки */}
          <AnimatePresence>
            {showNoteInput && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 w-96"
              >
                <h4 className="font-semibold mb-2">Добавить выделение</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  "{selectedText.substring(0, 100)}..."
                </p>
                <Textarea
                  placeholder="Добавить заметку (необязательно)"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="mb-3"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => addHighlight('yellow')}>
                    <Highlighter className="w-3 h-3 mr-1" />
                    Жёлтый
                  </Button>
                  <Button size="sm" onClick={() => addHighlight('green')}>
                    <Highlighter className="w-3 h-3 mr-1" />
                    Зелёный
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNoteInput(false)}>
                    Отмена
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}