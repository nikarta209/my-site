import React, { useMemo } from 'react';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import BookCard from './BookCard';

const PATTERNS = [
  ['m', 's', 's', 'm', 's', 's'],
  ['l', 's', 'm', 's', 's', 'm'],
  ['s', 'm', 's', 'l', 's', 'm'],
  ['m', 's', 'l', 's', 'm', 's'],
];

const skeletonCount = 8;

export default function BooksMasonry({ books = [], isLoading = false }) {
  const { t } = useTranslation();
  const pattern = useMemo(() => PATTERNS[Math.floor(Math.random() * PATTERNS.length)], [books.length]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: skeletonCount }).map((_, index) => (
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {books.map((book, index) => {
        const size = pattern[index % pattern.length] || 's';
        return <BookCard key={book.id || index} book={book} size={size} />;
      })}
    </div>
  );
}
