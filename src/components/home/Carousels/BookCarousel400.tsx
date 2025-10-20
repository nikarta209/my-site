import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '@/api/books';
import clsx from 'clsx';

type BookCarousel400Props = {
  id: string;
  title?: string;
  books: Book[];
};

export function BookCarousel400({ id, title, books }: BookCarousel400Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  const onIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .map((entry) => Number(entry.target.getAttribute('data-index') ?? '0'))
      .sort((a, b) => a - b);
    if (visible.length > 0) {
      setActiveIndex(visible[0]);
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    let observer = observerRef.current;
    if (!observer || observer.root !== viewport) {
      observer?.disconnect();
      observer = new IntersectionObserver(onIntersect, { root: viewport, threshold: 0.6 });
      observerRef.current = observer;
    }

    observer.takeRecords();
    observer.disconnect();

    itemRefs.current = itemRefs.current.slice(0, books.length);
    itemRefs.current.forEach((item) => {
      if (item) {
        observer.observe(item);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [books, onIntersect]);

  useEffect(() => () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const scrollToIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(books.length - 1, nextIndex));
    const target = itemRefs.current[clamped];
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const handlePrev = () => scrollToIndex(activeIndex - 1);
  const handleNext = () => scrollToIndex(activeIndex + 1);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        handleNext();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        handlePrev();
        break;
      default:
        break;
    }
  };

  return (
    <section className="space-y-4" aria-labelledby={`${id}-title`}>
      <div className="flex items-center justify-between gap-4 px-2">
        {title && (
          <h3 id={`${id}-title`} className="text-lg font-semibold text-foreground">
            {title}
          </h3>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Листать назад"
            className="rounded-full border border-border bg-card/80 p-2 text-sm shadow-sm transition hover:bg-card"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Листать вперёд"
            className="rounded-full border border-border bg-card/80 p-2 text-sm shadow-sm transition hover:bg-card"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={title || 'Карусель книг 400×600'}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 py-2"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {books.map((book, index) => {
          const isPlaceholder = book.id.startsWith('placeholder-');
          const coverSrc =
            book.covers['400x600'] ??
            book.covers['600x600'] ??
            book.covers['1600x900'] ??
            book.covers.mainBanner ??
            book.covers.default ??
            '';
          const card = (
            <article className="flex w-[220px] flex-col gap-3 md:w-[260px]" style={{ contain: 'content' }}>
              <div className="overflow-hidden rounded-3xl border border-border/60 bg-muted" style={{ willChange: 'transform' }}>
                <img
                  src={coverSrc}
                  alt={book.title}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/3] w-full object-cover"
                />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm font-semibold text-foreground line-clamp-2">{book.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{book.authorName}</p>
              </div>
            </article>
          );

          return (
            <div
              key={book.id}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              data-index={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${isPlaceholder ? 'Заглушка: ' : ''}${book.title} — ${book.authorName}`}
              aria-selected={activeIndex === index}
              className="snap-start"
            >
              {isPlaceholder ? (
                card
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/books/${book.id}`, { state: { book } })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/books/${book.id}`, { state: { book } });
                    }
                  }}
                  className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                >
                  {card}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2">
        {books.map((book, index) => (
          <button
            key={`${id}-bullet-${book.id}`}
            type="button"
            aria-label={`Перейти к книге ${index + 1}`}
            className={clsx(
              'h-2 w-2 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeIndex === index ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
