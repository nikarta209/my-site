import { useMemo } from 'react';
import BookCard from './BookCard';
import { cn } from '@/lib/utils';

const PATTERNS = [
  ['m', 's', 's', 'm', 'l', 's', 'm', 's'],
  ['l', 's', 'm', 's', 'm', 's', 's', 'm'],
  ['m', 's', 'l', 's', 'm', 's', 'm', 's'],
  ['m', 'm', 's', 's', 'l', 's', 'm', 's'],
];

const LAYOUT_CLASSES = {
  s: 'col-span-1',
  m: 'col-span-2 md:col-span-2 xl:col-span-2',
  l: 'col-span-2 md:col-span-3 xl:col-span-3 md:row-span-2 xl:row-span-2',
};

const generateSizes = (count) => {
  if (count === 0) return [];
  const sizes = [];
  let patternIndex = 0;
  let pointer = 0;
  while (sizes.length < count) {
    const pattern = PATTERNS[patternIndex % PATTERNS.length];
    sizes.push(pattern[pointer % pattern.length]);
    pointer += 1;
    if (pointer >= pattern.length) {
      pointer = 0;
      patternIndex += 1;
    }
  }
  return sizes.slice(0, count);
};

export default function BooksMasonry({ books, onAddToCart, onOpen }) {
  const sizes = useMemo(() => generateSizes(books.length), [books.length]);

  if (!books.length) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-44 rounded-3xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid auto-rows-[minmax(0,_1fr)] grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
      {books.map((book, index) => {
        const size = sizes[index] ?? 'm';
        return (
          <div key={book.id} className={cn('flex', LAYOUT_CLASSES[size])}>
            <BookCard
              book={book}
              size={size}
              className="h-full w-full"
              onAddToCart={onAddToCart}
              onOpen={onOpen}
            />
          </div>
        );
      })}
    </div>
  );
}
