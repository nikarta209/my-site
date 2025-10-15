import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Star, ShoppingCart, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ensureCoverUrl } from '@/lib/api/books';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/i18n/SimpleI18n';

const SIZE_STYLES = {
  s: {
    image: 'aspect-[2/3]',
    layout: 'gap-3 p-3',
    title: 'text-sm',
  },
  m: {
    image: 'aspect-[3/4]',
    layout: 'gap-4 p-4',
    title: 'text-base',
  },
  l: {
    image: 'md:aspect-[5/6] aspect-[3/4]',
    layout: 'gap-5 p-5',
    title: 'text-lg',
  },
};

const formatSales = (count) => {
  if (!count) return null;
  if (count > 999) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
};

const BookCardComponent = ({ book, size = 'm', className, onAddToCart, onOpen }) => {
  const { t } = useTranslation();
  const cover = ensureCoverUrl(book);
  const rating = book?.rating ?? 0;
  const hasBadge = book?.is_exclusive || (book?.weekly_sales ?? 0) > 20 || book?.is_editors_pick;
  const styles = SIZE_STYLES[size] ?? SIZE_STYLES.m;

  const badges = useMemo(() => {
    const list = [];
    if (book?.is_exclusive) {
      list.push({ label: t('home.cards.exclusive'), tone: 'bg-amber-500/90 text-white', icon: Sparkles });
    }
    if ((book?.weekly_sales ?? 0) > 20) {
      list.push({ label: t('home.cards.bestseller'), tone: 'bg-emerald-500/90 text-white', icon: BadgeCheck });
    }
    if (book?.is_editors_pick) {
      list.push({ label: t('home.cards.editorsPick'), tone: 'bg-indigo-500/90 text-white', icon: Sparkles });
    }
    return list;
  }, [book?.is_editors_pick, book?.is_exclusive, book?.weekly_sales, t]);

  const salesLabel = formatSales(book?.weekly_sales);

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/90 shadow-sm transition hover:-translate-y-1 hover:border-border hover:shadow-lg',
        className,
        styles.layout
      )}
    >
      <div className={cn('relative overflow-hidden rounded-2xl ring-1 ring-border/40', styles.image)}>
        <Link
          to={`/BookDetails?id=${book.id}`}
          onClick={() => onOpen?.(book)}
          className="block h-full w-full"
        >
          <img
            src={cover ?? ''}
            alt={book.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        {hasBadge && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {badges.map(({ label, tone, icon: Icon }) => (
              <span
                key={label}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide shadow backdrop-blur',
                  tone
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <Link to={`/BookDetails?id=${book.id}`} onClick={() => onOpen?.(book)} className="block">
          <h3 className={cn('font-semibold leading-tight text-foreground line-clamp-2', styles.title)}>{book.title}</h3>
        </Link>
        {book.author && (
          <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {rating > 0 ? (
            <div className="flex items-center gap-1 font-medium text-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </div>
          ) : (
            <span>{t('home.cards.new')}</span>
          )}
          {salesLabel && <span>{t('home.cards.sales', { count: salesLabel })}</span>}
        </div>
        <div className="mt-auto flex gap-2">
          <Button size={size === 's' ? 'sm' : 'default'} className="flex-1" asChild>
            <Link to={`/Reader?bookId=${book.id}`} onClick={() => onOpen?.(book)}>
              {t('home.cards.open')}
            </Link>
          </Button>
          <Button
            size={size === 's' ? 'icon' : 'default'}
            variant="outline"
            className="flex-1 gap-1"
            onClick={() => onAddToCart?.(book)}
          >
            <ShoppingCart className="h-4 w-4" />
            {size !== 's' && t('home.cards.addToCart')}
          </Button>
        </div>
      </div>
    </article>
  );
};

export const BookCard = memo(BookCardComponent);
export default BookCard;
