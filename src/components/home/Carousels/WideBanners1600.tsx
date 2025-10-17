import { useMemo } from 'react';
import clsx from 'clsx';
import type { NewCarouselBook as CarouselBook } from './NewBooksCarousel';

interface WideBannersProps {
  books: CarouselBook[];
}

const PLACEHOLDER_BANNER = '/assets/banner-placeholder.jpg';

let placeholderSeed = 0;

function generatePlaceholders(count: number): CarouselBook[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    placeholderSeed += 1;
    const id = `placeholder-banner-${index}-${placeholderSeed}`;
    return {
      id,
      title: 'Скоро баннер',
      author: null,
      author_name: null,
      created_at: null,
      updated_at: null,
      cover_images: null,
      likes_count: null,
      sales_count: null,
      rating: null,
      is_editors_pick: null,
      status: null,
      covers: {
        '400x600': PLACEHOLDER_BANNER,
        '600x600': PLACEHOLDER_BANNER,
        '1600x900': PLACEHOLDER_BANNER,
        mainBanner: PLACEHOLDER_BANNER,
      },
      authorName: 'KASBOOK',
      description: 'Отслеживаем лучшие истории, чтобы показать их на главной.',
    } satisfies CarouselBook;
  });
}

const WideBanners1600: React.FC<WideBannersProps> = ({ books }) => {
  const preparedBooks = useMemo(() => {
    const unique: CarouselBook[] = [];
    const seen = new Set<string>();
    books.forEach((book) => {
      if (seen.has(book.id)) return;
      seen.add(book.id);
      unique.push(book);
    });
    const target = Math.max(3, unique.length);
    if (unique.length >= target) {
      return unique;
    }
    return [...unique, ...generatePlaceholders(target - unique.length)];
  }, [books]);

  if (!preparedBooks.length) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-baseline justify-between px-2">
        <h2 className="text-2xl font-semibold text-foreground">Баннеры недели</h2>
        <p className="text-sm text-muted-foreground">Главные премьеры и промо KASBOOK</p>
      </div>
      <div className="no-scrollbar flex gap-6 overflow-x-auto pb-6">
        {preparedBooks.map((book) => {
          const isPlaceholder = book.id.startsWith('placeholder-');
          const bannerSrc = book.covers['1600x900'] ?? book.covers.mainBanner ?? PLACEHOLDER_BANNER;
          return (
            <a
              key={book.id}
              className={clsx(
                'group relative w-[min(90vw,900px)] flex-shrink-0 overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-lg',
                isPlaceholder && 'pointer-events-none'
              )}
              href={isPlaceholder ? '#!' : `/books/${book.id}`}
              tabIndex={isPlaceholder ? -1 : undefined}
              aria-disabled={isPlaceholder || undefined}
              onClick={isPlaceholder ? (event) => event.preventDefault() : undefined}
            >
              <img
                src={bannerSrc}
                alt={book.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
                style={{ contain: 'content', willChange: 'transform' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 text-white">
                <h3 className="text-xl font-semibold leading-tight">{book.title}</h3>
                <p className="text-sm text-white/80">{book.authorName}</p>
                {book.description && (
                  <p className="text-sm text-white/70 line-clamp-2">{book.description}</p>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default WideBanners1600;
