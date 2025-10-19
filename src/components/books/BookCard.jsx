import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Flame, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/cart/CartContext';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import { getBookCoverUrl } from '@/lib/books/coverImages';

const gradients = [
  'from-fuchsia-500/10 to-sky-500/10',
  'from-amber-400/10 to-rose-500/10',
  'from-emerald-400/10 to-cyan-500/10',
  'from-indigo-500/10 to-purple-500/10',
];

const sizeClasses = {
  s: {
    wrapper: 'col-span-1',
    image: 'aspect-[3/4]',
    title: 'text-sm',
  },
  m: {
    wrapper: 'sm:col-span-2 lg:col-span-2',
    image: 'aspect-[4/5]',
    title: 'text-base',
  },
  l: {
    wrapper: 'sm:col-span-2 lg:col-span-3',
    image: 'aspect-video',
    title: 'text-lg',
  },
};

const pickGradient = (book) => {
  if (!book?.id) return gradients[0];
  const seed = String(book.id)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[seed % gradients.length];
};

const getCover = (book) => getBookCoverUrl(book, { variant: 'portrait', fallback: null }) || '';

export default function BookCard({ book, size = 's' }) {
  const { addToCart } = useCart();
  const { t } = useTranslation();
  const config = sizeClasses[size] || sizeClasses.s;
  const coverSrc = getCover(book) || `https://picsum.photos/seed/${book?.id || 'kasbook'}/400/600`;
  const detailHref = createPageUrl(`BookDetails?id=${book.id}`);
  const readerHref = createPageUrl(`Reader?id=${book.id}`);
  const showCartButton = !book.is_free && !book.is_owned && !book.is_subscription_only;

  return (
    <article
      className={`${config.wrapper} group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br ${pickGradient(book)} p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
    >
      <Link to={detailHref} className="relative block overflow-hidden rounded-2xl">
        <img
          src={coverSrc}
          alt={book.title}
          loading="lazy"
          className={`${config.image} w-full rounded-2xl object-cover transition duration-500 group-hover:scale-105`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 transition group-hover:opacity-100" />
        {book.is_exclusive && (
          <Badge className="absolute left-3 top-3 flex items-center gap-1 bg-orange-500 text-white shadow-lg">
            <Crown className="h-3.5 w-3.5" />
            {t('home.cards.exclusive')}
          </Badge>
        )}
        {book.weekly_sales > 0 && (
          <Badge variant="secondary" className="absolute right-3 top-3 flex items-center gap-1 bg-background/80 backdrop-blur">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            {Intl.NumberFormat('ru-RU').format(book.weekly_sales)}
          </Badge>
        )}
      </Link>

      <div className="relative mt-3 flex flex-1 flex-col gap-2">
        <Link to={detailHref} className={`${config.title} font-semibold leading-tight text-foreground group-hover:text-primary`}>
          {book.title}
        </Link>
        {book.author && <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          {book.rating > 0 && (
            <span className="flex items-center gap-1 font-medium">
              <Star className="h-4 w-4 text-yellow-400" />
              {Number(book.rating).toFixed(1)}
            </span>
          )}
          {Array.isArray(book.genres) && book.genres.length > 0 && (
            <span className="line-clamp-1 text-xs uppercase tracking-wide text-muted-foreground/80">
              {book.genres.slice(0, 2).join(' / ')}
            </span>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" className="flex-1">
            <Link to={readerHref}>{t('home.cards.read')}</Link>
          </Button>
          {showCartButton && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="flex items-center gap-1"
              onClick={() => addToCart(book)}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{t('home.cards.addToCart')}</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
