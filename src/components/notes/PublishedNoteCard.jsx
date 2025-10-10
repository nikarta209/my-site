import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, Share2, MoreVertical, BookOpen, Clock, Users } from 'lucide-react';
import HighlightedText from './HighlightedText';
import { cn } from '@/lib/utils';

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

export default function PublishedNoteCard({
  note,
  searchQuery,
  isLiked,
  onToggleLike,
  onShare,
  onUnpublish
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewText = note.note_text?.trim() || note.selected_text?.trim() || '';
  const shouldClamp = previewText.length > 320;

  const displayText = useMemo(() => {
    if (!previewText) return 'Заметка без текста';
    if (isExpanded || previewText.length <= 320) return previewText;
    return `${previewText.slice(0, 320)}…`;
  }, [previewText, isExpanded]);

  return (
    <Card className="relative overflow-hidden border border-border/80 shadow-sm hover:shadow-lg transition-shadow bg-card">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={note.book_cover || note.book_cover_url || note.book?.cover_url}
                alt={note.book_title}
                className="w-14 h-20 rounded-xl object-cover border border-border/70"
              />
              <Badge className="absolute -top-2 -left-2 bg-emerald-500 text-white shadow">Опубликовано</Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                <HighlightedText text={note.book_title} query={searchQuery} />
              </h3>
              {note.book_author && (
                <p className="text-sm text-muted-foreground">{note.book_author}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {note.page_number && (
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Стр. {note.page_number}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {getReadingTime(previewText)} чтения
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" /> {note.likes_count || 0} лайков
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isLiked ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => onToggleLike(note)}
                    className={cn('flex items-center gap-2 transition-transform', {
                      'bg-rose-500 hover:bg-rose-600 text-white': isLiked
                    })}
                    aria-pressed={isLiked}
                  >
                    <Heart className={cn('w-4 h-4', { 'fill-current': isLiked })} />
                    {note.likes_count || 0}
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>
                  {isLiked ? 'Снять лайк' : 'Поставить лайк'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="hover:bg-muted" aria-label="Действия с заметкой">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onShare(note)}>
                  <Share2 className="w-4 h-4 mr-2" /> Поделиться
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUnpublish(note)} className="text-destructive focus:text-destructive">
                  Снять с публикации
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {note.selected_text && (
          <blockquote className="border-l-4 border-primary/20 bg-primary/5 px-4 py-3 italic rounded-r-xl text-sm text-muted-foreground">
            «{note.selected_text}»
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

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Опубликована: {formatDate(note.created_at)}</span>
          {note.updated_at && (
            <span>Обновлена: {formatDate(note.updated_at)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
