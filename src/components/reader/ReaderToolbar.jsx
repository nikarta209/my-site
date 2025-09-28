import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Type,
  Palette,
  BookOpen,
  Bookmark,
  BookmarkPlus,
  StickyNote,
  Moon,
  Sun,
  BookOpenCheck,
  Minus,
  Plus,
  SlidersHorizontal // ИСПРАВЛЕНИЕ: Замена Adjustments на существующую иконку
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTheme } from '../layout/ThemeProvider';

export default function ReaderToolbar({ 
  fontSize, 
  onFontSizeChange, 
  isBookmarked, 
  onToggleBookmark,
  onAddNote,
  currentPage,
  totalPages,
  readingProgress 
}) {
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'sepia'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="kasbook-icon" />;
      case 'sepia':
        return <BookOpenCheck className="kasbook-icon" />; // Eye-safe иконка
      default:
        return <Sun className="kasbook-icon" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'dark':
        return 'Ночной режим';
      case 'sepia':
        return 'Комфорт для глаз'; // Специальное название для eye-safe
      default:
        return 'Дневной режим';
    }
  };

  return (
    <Card className="sticky top-4 z-10 reader-controls gentle-transition">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* Прогресс чтения */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookOpen className="kasbook-icon flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{currentPage} из {totalPages}</span>
                <span>{readingProgress}%</span>
              </div>
              <div className="progress-bar h-2 rounded-full overflow-hidden">
                <div 
                  className="progress-fill h-full gentle-transition" 
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Основные контролы */}
          <div className="flex items-center gap-2">
            {/* Закладка */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleBookmark}
              className={`gentle-transition ${isBookmarked ? 'bookmark-active' : 'bookmark-inactive'}`}
              aria-label={isBookmarked ? 'Убрать закладку' : 'Добавить закладку'}
            >
              {isBookmarked ? <Bookmark className="kasbook-icon" /> : <BookmarkPlus className="kasbook-icon" />}
            </Button>

            {/* Заметка */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onAddNote}
              className="gentle-transition"
              aria-label="Добавить заметку"
            >
              <StickyNote className="kasbook-icon" />
            </Button>

            {/* Тема */}
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              className="gentle-transition"
              aria-label={`Переключить тему: ${getThemeLabel()}`}
            >
              {getThemeIcon()}
            </Button>

            {/* Настройки шрифта */}
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="gentle-transition"
                  aria-label="Настройки шрифта"
                >
                  <SlidersHorizontal className="kasbook-icon ml-1" /> {/* ИСПРАВЛЕНИЕ: Использование SlidersHorizontal */}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 reader-controls" align="end">
                <div className="space-y-4">
                  {/* Размер шрифта */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Размер шрифта</label>
                      <Badge variant="secondary">{fontSize}px</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
                        className="h-8 w-8 gentle-transition"
                        aria-label="Уменьшить шрифт"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Slider
                        value={[fontSize]}
                        onValueChange={(value) => onFontSizeChange(value[0])}
                        max={24}
                        min={12}
                        step={2}
                        className="flex-1"
                        aria-label="Регулировка размера шрифта"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                        className="h-8 w-8 gentle-transition"
                        aria-label="Увеличить шрифт"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Тема */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Тема оформления</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['light', 'dark', 'sepia'].map((themeOption) => (
                        <Button
                          key={themeOption}
                          variant={theme === themeOption ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme(themeOption)}
                          className="gentle-transition"
                        >
                          {themeOption === 'light' && <Sun className="kasbook-icon mr-1" />}
                          {themeOption === 'dark' && <Moon className="kasbook-icon mr-1" />}
                          {themeOption === 'sepia' && <BookOpenCheck className="kasbook-icon mr-1" />}
                          {themeOption === 'light' ? 'День' : 
                           themeOption === 'dark' ? 'Ночь' : 
                           'Комфорт'} {/* Eye-safe название */}
                        </Button>
                      ))}
                    </div>
                    {theme === 'sepia' && (
                      <p className="text-xs text-muted-foreground">
                        Комфортная тема для длительного чтения без усталости глаз
                      </p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}