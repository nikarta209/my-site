import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Book } from '@/api/books';

const AUTOPLAY_INTERVAL = 15000;

type TwinNoteBlocksProps = {
  pairs: Book[][];
};

const stripHtml = (html?: string | null): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

const noteText = (book: Book): string => {
  return stripHtml(book.note?.html) || book.description || `${book.title} — ${book.authorName}`;
};

export function TwinNoteBlocks({ pairs }: TwinNoteBlocksProps) {
  const [active, setActive] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const manualPauseRef = useRef(false);

  const orderedPairs = useMemo(() => (pairs.length ? pairs : []), [pairs]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setPaused(true);
      } else if (!manualPauseRef.current) {
        setPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (isPaused || orderedPairs.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % orderedPairs.length);
    }, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(id);
  }, [isPaused, orderedPairs.length]);

  const switchTo = (index: number) => {
    if (!orderedPairs.length) return;
    const next = ((index % orderedPairs.length) + orderedPairs.length) % orderedPairs.length;
    setActive(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        switchTo(active + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        switchTo(active - 1);
        break;
      case 'Home':
        event.preventDefault();
        switchTo(0);
        break;
      case 'End':
        event.preventDefault();
        switchTo(orderedPairs.length - 1);
        break;
      default:
        break;
    }
  };

  const currentPair = orderedPairs[active] ?? [];

  const pauseManually = () => {
    manualPauseRef.current = true;
    setPaused(true);
  };

  const resumeManually = () => {
    manualPauseRef.current = false;
    if (!document.hidden) {
      setPaused(false);
    }
  };

  if (!orderedPairs.length) {
    return null;
  }

  return (
    <section
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
      onMouseEnter={pauseManually}
      onMouseLeave={resumeManually}
      onFocusCapture={pauseManually}
      onBlurCapture={resumeManually}
    >
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-semibold text-foreground">Выбор читателей</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Предыдущая пара"
            className="rounded-full border border-border bg-card/80 p-2 text-sm shadow-sm transition hover:bg-card"
            onClick={() => switchTo(active - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Следующая пара"
            className="rounded-full border border-border bg-card/80 p-2 text-sm shadow-sm transition hover:bg-card"
            onClick={() => switchTo(active + 1)}
          >
            ›
          </button>
        </div>
      </div>

      <div
        className="grid gap-6 md:grid-cols-2"
        role="tabpanel"
        id="readers-choice-panel"
        aria-labelledby="home-tab-readers"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {currentPair.map((book) => {
          const background = book.note?.bgImageUrl ?? book.covers['1600x900'] ?? book.covers['400x600'] ?? '';
          const text = noteText(book);
          return (
            <article
              key={book.id}
              className="flex h-full flex-col overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-xl"
            >
              <div className="relative h-[360px] overflow-hidden bg-muted md:h-[400px]">
                <img
                  src={book.covers['600x600'] ?? book.covers['400x600'] ?? background}
                  alt={book.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-background/80 px-4 py-2 shadow-lg">
                  <p className="text-sm font-semibold text-foreground">{book.title}</p>
                  <p className="text-xs text-muted-foreground">{book.authorName}</p>
                </div>
              </div>
              <div
                className="relative flex flex-1 flex-col justify-between bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(180deg, rgba(12,10,25,0.85), rgba(12,10,25,0.9)), url(${background})` }}
              >
                <div className="space-y-3 p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.4em] text-primary/80">Популярная заметка</p>
                  <p
                    className="text-base font-medium leading-relaxed"
                    style={{ WebkitLineClamp: 9, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {text}
                  </p>
                </div>
                <div className="flex items-center justify-between bg-black/30 px-6 py-4 backdrop-blur">
                  <span className="text-sm text-white/80">Читатели рекомендуют</span>
                  <button
                    type="button"
                    className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-white"
                  >
                    Читать
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2">
        {orderedPairs.map((pair, index) => (
          <button
            key={`readers-choice-${pair.map((book) => book.id).join('-')}`}
            type="button"
            aria-label={`Пара ${index + 1}`}
            className={`h-2 w-6 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active === index ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
            onClick={() => switchTo(index)}
          />
        ))}
      </div>
    </section>
  );
}
