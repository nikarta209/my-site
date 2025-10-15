import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BooksMasonry from '@/components/books/BooksMasonry';
import { createPageUrl } from '@/utils';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import { cn } from '@/lib/utils';

export default function Section({
  title,
  description,
  viewAllHref,
  books = [],
  isLoading = false,
  children,
  className,
  onAddToCart,
  onOpen,
}) {
  const { t } = useTranslation();
  const viewAllUrl = viewAllHref ? createPageUrl(viewAllHref) : null;

  return (
    <section className={cn('space-y-4 rounded-3xl bg-card/40 p-4 shadow-sm ring-1 ring-border/40', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {viewAllUrl && (
          <Link
            to={viewAllUrl}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/80"
          >
            <span>{t('home.sections.viewAll')}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children ?? (
        <BooksMasonry
          books={books}
          isLoading={isLoading}
          onAddToCart={onAddToCart}
          onOpen={onOpen}
        />
      )}
    </section>
  );
}
