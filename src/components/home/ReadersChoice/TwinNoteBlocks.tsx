import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import type { NewCarouselBook as CarouselBook } from '../Carousels/NewBooksCarousel';

const SLIDE_INTERVAL = 15000;

type Note = {
  id: string;
  bookId: string;
  html: string;
  bgImageUrl?: string | null;
};

export type TwinNoteItem = {
  id: string;
  note: Note;
  book: CarouselBook | null;
};

interface TwinNoteBlocksProps {
  notes: TwinNoteItem[];
}

const PLACEHOLDER_COVER = '/assets/cover-placeholder.png';
const PLACEHOLDER_NOTE = '/assets/banner-placeholder.jpg';
const EMPTY_NOTE_HTML = '<p>Скоро появится новая заметка от читателя.</p>';

let placeholderSeed = 0;

function sanitizeHtml(html: string): string {
  if (!html) return EMPTY_NOTE_HTML;
  return html.replace(/<script[^>]*?>[\s\S]*?<\/script>/gi, '').trim() || EMPTY_NOTE_HTML;
}

function generatePlaceholders(count: number): TwinNoteItem[] {
  return Array.from({ length: Math.max(0, count) }, () => {
    placeholderSeed += 1;
    const id = `placeholder-note-${placeholderSeed}`;
    return {
      id,
      note: {
        id,
        bookId: id,
        html: EMPTY_NOTE_HTML,
        bgImageUrl: PLACEHOLDER_NOTE,
      },
      book: {
        id,
        title: 'Заметка готовится',
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
          '400x600': PLACEHOLDER_COVER,
          '600x600': PLACEHOLDER_COVER,
          '1600x900': PLACEHOLDER_NOTE,
          mainBanner: PLACEHOLDER_NOTE,
        },
        authorName: 'Сообщество KASBOOK',
        description: null,
      } satisfies CarouselBook,
    } satisfies TwinNoteItem;
  });
}

const TwinNoteBlocks: React.FC<TwinNoteBlocksProps> = ({ notes }) => {
  const slides = useMemo(() => {
    const normalized = [...notes];
    if (normalized.length < 10) {
      normalized.push(...generatePlaceholders(10 - normalized.length));
    }
    const effective = normalized.slice(0, 10);
    const result: TwinNoteItem[][] = [];
    for (let index = 0; index < effective.length; index += 2) {
      const pair = effective.slice(index, index + 2);
      if (pair.length === 1) {
        pair.push(generatePlaceholders(1)[0]);
      }
      result.push(pair);
      if (result.length === 5) break;
    }
    return result;
  }, [notes]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length) return undefined;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const goTo = (next: number) => {
    setActive(((next % slides.length) + slides.length) % slides.length);
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 rounded-[32px] border border-border/60 bg-card/80 p-6 shadow-2xl">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-semibold text-foreground">На ваш вкус</h2>
        <p className="text-sm text-muted-foreground">Популярные заметки и выбор читателей</p>
      </div>
      <div className="relative">
        <div className="relative min-h-[960px] w-full overflow-hidden rounded-[28px] bg-muted/20 p-4">
          {slides.map((pair, index) => (
            <div
              key={`note-slide-${index}`}
              className={clsx(
                'absolute inset-0 transition-all duration-700 ease-in-out',
                index === active
                  ? 'opacity-100 translate-x-0'
                  : 'pointer-events-none -translate-x-6 opacity-0'
              )}
            >
              <div className="grid h-full gap-6 md:grid-cols-2">
                {pair.map((item) => {
                  const { note, book } = item;
                  const cover = book?.covers['600x600'] ?? PLACEHOLDER_COVER;
                  const background = note.bgImageUrl ?? book?.covers['1600x900'] ?? PLACEHOLDER_NOTE;
                  return (
                    <article
                      key={item.id}
                      className="flex h-full flex-col items-stretch justify-between gap-4 rounded-[28px] p-4"
                    >
                      <div className="overflow-hidden rounded-[28px] border border-border/60 bg-muted" style={{ height: 600 }}>
                        <img
                          src={cover}
                          alt={book?.title ?? 'Обложка книги'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          style={{ contain: 'content', willChange: 'transform' }}
                        />
                      </div>
                      <div className="relative overflow-hidden rounded-[28px] border border-border/60" style={{ height: 400 }}>
                        <img
                          src={background}
                          alt={book?.title ?? 'Фон заметки'}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          style={{ contain: 'content', willChange: 'transform' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 text-white">
                          <div
                            className="prose prose-invert max-w-none text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.html) }}
                          />
                          <div className="space-y-1 text-left">
                            <p className="text-sm font-semibold leading-tight">
                              {book?.title ?? 'Новая заметка скоро появится'}
                            </p>
                            <p className="text-xs text-white/70">{book?.authorName ?? 'Сообщество KASBOOK'}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="Предыдущая пара заметок"
          onClick={() => goTo(active - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card/90 p-3 shadow-lg transition hover:bg-card"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Следующая пара заметок"
          onClick={() => goTo(active + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card/90 p-3 shadow-lg transition hover:bg-card"
        >
          ›
        </button>
      </div>
      <div className="flex items-center justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={`note-indicator-${index}`}
            type="button"
            aria-label={`Перейти к слайду ${index + 1}`}
            className={clsx(
              'h-2 w-10 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              index === active ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default TwinNoteBlocks;
