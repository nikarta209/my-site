import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, Pencil, Trash2, BookOpen, Clock } from 'lucide-react';
import HighlightedText from './HighlightedText';
import { cn } from '@/lib/utils';

const backgroundByHighlight = {
  yellow: 'from-amber-100/80 via-amber-50 to-white',
  green: 'from-emerald-100/70 via-emerald-50 to-white',
  blue: 'from-sky-100/70 via-sky-50 to-white',
  pink: 'from-pink-100/70 via-pink-50 to-white',
  orange: 'from-orange-100/70 via-orange-50 to-white'
};

const highlightBadgeByColor = {
  yellow: 'bg-yellow-200 text-yellow-900',
  green: 'bg-green-200 text-green-900',
  blue: 'bg-blue-200 text-blue-900',
  pink: 'bg-pink-200 text-pink-900',
  orange: 'bg-orange-200 text-orange-900'
};

const formatDate = (value) => {
  if (!value) return 'Дата неизвестна';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  } catch (error) {
    return 'Дата неизвестна';
  }
};

const getReadingTime = (text = '') => {
  if (!text) return 'мгновение';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 180));
  return `${minutes} мин.`;
};

export default function PersonalNoteCard({
  note,
  searchQuery,
  onPublish,
  onEdit,
  onDelete
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const backgroundClass = backgroundByHighlight[note.highlightColor] || 'from-slate-100 via-slate-50 to-white';
  const highlightBadgeClass = highlightBadgeByColor[note.highlightColor] || 'bg-slate-200 text-slate-900';

  const previewText = note.noteText?.trim() || note.selectedText?.trim() || '';
  const shouldClamp = previewText.length > 280;

  const displayText = useMemo(() => {
    if (!previewText) return 'Заметка без текста';
    if (isExpanded || previewText.length <= 280) return previewText;
    return `${previewText.slice(0, 280)}…`;
  }, [previewText, isExpanded]);

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-none shadow-md transition-all hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/60',
        'bg-gradient-to-br',
        backgroundClass
      )}
    >
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={note.bookCover}
                alt={note.bookTitle}
                className="w-14 h-20 rounded-xl object-cover shadow-sm border border-white/60"
              />
              <Badge className="absolute -top-2 -left-2 bg-amber-500 text-white shadow">Личная</Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                <HighlightedText text={note.bookTitle} query={searchQuery} />
              </h3>
              {note.bookAuthor && (
                <p className="text-sm text-muted-foreground">{note.bookAuthor}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Стр. {note.pageNumber || '—'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {getReadingTime(previewText)} чтения
                </span>
                <Badge variant="outline" className={highlightBadgeClass}>
                  Выделение
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <span className="text-xs text-muted-foreground">Создана: {formatDate(note.createdAt)}</span>
            {note.updatedAt && note.updatedAt !== note.createdAt && (
              <span className="text-xs text-muted-foreground/80">Обновлена: {formatDate(note.updatedAt)}</span>
            )}
            <div className="flex gap-2 mt-3">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="bg-white/80" onClick={() => onPublish(note)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Опубликовать
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>Поделитесь заметкой с читателями</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button size="icon" variant="ghost" className="bg-white/70" onClick={() => onEdit(note)}>
                <Pencil className="w-4 h-4" />
                <span className="sr-only">Редактировать</span>
              </Button>
              <Button size="icon" variant="ghost" className="bg-white/70 text-destructive" onClick={() => onDelete(note)}>
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Удалить</span>
              </Button>
            </div>
          </div>
        </div>

        {note.selectedText && (
          <blockquote className="border-l-4 border-white/80 bg-white/40 backdrop-blur-sm px-4 py-3 italic rounded-r-xl text-sm text-muted-foreground">
            «{note.selectedText}»
          </blockquote>
        )}

        <div className="space-y-3">
          <HighlightedText
            text={displayText}
            query={searchQuery}
            className={cn('text-sm leading-relaxed text-foreground/90', {
              'line-clamp-5': shouldClamp && !isExpanded
            })}
          />
          {shouldClamp && (
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="text-sm font-medium text-primary hover:underline focus:outline-none"
            >
              {isExpanded ? 'Свернуть' : 'Читать далее'}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
