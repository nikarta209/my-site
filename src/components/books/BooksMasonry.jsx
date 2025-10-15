import { useMemo } from 'react';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import BookCard from './BookCard';

const PATTERNS = [
  ['m', 's', 's', 'm', 's', 's'],
  ['l', 's', 'm', 's', 's', 'm'],
  ['s', 'm', 's', 'l', 's', 'm'],
  ['m', 's', 'l', 's', 'm', 's'],
];

const SKELETON_COUNT = 8;

export default function BooksMasonry({ books = [], isLoading = false, onAddToCart, onOpen }) {
  const { t } = useTranslation();

  const pattern = useMemo(
    () => {
      const offset = books.length % PATTERNS.length;
      const randomIndex = Math.floor(Math.random() * PATTERNS.length);
      return PATTERNS[(randomIndex + offset) % PATTERNS.length];
    },
    // NOTE: Depend on length to reshuffle pattern when the grid size changes.
    [books.length]
  );

  if (isLoading) {
    return (
      <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <div
            key={index}
            className="col-span-1 h-64 animate-pulse rounded-3xl border border-dashed border-border/60 bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (!books.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
        {t('home.cards.empty')}
      </div>
    );
  }

  return (
    <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
      {books.map((book, index) => {
        const size = pattern[index % pattern.length] || 's';

        return (
          <BookCard
            key={book.id || index}
            book={book}
            size={size}
            onAddToCart={onAddToCart}
            onOpen={onOpen}
          />
        );
      })}
    </div>
  );
}
