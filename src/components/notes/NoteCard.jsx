import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Heart,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  Upload,
  Undo2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlight = (text = '', query = '') => {
  if (!query) return text;
  const trimmed = query.trim();
  if (!trimmed) return text;

  const safeQuery = escapeRegExp(trimmed);
  if (!safeQuery) return text;

  const regex = new RegExp(`(${safeQuery})`, 'ig');
  const normalized = trimmed.toLowerCase();

  return text.split(regex).map((part, index) => {
    if (part.toLowerCase() === normalized) {
      return (
        <mark
          key={`${part}-${index}`}
          className="rounded px-1 py-0.5 bg-amber-200/70 text-amber-900 dark:bg-amber-500/30 dark:text-amber-100"
        >
          {part}
        </mark>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('[NoteCard] Failed to format date', error);
    return '';
  }
};

const DEFAULT_GRADIENT = 'from-violet-500/80 via-fuchsia-500/70 to-orange-400/70';

const NoteCard = ({
  note,
  variant = 'personal',
  onPublish,
  onEdit,
  onDelete,
  onLikeToggle,
  onUnpublish,
  onShare,
  isLiked = false,
  highlightTerm = '',
  isPublishing = false,
  isDeleting = false,
  isEditing = false,
  isUnpublishing = false,
  isLiking = false
}) => {
  const [expanded, setExpanded] = useState(false);

  const {
    id,
    title,
    noteText = '',
    selectedText = '',
    tags = [],
    bookTitle,
    bookAuthor,
    coverUrl,
    pageNumber,
    createdAt,
    updatedAt,
    likesCount = 0,
    accentColor,
    highlightColor,
    allowComments = true,
    isDraft = false
  } = note || {};

  const bodyText = noteText || selectedText || '';

  const preview = useMemo(() => {
    const content = bodyText.replace(/\s+/g, ' ').trim();
    if (!content) return '';
    if (expanded) return content;
    if (content.length <= 320) return content;
    return `${content.slice(0, 320)}…`;
  }, [bodyText, expanded]);

  const cardBackground = useMemo(() => {
    if (variant !== 'personal') return 'bg-card/95 backdrop-blur';
    if (accentColor && Array.isArray(accentColor)) {
      return `bg-gradient-to-br ${accentColor.join(' ')}`;
    }
    if (typeof accentColor === 'string' && accentColor.includes('from-')) {
      return `bg-gradient-to-br ${accentColor}`;
    }
    return `bg-gradient-to-br ${DEFAULT_GRADIENT}`;
  }, [variant, accentColor]);

  const textColor = variant === 'personal' ? 'text-white drop-shadow-sm' : 'text-foreground';

  const renderTag = (tag, index) => (
    <Badge
      key={`${tag}-${index}`}
      variant={variant === 'personal' ? 'secondary' : 'outline'}
      className={cn(
        'text-xs font-medium uppercase tracking-wide',
        variant === 'personal'
          ? 'bg-white/20 text-white border-white/30'
          : 'text-foreground/70'
      )}
    >
      {tag}
    </Badge>
  );

  const showToggle = bodyText.length > 320;

  const metadataTextColor = variant === 'personal' ? 'text-white/70' : 'text-muted-foreground';

  return (
    <Card
      data-note-id={id}
      className={cn(
        'relative flex flex-col overflow-hidden transition-transform focus-within:ring-2 focus-within:ring-primary/70 focus-within:ring-offset-2',
        variant === 'personal' ? 'border-none shadow-lg shadow-violet-500/10' : 'border-border/80 hover:border-primary/50 hover:shadow-lg/40',
        cardBackground
      )}
    >
      <CardHeader className={cn('space-y-2', variant === 'personal' ? 'pb-4' : 'pb-3')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={bookTitle || 'Обложка книги'}
                className={cn(
                  'h-16 w-12 flex-shrink-0 rounded-md border object-cover shadow-sm',
                  variant === 'personal'
                    ? 'border-white/40 shadow-black/20'
                    : 'border-border'
                )}
              />
            ) : (
              <div
                className={cn(
                  'flex h-16 w-12 flex-shrink-0 items-center justify-center rounded-md border text-xs font-semibold uppercase',
                  variant === 'personal'
                    ? 'border-white/30 bg-white/10 text-white/80'
                    : 'border-border bg-muted text-muted-foreground'
                )}
              >
                <BookOpen className="h-4 w-4" />
              </div>
            )}

            <div className="min-w-0">
              <CardTitle className={cn('text-base font-semibold', textColor)}>
                {title ? highlight(title, highlightTerm) : highlight(bookTitle || 'Заметка', highlightTerm)}
              </CardTitle>
              {(bookTitle || bookAuthor) && (
                <CardDescription className={cn('text-sm', metadataTextColor)}>
                  {highlight(
                    [bookTitle, bookAuthor].filter(Boolean).join(' • '),
                    highlightTerm
                  )}
                </CardDescription>
              )}
            </div>
          </div>

          {variant === 'published' ? (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold shadow-sm transition-colors',
                  isLiked
                    ? 'bg-rose-500/90 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
                aria-live="polite"
              >
                <Heart className={cn('h-4 w-4', isLiked ? 'fill-white' : 'fill-none')} />
                <span>{likesCount}</span>
              </div>

              {onUnpublish && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      aria-label="Дополнительные действия"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      disabled={isUnpublishing}
                      onClick={() => onUnpublish(note)}
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      Снять с публикации
                    </DropdownMenuItem>
                    {onShare && (
                      <DropdownMenuItem onClick={() => onShare(note)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Поделиться
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 text-white">Личная</Badge>
              {isDraft && <Badge className="bg-black/30 text-white">Черновик</Badge>}
            </div>
          )}
        </div>

        <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs', metadataTextColor)}>
          {pageNumber && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Страница {pageNumber}
            </span>
          )}
          {createdAt && (
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Создано {formatDate(createdAt)}
            </span>
          )}
          {updatedAt && updatedAt !== createdAt && (
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Обновлено {formatDate(updatedAt)}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Теги заметки">
            {tags.map(renderTag)}
          </div>
        )}
      </CardHeader>

      {bodyText && (
        <CardContent className={cn('relative space-y-4 text-sm leading-relaxed', textColor)}>
          {selectedText && (
            <blockquote
              className={cn(
                'rounded-lg border-l-4 bg-black/5 px-4 py-3 italic backdrop-blur-sm',
                variant === 'personal'
                  ? 'border-white/60 bg-white/10'
                  : 'border-primary/30 bg-primary/5'
              )}
            >
              {highlight(`«${selectedText.trim()}»`, highlightTerm)}
            </blockquote>
          )}

          {noteText && (
            <p className={cn('whitespace-pre-line', expanded ? '' : 'line-clamp-5')}>
              {highlight(preview, highlightTerm)}
            </p>
          )}

          {showToggle && (
            <Button
              type="button"
              variant={variant === 'personal' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                variant === 'personal' ? 'bg-white/20 text-white hover:bg-white/30' : ''
              )}
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  Свернуть
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Читать далее
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </Button>
          )}
        </CardContent>
      )}

      <CardFooter className={cn('mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-4', variant === 'personal' ? 'border-white/20' : 'border-border/80')}>
        {variant === 'personal' ? (
          <>
            {onPublish && (
              <Button
                variant="default"
                className="shadow-sm"
                disabled={isPublishing}
                onClick={() => onPublish(note)}
                aria-label="Опубликовать заметку"
              >
                <Upload className="mr-2 h-4 w-4" />
                Опубликовать
              </Button>
            )}
            {onEdit && (
              <Button
                variant="secondary"
                disabled={isEditing}
                onClick={() => onEdit(note)}
                aria-label="Редактировать заметку"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                className={variant === 'personal' ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-destructive'}
                disabled={isDeleting}
                onClick={() => onDelete(note)}
                aria-label="Удалить заметку"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {onLikeToggle && (
              <Button
                type="button"
                variant={isLiked ? 'default' : 'outline'}
                className={cn('rounded-full px-4', isLiked ? 'bg-rose-500 hover:bg-rose-500 text-white' : '')}
                onClick={() => onLikeToggle(note)}
                aria-pressed={isLiked}
                disabled={isLiking}
                aria-label={isLiked ? 'Снять лайк с заметки' : 'Поставить лайк заметке'}
              >
                <Heart className={cn('mr-2 h-4 w-4 transition-transform', isLiked ? 'fill-current' : 'fill-none')} />
                {isLiked ? 'Снять лайк' : 'Лайк'}
              </Button>
            )}
            {allowComments === false && (
              <Badge variant="outline" className="text-xs">
                Комментарии выключены
              </Badge>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default NoteCard;
