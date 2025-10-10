import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import {
  Archive,
  BookOpen,
  Crown,
  Download,
  StickyNote
} from 'lucide-react';

const MENU_ITEMS = [
  {
    key: 'dashboard',
    label: 'Главная',
    icon: BookOpen
  },
  {
    key: 'owned',
    label: 'Мои книги',
    icon: Archive
  },
  {
    key: 'previews',
    label: 'Превью',
    icon: Download
  },
  {
    key: 'notes',
    label: 'Мои заметки',
    icon: StickyNote,
    path: createPageUrl('library/notes')
  },
  {
    key: 'subscription',
    label: 'По подписке',
    icon: Crown
  }
];

const DEFAULT_COUNTS = Object.freeze({});

const LibraryMenu = ({
  activeKey,
  onSelect,
  counts = DEFAULT_COUNTS,
  subscriptionActive = true,
  className
}) => {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'flex items-center gap-1 overflow-x-auto rounded-xl bg-muted/30 p-1 shadow-sm backdrop-blur',
        className
      )}
      aria-label="Навигация по разделам библиотеки"
    >
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        const itemCount = counts[item.key] ?? 0;
        const isSubscription = item.key === 'subscription';
        const isLocked = isSubscription && !subscriptionActive;

        if (isSubscription && isLocked && itemCount === 0) {
          return null;
        }

        const isNotes = item.key === 'notes';
        const isActive = isNotes
          ? location.pathname.toLowerCase().startsWith('/library/notes')
          : activeKey === item.key;

        const commonClasses = cn(
          'relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
          isActive
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-foreground/70 hover:bg-muted/60 hover:text-primary',
          isLocked && 'cursor-not-allowed opacity-60'
        );

        const badge =
          !isLocked && itemCount > 0 ? (
            <Badge variant="secondary" className="ml-1 text-xs">
              {itemCount}
            </Badge>
          ) : null;

        if (item.path) {
          return (
            <Link
              key={item.key}
              to={item.path}
              className={commonClasses}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
              {badge}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (isLocked) return;
              onSelect?.(item.key);
            }}
            className={commonClasses}
            aria-pressed={isActive}
            disabled={isLocked}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {item.label}
            {badge}
            {isLocked && (
              <span className="sr-only">Раздел доступен по подписке</span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default LibraryMenu;
