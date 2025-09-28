import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Type, 
  Palette, 
  AlignLeft, 
  AlignCenter, 
  AlignJustify,
  Minus,
  Plus,
  BookOpen,
  FileText
} from 'lucide-react';

const FONT_FAMILIES = [
  { name: 'Serif (Georgia)', value: 'Georgia, "Times New Roman", Times, serif', display: 'font-serif' },
  { name: 'Sans-serif (System)', value: 'system-ui, -apple-system, sans-serif', display: 'font-sans' },
  { name: 'Roboto', value: '"Roboto", sans-serif', display: 'font-sans' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif', display: 'font-sans' },
  { name: 'Merriweather', value: '"Merriweather", serif', display: 'font-serif' },
];

const THEMES = [
  { name: 'Светлая', value: 'light', bg: 'bg-white', text: 'text-gray-900' },
  { name: 'Темная', value: 'dark', bg: 'bg-gray-900', text: 'text-gray-100' },
  { name: 'Сепия', value: 'sepia', bg: 'bg-amber-50', text: 'text-amber-900' },
];

const TEXT_ALIGNMENTS = [
  { name: 'По левому краю', value: 'left', icon: AlignLeft },
  { name: 'По центру', value: 'center', icon: AlignCenter },
  { name: 'По ширине', value: 'justify', icon: AlignJustify },
];

export default function ReaderSettings({
  isOpen,
  onClose,
  fontSize = 18,
  onFontSizeChange,
  fontFamily = FONT_FAMILIES[0].value,
  onFontFamilyChange,
  lineHeight = 1.8,
  onLineHeightChange,
  textAlign = 'justify',
  onTextAlignChange,
  theme = 'light',
  onThemeChange,
  isDoubleSpread = false,
  onDoubleSpreadChange
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" />
                Настройки читалки
              </DialogTitle>
            </DialogHeader>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Шрифт и размер */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Шрифт и размер
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Семейство шрифтов */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Шрифт:
                    </Label>
                    <Select value={fontFamily} onValueChange={onFontFamilyChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem 
                            key={font.value} 
                            value={font.value}
                            style={{ fontFamily: font.value }}
                          >
                            {font.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Размер шрифта */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Размер: {fontSize}px
                    </Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Slider
                        value={[fontSize]}
                        onValueChange={([value]) => onFontSizeChange(value)}
                        min={12}
                        max={32}
                        step={2}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Межстрочный интервал */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Межстрочный интервал: {lineHeight.toFixed(1)}
                    </Label>
                    <Slider
                      value={[lineHeight]}
                      onValueChange={([value]) => onLineHeightChange(value)}
                      min={1.2}
                      max={2.5}
                      step={0.1}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Выравнивание и отображение */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlignJustify className="w-5 h-5" />
                    Выравнивание и отображение
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Выравнивание текста */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Выравнивание текста:
                    </Label>
                    <div className="flex gap-2">
                      {TEXT_ALIGNMENTS.map((alignment) => {
                        const Icon = alignment.icon;
                        return (
                          <Button
                            key={alignment.value}
                            variant={textAlign === alignment.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onTextAlignChange(alignment.value)}
                            className="flex items-center gap-2"
                          >
                            <Icon className="w-4 h-4" />
                            {alignment.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Режим отображения */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Режим отображения:
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={!isDoubleSpread ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onDoubleSpreadChange(false)}
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Одна страница
                      </Button>
                      <Button
                        variant={isDoubleSpread ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onDoubleSpreadChange(true)}
                        className="flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        Разворот
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Цветовая тема */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Цветовая тема
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.map((themeOption) => (
                      <button
                        key={themeOption.value}
                        onClick={() => onThemeChange(themeOption.value)}
                        className={`p-4 rounded-lg border transition-all ${
                          theme === themeOption.value
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-full h-12 rounded ${themeOption.bg} ${themeOption.text} flex items-center justify-center text-sm font-medium`}>
                          {themeOption.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Предварительный просмотр */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Предварительный просмотр:</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className={`p-4 rounded-lg border ${THEMES.find(t => t.value === theme)?.bg} ${THEMES.find(t => t.value === theme)?.text}`}
                    style={{
                      fontFamily: fontFamily,
                      fontSize: `${fontSize}px`,
                      lineHeight: lineHeight,
                      textAlign: textAlign
                    }}
                  >
                    <p>
                      Это образец текста для предварительного просмотра настроек. 
                      Вы можете увидеть, как будет выглядеть текст книги с выбранными параметрами.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Кнопки действий */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button onClick={onClose}>
                  Закрыть
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}