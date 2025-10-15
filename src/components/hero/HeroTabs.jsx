import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fetchBestsellers } from '@/lib/api/books';
import { HERO_ROTATION_INTERVAL, HERO_TAB_ORDER, HERO_TOUCH_THRESHOLD } from '@/lib/banners';
import HeroSlide from './HeroSlide';
import { useCart } from '@/components/cart/CartContext';
import { useTranslation } from '@/components/i18n/SimpleI18n';

const chunkBooks = (books, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < books.length; i += chunkSize) {
    chunks.push(books.slice(i, i + chunkSize));
  }
  return chunks;
};

const buildChunks = (books) => {
  const filtered = books.filter((book) => book.cover_url);
  const chunkSize = 3;
  const chunks = chunkBooks(filtered, chunkSize);
  while (chunks.length < 3) {
    chunks.push([]);
  }
  return chunks.slice(0, 3);
};

const useHeroRotation = (length, isPaused, activeIndex, setIndex) => {
  const activeRef = useRef(activeIndex);

  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (length <= 1 || isPaused) return undefined;
    const timer = window.setInterval(() => {
      activeRef.current = (activeRef.current + 1) % length;
      setIndex(activeRef.current);
    }, HERO_ROTATION_INTERVAL);
    return () => window.clearInterval(timer);
  }, [length, isPaused, setIndex]);
};

const useSwipe = (onSwipe) => {
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const onTouchStart = useCallback((event) => {
    touchEndX.current = null;
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }, []);

  const onTouchMove = useCallback((event) => {
    touchEndX.current = event.changedTouches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) < HERO_TOUCH_THRESHOLD) return;
    onSwipe(distance > 0 ? 'left' : 'right');
  }, [onSwipe]);

  return { onTouchStart, onTouchMove, onTouchEnd };
};

export default function HeroTabs() {
  const { addToCart } = useCart();
  const { t } = useTranslation();
  const [books, setBooks] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);

  const tabs = HERO_TAB_ORDER;
  const bookChunks = useMemo(() => buildChunks(books), [books]);

  const handleTabChange = useCallback((index) => {
    setActiveIndex((current) => {
      if (index === current) return current;
      return index;
    });
  }, []);

  useHeroRotation(tabs.length, isPaused, activeIndex, handleTabChange);

  useEffect(() => {
    let mounted = true;
    fetchBestsellers(12)
      .then((result) => {
        if (!mounted) return;
        setBooks(result);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error('Failed to load hero data'));
      });
    return () => {
      mounted = false;
    };
  }, []);

  const onSwipe = useCallback(
    (direction) => {
      const delta = direction === 'left' ? 1 : -1;
      setActiveIndex((prev) => (prev + delta + tabs.length) % tabs.length);
    },
    [tabs.length]
  );

  const swipeHandlers = useSwipe(onSwipe);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  const getBooksForTab = useCallback(
    (tab) => {
      if (tab.type !== 'books') return [];
      const chunk = bookChunks[tab.chunkIndex] ?? [];
      return chunk;
    },
    [bookChunks]
  );

  const handleKeyDown = useCallback(
    (event) => {
      const { key } = event;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      if (key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + tabs.length) % tabs.length);
      } else if (key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % tabs.length);
      } else if (key === 'Home') {
        setActiveIndex(0);
      } else if (key === 'End') {
        setActiveIndex(tabs.length - 1);
      }
    },
    [tabs.length]
  );

  const handleAddToCart = useCallback(
    (book) => {
      if (!book) return;
      addToCart({
        id: book.id,
        title: book.title,
        price_kas: book.price_kas ?? 0,
        cover_url: book.cover_url ?? undefined,
        author: book.author ?? '',
      });
    },
    [addToCart]
  );

  return (
    <section
      className="relative isolate flex w-full flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4 shadow-sm md:p-6"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}
    >
      <div className="flex items-center justify-between gap-4">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label={t('home.hero.tablistAria')}
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              role="tab"
              id={`hero-tab-${tab.id}`}
              aria-selected={activeIndex === index}
              aria-controls={`hero-panel-${tab.id}`}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                activeIndex === index
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              )}
              onClick={() => handleTabChange(index)}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
      </div>

      <div className="relative min-h-[260px] w-full overflow-hidden" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tabs[activeIndex]?.id ?? 'hero-empty'}
            role="tabpanel"
            id={`hero-panel-${tabs[activeIndex]?.id ?? 'fallback'}`}
            aria-labelledby={`hero-tab-${tabs[activeIndex]?.id ?? 'fallback'}`}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <HeroSlide
              tab={tabs[activeIndex]}
              books={getBooksForTab(tabs[activeIndex])}
              onAddToCart={handleAddToCart}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
