'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import HeroSlide from './HeroSlide';
import { HERO_TABS, HERO_TAB_ORDER } from '@/lib/banners';
import { fetchBestsellers } from '@/lib/api/books';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import { useCart } from '@/components/cart/CartContext';

const HERO_ROTATION_INTERVAL = 7000;

const chunkArray = (items, chunkSize) => {
  if (!Array.isArray(items) || chunkSize <= 0) return [];
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

export default function HeroTabs() {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [bestsellers, setBestsellers] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const tabListRef = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetchBestsellers(12)
      .then((data) => {
        if (!mounted) return;
        setBestsellers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // NOTE: Errors are logged inside the books API helper.
        if (mounted) {
          setBestsellers([]);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const bookChunks = useMemo(() => chunkArray(bestsellers, 3), [bestsellers]);

  const slides = useMemo(() => {
    return HERO_TAB_ORDER.map((tabId) => {
      const tab = HERO_TABS[tabId];
      if (!tab) return null;
      if (tab.type === 'books') {
        return {
          ...tab,
          books: bookChunks[tab.chunkIndex] || [],
        };
      }
      return tab;
    }).filter(Boolean);
  }, [bookChunks]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, HERO_ROTATION_INTERVAL);
    return () => window.clearInterval(id);
  }, [isPaused, slides.length]);

  const switchToIndex = useCallback(
    (index) => {
      if (slides.length === 0) return;
      const normalized = ((index % slides.length) + slides.length) % slides.length;
      setActiveIndex(normalized);
    },
    [slides.length]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      switch (event.key) {
        case 'ArrowRight':
          switchToIndex(activeIndex + 1);
          break;
        case 'ArrowLeft':
          switchToIndex(activeIndex - 1);
          break;
        case 'Home':
          switchToIndex(0);
          break;
        case 'End':
          switchToIndex(slides.length - 1);
          break;
        default:
          break;
      }
    },
    [activeIndex, slides.length, switchToIndex]
  );

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX ?? null;
    touchStartX.current = null;

    if (start === null || end === null) return;
    const delta = end - start;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) {
      switchToIndex(activeIndex - 1);
    } else {
      switchToIndex(activeIndex + 1);
    }
  };

  const handleAddToCart = useCallback(
    (book) => {
      if (!book) return;
      addToCart(book);
    },
    [addToCart]
  );

  const activeSlide = slides[activeIndex] ?? slides[0];

  return (
    <section
      className="relative mx-auto w-full max-w-6xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={tabListRef}
        role="tablist"
        aria-label={t('home.hero.tablistLabel')}
        className="mb-4 flex flex-wrap gap-2"
        onKeyDown={handleKeyDown}
      >
        {slides.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeIndex === index}
            aria-controls={`hero-tabpanel-${tab.id}`}
            id={`hero-tab-${tab.id}`}
            onClick={() => switchToIndex(index)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              activeIndex === index
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t(tab.titleKey)}
          </button>
        ))}
      </div>

      <div role="presentation" className="relative">
        <AnimatePresence mode="wait">
          {activeSlide && (
            <div
              role="tabpanel"
              id={`hero-tabpanel-${activeSlide.id}`}
              aria-labelledby={`hero-tab-${activeSlide.id}`}
              className="focus:outline-none"
            >
              <HeroSlide slide={activeSlide} onAddToCart={handleAddToCart} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
