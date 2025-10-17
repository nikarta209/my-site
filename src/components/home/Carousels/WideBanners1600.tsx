import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Book } from '@/api/books';
import clsx from 'clsx';

type WideBannersProps = {
  id: string;
  books: Book[];
};

export function WideBanners1600({ id, books }: WideBannersProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
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
      { root: viewport, threshold: 0.5 }
    );
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, []);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, books.length);
    const observer = observerRef.current;
    if (!observer) return;
    itemRefs.current.forEach((item) => item && observer.observe(item));
    return () => {
      itemRefs.current.forEach((item) => item && observer.unobserve(item));
    };
  }, [books]);

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
    <section className="space-y-6" aria-labelledby={`${id}-title`}>
      <div className="flex items-center justify-between px-2">
        <h3 id={`${id}-title`} className="text-xl font-semibold text-foreground">
          Широкие баннеры
        </h3>
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
        aria-label="Широкие баннеры 1600×1100"
        className="no-scrollbar flex snap-x snap-mandatory gap-8 overflow-x-auto px-2 py-2"
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
            aria-label={`${book.id.startsWith('placeholder-') ? 'Заглушка: ' : ''}${book.title} — ${book.authorName}`}
            aria-selected={activeIndex === index}
            className="snap-start"
          >
            <article className="w-[min(90vw,1000px)] overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-xl">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                  src={book.covers['1600x900'] ?? book.covers['400x600'] ?? ''}
                  alt={book.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
              </div>
              <div className="grid gap-2 bg-background/95 p-6 md:grid-cols-[2fr_1fr] md:items-center">
                <div className="space-y-2">
                  <h4 className="text-2xl font-semibold text-foreground line-clamp-2">{book.title}</h4>
                  <p className="text-sm font-medium text-muted-foreground">{book.authorName}</p>
                  <p className="text-sm text-muted-foreground/80 line-clamp-3 md:line-clamp-4">{book.description}</p>
                </div>
                <div className="flex items-center justify-end gap-2 md:flex-col md:items-end md:justify-center">
                  {book.covers['400x600'] && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Доступна 400×600</span>
                  )}
                  {book.covers['600x600'] && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Доступна 600×600</span>
                  )}
                </div>
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
            aria-label={`Перейти к баннеру ${index + 1}`}
            className={clsx(
              'h-2 w-6 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeIndex === index ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
