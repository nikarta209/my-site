import React from 'react';
import type { PublicBook } from '@/api/books';

interface WideBannersProps {
  books: PublicBook[];
}

const PLACEHOLDER_BANNER = '/assets/banner-placeholder.jpg';

const WideBanners1600: React.FC<WideBannersProps> = ({ books }) => {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="no-scrollbar flex gap-6 overflow-x-auto pb-3">
        {books.map((book) => {
          const bannerSrc =
            book.cover_images?.main_banner ||
            book.cover_images?.library_hero ||
            book.cover_images?.landscape ||
            book.cover_images?.default ||
            PLACEHOLDER_BANNER;

          return (
            <a
              key={book.id}
              href={`/books/${book.id}`}
              className="relative w-[min(90vw,900px)] flex-shrink-0 overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
            >
              <img
                src={bannerSrc}
                alt={book.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 text-white">
                <h3 className="text-xl font-semibold">{book.title}</h3>
                <p className="text-sm text-white/70">
                  {book.author || book.author_name || 'Неизвестный автор'}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default WideBanners1600;
