import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Slide } from '@/api/books';
import clsx from 'clsx';

const AUTOPLAY_INTERVAL = 8000;

type TopSliderProps = {
  slides: Slide[];
};

export function TopSlider({ slides }: TopSliderProps) {
  const [active, setActive] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const manualPauseRef = useRef(false);

  const orderedSlides = useMemo(() => (slides.length ? slides : []), [slides]);
  const firstSlideId = orderedSlides[0]?.id;

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
    if (isPaused || orderedSlides.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % orderedSlides.length);
    }, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(id);
  }, [isPaused, orderedSlides.length]);

  useEffect(() => {
    const slide = orderedSlides[active];
    if (!slide || !liveRegionRef.current) return;
    const text =
      slide.type === 'promo'
        ? `${slide.title}. ${slide.description}`
        : `${slide.book.id.startsWith('placeholder-') ? 'Заглушка: ' : ''}${slide.book.title} — ${slide.book.authorName}`;
    liveRegionRef.current.textContent = text;
  }, [active, orderedSlides]);

  const switchTo = useCallback(
    (index: number) => {
      if (!orderedSlides.length) return;
      const next = ((index % orderedSlides.length) + orderedSlides.length) % orderedSlides.length;
      setActive(next);
    },
    [orderedSlides.length]
  );

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
        switchTo(orderedSlides.length - 1);
        break;
      default:
        break;
    }
  };

  const currentSlide = orderedSlides[active];

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

  if (!orderedSlides.length) {
    return null;
  }

  return (
    <section
      className="relative mx-auto w-full max-w-6xl px-3"
      onMouseEnter={pauseManually}
      onMouseLeave={resumeManually}
      onFocusCapture={pauseManually}
      onBlurCapture={resumeManually}
    >
      <div ref={liveRegionRef} className="sr-only" aria-live="polite" />
      <div
        className="relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 shadow-2xl"
        role="group"
        aria-roledescription="carousel"
        aria-label="Главные промо-слайды"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.45),_transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-950/60" />
        </div>

        {currentSlide && (
          <div
            className="flex w-full flex-col items-center gap-6 text-center text-white md:flex-row md:text-left"
            role="tabpanel"
            id={`top-slider-panel-${currentSlide.id}`}
            aria-labelledby={`top-slider-tab-${currentSlide.id}`}
          >
            <SlideArtwork slide={currentSlide} isFirst={currentSlide.id === firstSlideId} />
            <SlideContent slide={currentSlide} />
          </div>
        )}

        <div className="mt-6 flex w-full items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Предыдущий слайд"
            onClick={() => switchTo(active - 1)}
            className="rounded-full border border-white/30 bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            ‹
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Навигация по слайдам">
            {orderedSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                id={`top-slider-tab-${slide.id}`}
                aria-controls={`top-slider-panel-${slide.id}`}
                aria-label={`Перейти к слайду ${index + 1}`}
                aria-selected={active === index}
                role="tab"
                className={clsx(
                  'h-2 w-8 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  active === index ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                )}
                onClick={() => switchTo(index)}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Следующий слайд"
            onClick={() => switchTo(active + 1)}
            className="rounded-full border border-white/30 bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}

type SlideProps = {
  slide: Slide;
  isFirst?: boolean;
};

const SlideArtwork = ({ slide, isFirst = false }: SlideProps) => {
  if (slide.type === 'promo') {
    return (
      <div className="relative w-full max-w-[320px] overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-lg">
        <img
          src={slide.image}
          alt={slide.title}
          className="h-full w-full object-cover"
          loading={isFirst ? 'eager' : 'lazy'}
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
    );
  }

  const { book } = slide;
  const cover = book.covers.mainBanner ?? book.covers['1600x900'] ?? book.covers['400x600'];
  return (
    <div className="relative w-full max-w-[360px] overflow-hidden rounded-3xl border border-indigo-400/30 bg-indigo-500/20 shadow-lg">
      <img
        src={cover}
        alt={book.title}
        className="h-full w-full object-cover"
        loading={isFirst ? 'eager' : 'lazy'}
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-left text-sm text-white/90">
        <p className="font-semibold uppercase tracking-wide text-indigo-200">Главный баннер</p>
        <p>{book.description?.slice(0, 80)}</p>
      </div>
    </div>
  );
};

const SlideContent = ({ slide }: SlideProps) => {
  if (slide.type === 'promo') {
    return (
      <div className="flex max-w-xl flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">KASBOOK</p>
        <h2 className="text-3xl font-semibold leading-tight md:text-4xl">{slide.title}</h2>
        <p className="text-base text-slate-200/80 md:text-lg">{slide.description}</p>
        {slide.href && (
          <a
            href={slide.href}
            className="inline-flex w-fit items-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-indigo-900 transition hover:bg-white"
          >
            Перейти
          </a>
        )}
      </div>
    );
  }

  const { book } = slide;
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Выбор недели</p>
      <h2 className="text-3xl font-semibold leading-tight md:text-4xl">{book.title}</h2>
      <p className="text-base text-indigo-100/90">{book.authorName}</p>
      <p className="text-base text-slate-200/80 md:text-lg line-clamp-4">{book.description}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {book.covers['400x600'] && (
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs text-indigo-100">Обложка 400×600</span>
        )}
        {book.covers['600x600'] && (
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs text-indigo-100">Обложка 600×600</span>
        )}
        {book.covers['1600x900'] && (
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs text-indigo-100">Баннер 1600×900</span>
        )}
      </div>
    </div>
  );
};
