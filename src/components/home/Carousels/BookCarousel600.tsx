import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Book } from '@/api/books';
import clsx from 'clsx';

type BookCarousel600Props = {
  id: string;
  title?: string;
  books: Book[];
};

export function BookCarousel600({ id, title, books }: BookCarousel600Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number(entry.target.getAttribute('data-index') ?? '0'))
          .sort((a, b) => a - b);
        if (visible.length > 0) {
          setActiveIndex(visible[0]);
        }
      },
      { root: viewport, threshold: 0.6 }
    );

    itemRefs.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, [books.length]);

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
        aria-label={title || 'Карусель книг 600×600'}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 py-2"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {books.map((book, index) => (
          <div
            key={book.id}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            data-index={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${book.title} — ${book.authorName}`}
            aria-selected={activeIndex === index}
            className="snap-start"
          >
            <article className="flex w-[240px] flex-col gap-3 md:w-[280px]">
              <div className="overflow-hidden rounded-3xl border border-border/60 bg-muted">
                <img
                  src={book.covers['600x600'] ?? book.covers['400x600'] ?? book.covers['1600x900'] ?? ''}
                  alt={book.title}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm font-semibold text-foreground line-clamp-2">{book.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{book.authorName}</p>
              </div>
            </article>
          </div>
        ))}
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
