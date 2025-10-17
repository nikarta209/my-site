import React from 'react';
import type { PublicBook } from '@/api/books';

interface PopularBooksCarouselProps {
  books: PublicBook[];
}

const PLACEHOLDER_COVER = '/assets/cover-placeholder.png';

const PopularBooksCarousel: React.FC<PopularBooksCarouselProps> = ({ books }) => {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Популярное</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {books.map((book) => {
          const coverSrc =
            book.cover_images?.square ||
            book.cover_images?.default ||
            PLACEHOLDER_COVER;

          return (
            <a
              key={book.id}
              href={`/books/${book.id}`}
              className="w-40 flex-shrink-0"
            >
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="aspect-[3/4] w-full overflow-hidden">
                  <img
                    src={coverSrc}
                    alt={book.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1 p-3">
                  <p className="text-sm font-medium line-clamp-2">{book.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {book.author || book.author_name || 'Неизвестный автор'}
                  </p>
                  {typeof book.sales_count === 'number' && (
                    <p className="text-xs text-muted-foreground">
                      Продаж: {book.sales_count}
                    </p>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default PopularBooksCarousel;
