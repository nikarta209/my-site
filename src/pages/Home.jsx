import React from 'react';
import HeroTabs from '@/components/hero/HeroTabs';
import Section from '@/components/sections/Section';
import BooksMasonry from '@/components/books/BooksMasonry';
import SubscriptionBanner from '@/components/home/SubscriptionBanner';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/i18n/SimpleI18n';

function SectionContent({ books, isLoading, emptyLabel }) {
  if (isLoading && (!books || books.length === 0)) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-44 rounded-3xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        <span>{emptyLabel}</span>
      </div>
    );
  }

  return <BooksMasonry books={books} />;
}

export default function Home() {
  const { sections, isLoading, error, refresh } = useHomeFeed();
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      <HeroTabs />

      {error && (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{t('home.errors.feedTitle')}</p>
              <p className="text-sm text-destructive/80">{t('home.errors.feedDescription')}</p>
            </div>
            <Button variant="outline" onClick={refresh}>
              {t('home.errors.retry')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-12">
        {sections.map((section) => (
          <Section key={section.id} titleKey={section.titleKey} viewAllHref={section.viewAllHref}>
            <SectionContent
              books={section.books}
              isLoading={isLoading}
              emptyLabel={t('home.sections.empty')}
            />
          </Section>
        ))}
      </div>

      <SubscriptionBanner />
    </div>
  );
}
