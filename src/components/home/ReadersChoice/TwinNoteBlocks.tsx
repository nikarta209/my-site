import { useMemo } from 'react';
import type { NewCarouselBook as CarouselBook } from '../Carousels/NewBooksCarousel';

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
      book: null,
    } satisfies TwinNoteItem;
  });
}

const TwinNoteBlocks: React.FC<TwinNoteBlocksProps> = ({ notes }) => {
  const pairs = useMemo(() => {
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

  if (pairs.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-xl">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Заметки читателей</h2>
        <p className="text-sm text-muted-foreground">Лучшие хайлайты и пометки сообщества KASBOOK</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {pairs.map((pair, columnIndex) => (
          <div key={`note-pair-${columnIndex}`} className="space-y-6">
            {pair.map((item) => {
              const { note, book } = item;
              const cover = book?.covers['400x600'] ?? book?.covers['600x600'] ?? PLACEHOLDER_COVER;
              const background = note.bgImageUrl ?? book?.covers['1600x900'] ?? PLACEHOLDER_NOTE;
              return (
                <article
                  key={item.id}
                  className="group relative overflow-hidden rounded-3xl border border-border/60 bg-muted/20 shadow-md"
                  style={{ contain: 'content' }}
                >
                  <img
                    src={background}
                    alt={book?.title ?? 'Заметка читателя'}
                    className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                    style={{ contain: 'content', willChange: 'transform' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 text-white">
                    <div
                      className="prose prose-invert max-w-none text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.html) }}
                    />
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-12 overflow-hidden rounded-xl border border-white/30 bg-white/10">
                        <img
                          src={cover}
                          alt={book?.title ?? 'Обложка'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          style={{ contain: 'content', willChange: 'transform' }}
                        />
                      </div>
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
        ))}
      </div>
    </section>
  );
};

export default TwinNoteBlocks;
