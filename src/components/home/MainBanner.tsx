import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MainBannerBook } from '@/api/books';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

const FALLBACK_BANNER = '/assets/banner-placeholder.jpg';
const AUTOPLAY_INTERVAL = 8000;

type MainBannerProps = {
  books: MainBannerBook[];
};

const descriptionFields = [
  'description',
  'summary',
  'annotation',
  'short_description',
  'teaser',
  'excerpt',
  'highlight',
  'tagline',
];

function resolveDescription(book: MainBannerBook): string {
  const record = book as Record<string, unknown>;

  for (const field of descriptionFields) {
    const value = record[field];
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (normalized) {
        return normalized;
      }
    }
  }

  return '';
}

export function MainBanner({ books }: MainBannerProps) {
  const slides = useMemo(() => books.slice(0, 3), [books]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(id);
  }, [slides.length]);

  const goTo = (index: number) => {
    if (!slides.length) return;
    const next = ((index % slides.length) + slides.length) % slides.length;
    setActiveIndex(next);
  };

  if (!slides.length) {
    return null;
  }

  const active = slides[activeIndex];
  const description = resolveDescription(active);
  const imageSrc = active.main_banner_url ?? FALLBACK_BANNER;
  const author = active.author?.trim() || 'Неизвестный автор';
  const rankingLabel = `Топ ${activeIndex + 1} из ${slides.length}`;
  const salesHint =
    typeof active.sales_count === 'number' && active.sales_count > 0
      ? `Продано экземпляров: ${active.sales_count.toLocaleString('ru-RU')}`
      : null;

  return (
    <section className="mx-auto w-full px-3 md:w-[80vw] md:max-w-[1200px]" aria-label="Главный баннер">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950 text-white shadow-2xl"
        style={{ height: 'clamp(280px, 40vh, 420px)' }}
        role="region"
        aria-roledescription="carousel"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-900/10 to-slate-950/80" />

        <div className="relative flex h-full flex-col md:flex-row" role="presentation">
          <div className="relative flex h-[45%] min-h-[200px] w-full flex-shrink-0 items-center justify-center overflow-hidden md:h-full md:w-1/2">
            <img
              src={imageSrc}
              alt={`Обложка книги ${active.title}`}
              className="h-full w-full max-h-full max-w-full object-cover"
              loading="eager"
            />
          </div>

          <div className="flex flex-1 flex-col justify-center gap-4 p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="uppercase tracking-widest">{rankingLabel}</span>
              {salesHint && <span className="hidden md:inline-flex items-center text-xs text-white/60">{salesHint}</span>}
            </div>

            <h2 className="text-3xl font-semibold leading-tight md:text-4xl">{active.title}</h2>
            <p className="text-lg font-medium text-white/80 md:text-xl">{author}</p>

            {description && (
              <p
                className="max-w-2xl text-sm leading-relaxed text-white/80 md:text-base"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-white text-gray-900 hover:bg-white/90"
              >
                <Link to={createPageUrl(`BookDetails?id=${active.id}`)}>Подробнее о книге</Link>
              </Button>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Предыдущий баннер"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              type="button"
              aria-label="Следующий баннер"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Перейти к баннеру ${index + 1}`}
                  aria-current={activeIndex === index}
                  onClick={() => goTo(index)}
                  className={`h-2 w-8 rounded-full transition ${
                    activeIndex === index ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default MainBanner;
