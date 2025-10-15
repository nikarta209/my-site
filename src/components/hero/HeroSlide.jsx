import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import { useCart } from '@/components/cart/CartContext';
import {
  PenSquare,
  LibraryBig,
  Sparkles,
  Flame,
  Rocket,
  ArrowUpRight,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ICON_MAP = {
  PenSquare,
  LibraryBig,
  Sparkles,
  Flame,
  Rocket,
};

const heroVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const gradientOverlay = 'relative overflow-hidden rounded-3xl border border-border bg-background shadow-lg';

const badgeClass =
  'inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-1 text-sm font-medium tracking-wide text-white backdrop-blur';

const pickCoverUrl = (book) => {
  if (!book) return '';
  const images = book.cover_images || book.coverImages || {};
  return (
    book.cover_url ||
    images.portrait_large ||
    images.square ||
    images.default ||
    images.landscape ||
    ''
  );
};

const HeroBook = ({ book, onAddToCart, t }) => {
  if (!book) return null;

  const primaryLabel = book.preview_available
    ? t('home.hero.read')
    : t('home.hero.open');
  const secondaryLabel = t('home.hero.addToCart');
  const canAddToCart = !book.is_free && !book.is_owned && !book.is_subscription_only;

  const detailHref = createPageUrl(`BookDetails?id=${book.id}`);
  const readerHref = createPageUrl(`Reader?id=${book.id}`);

  return (
    <motion.article
      layout
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card/90 p-4 shadow transition hover:shadow-lg"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
        <img
          src={pickCoverUrl(book) || `https://picsum.photos/seed/${book.id}/400/600`}
          alt={book.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Link
          to={detailHref}
          className="line-clamp-2 text-base font-semibold leading-tight text-foreground hover:text-primary"
        >
          {book.title}
        </Link>
        {book.author && (
          <p className="text-sm text-muted-foreground">{book.author}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {book.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400" aria-hidden="true" />
              {Number(book.rating).toFixed(1)}
            </span>
          )}
          {book.weekly_sales > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />
              {Intl.NumberFormat('ru-RU').format(book.weekly_sales)}
            </span>
          )}
        </div>
        <div className="mt-1 flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link to={readerHref}>{primaryLabel}</Link>
          </Button>
          {canAddToCart && (
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => onAddToCart(book)}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{secondaryLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default function HeroSlide({ slide }) {
  const { t } = useTranslation();
  const { addToCart } = useCart();

  if (slide.type === 'cta') {
    const Icon = ICON_MAP[slide.icon] || Rocket;

    return (
      <motion.div
        key={slide.id}
        variants={heroVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`${gradientOverlay} bg-gradient-to-br ${slide.accent} text-white`}
      >
        <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-xl space-y-4">
            <span className={badgeClass}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              {t(slide.titleKey)}
            </span>
            <h2 className="text-3xl font-bold leading-tight md:text-4xl">
              {t(slide.headlineKey)}
            </h2>
            <p className="text-base text-white/90 md:text-lg">
              {t(slide.descriptionKey)}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="shadow-lg shadow-black/20">
                <Link to={slide.primaryCta.href}>{t(slide.primaryCta.labelKey)}</Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20">
                <Link to={slide.secondaryCta.href} className="inline-flex items-center gap-2">
                  <span>{t(slide.secondaryCta.labelKey)}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const books = Array.isArray(slide.books) ? slide.books.filter(Boolean) : [];

  return (
    <motion.div
      key={slide.id}
      variants={heroVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`${gradientOverlay} bg-card`}
    >
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            {t(slide.titleKey)}
          </span>
        </div>
        {books.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-2xl border border-dashed border-border/60 bg-muted/40"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {books.map((book) => (
              <HeroBook key={book.id} book={book} onAddToCart={addToCart} t={t} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
