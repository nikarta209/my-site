'use client';

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeroTab } from '@/lib/banners';
import type { Book } from '@/lib/api/books';
import { ensureCoverUrl } from '@/lib/api/books';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import { Skeleton } from '@/components/ui/skeleton';

export type HeroSlideProps = {
  tab: HeroTab;
  books: Book[];
  onAddToCart?: (book: Book) => void;
  onOpen?: (book: Book) => void;
};

const CTAIcon = ({ tab }: { tab: HeroTab }) => {
  if (tab.type !== 'cta') return null;
  const Icon = tab.icon;
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg">
      <Icon className="h-8 w-8" />
    </div>
  );
};

const HeroCtaSlide = ({ tab }: { tab: HeroTab }) => {
  const { t } = useTranslation();
  if (tab.type !== 'cta') return null;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tab.gradient} p-6 text-white shadow-xl md:p-10`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_60%)]" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <CTAIcon tab={tab} />
          <h2 className="text-2xl font-bold leading-tight md:text-4xl">
            {t(tab.headingKey)}
          </h2>
          <p className="max-w-xl text-sm text-white/85 md:text-base">
            {t(tab.descriptionKey)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild className="gap-2 text-base">
              <Link to={tab.primaryCta.href}>
                {t(tab.primaryCta.labelKey)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="bg-white/15 text-white hover:bg-white/20">
              <Link to={tab.secondaryCta.href}>
                {t(tab.secondaryCta.labelKey)}
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-white/70">
                {t('home.hero.cta.highlight.label')}
              </p>
              <p className="text-lg font-semibold text-white">
                {t('home.hero.cta.highlight.value')}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/80">
            {t('home.hero.cta.highlight.description')}
          </p>
        </div>
      </div>
    </div>
  );
};

const BookCard = ({ book, onAddToCart, onOpen }: { book: Book; onAddToCart?: (book: Book) => void; onOpen?: (book: Book) => void }) => {
  const { t } = useTranslation();
  const cover = ensureCoverUrl(book);
  const rating = book.rating ?? 0;

  return (
    <div className="group flex flex-col gap-3 rounded-2xl bg-card/80 p-4 shadow-sm ring-1 ring-border/60 transition hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/BookDetails?id=${book.id}`} onClick={() => onOpen?.(book)} className="relative overflow-hidden rounded-xl">
        <img
          src={cover ?? ''}
          alt={book.title}
          className="h-full w-full rounded-xl object-cover"
          loading="lazy"
        />
      </Link>
      <div className="space-y-2">
        <Link to={`/BookDetails?id=${book.id}`} onClick={() => onOpen?.(book)} className="block">
          <h3 className="text-base font-semibold leading-tight text-foreground line-clamp-2">
            {book.title}
          </h3>
        </Link>
        {book.author && <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {rating > 0 ? (
            <span className="font-medium text-foreground">{rating.toFixed(1)} ★</span>
          ) : (
            <span className="text-xs uppercase tracking-wide">{t('home.hero.books.new')}</span>
          )}
          {book.weekly_sales ? (
            <span>{t('home.hero.books.sales', { count: book.weekly_sales })}</span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" size="sm" onClick={() => onOpen?.(book)} asChild>
            <Link to={`/Reader?bookId=${book.id}`}>
              {t('home.hero.books.primaryCta')}
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onAddToCart?.(book)}
          >
            <ShoppingCart className="mr-1 h-4 w-4" />
            {t('home.hero.books.secondaryCta')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const HeroBooksSlide = ({ books, tab, onAddToCart, onOpen }: { books: Book[]; tab: HeroTab; onAddToCart?: (book: Book) => void; onOpen?: (book: Book) => void }) => {
  if (tab.type !== 'books') return null;
  if (!books || books.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onAddToCart={onAddToCart} onOpen={onOpen} />
      ))}
    </div>
  );
};

const HeroSlideComponent = ({ tab, books, onAddToCart, onOpen }: HeroSlideProps) => {
  if (tab.type === 'cta') {
    return <HeroCtaSlide tab={tab} />;
  }
  return <HeroBooksSlide books={books} tab={tab} onAddToCart={onAddToCart} onOpen={onOpen} />;
};

export const HeroSlide = memo(HeroSlideComponent);
export default HeroSlide;
