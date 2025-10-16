import type { Book } from '@/api/books';

type Featured400Props = {
  book: Book | null;
};

export function Featured400({ book }: Featured400Props) {
  if (!book) return null;

  const cover = book.covers['400x600'] ?? book.covers['600x600'] ?? '';

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-border/60 bg-card shadow-xl">
        <div className="grid gap-6 p-6 md:grid-cols-[240px_1fr] md:p-8">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted">
            <img
              src={cover}
              alt={book.title}
              loading="lazy"
              className="aspect-[2/3] w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.4em] text-primary">Рекомендация</p>
            <h3 className="text-2xl font-semibold text-foreground md:text-3xl">{book.title}</h3>
            <p className="text-sm text-muted-foreground">{book.authorName}</p>
            <p className="text-sm text-muted-foreground/80 md:text-base line-clamp-5">{book.description}</p>
            <div className="flex flex-wrap gap-2">
              {book.covers['1600x900'] && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Есть баннер 1600×900</span>
              )}
              {book.covers['600x600'] && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Доступна обложка 600×600</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
