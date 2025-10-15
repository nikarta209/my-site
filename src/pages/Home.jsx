import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import HeroTabs from '@/components/hero/HeroTabs';
import Section from '@/components/sections/Section';
import { useHomeFeed } from '@/app/(home)/useHomeFeed';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import { isSubscriptionFeatureEnabled } from '@/utils/featureFlags';
import SubscriptionBanner from '@/components/home/SubscriptionBanner';

const subscriptionEnabled = isSubscriptionFeatureEnabled();

export default function Home() {
  const { sections, isLoading, error, reload } = useHomeFeed();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex flex-col gap-10 px-4 py-6">
        <HeroTabs />

        {error && (
          <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-2 text-base font-semibold text-foreground">
              {t('home.errors.failedToLoad')}
            </p>
            <p className="text-sm text-muted-foreground">{t('home.errors.tryAgain')}</p>
            <Button onClick={reload} className="mt-4" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('home.actions.reload')}
            </Button>
          </div>
        )}

        {subscriptionEnabled && <SubscriptionBanner />}

        <div className="space-y-8">
          {sections.map((section) => (
            <Section
              key={section.key}
              title={t(section.titleKey)}
              description={section.descriptionKey ? t(section.descriptionKey) : undefined}
              viewAllHref={section.viewAll?.href}
              books={section.books}
              isLoading={isLoading && (!section.books || section.books.length === 0)}
            />
          ))}
          {isLoading && sections.length === 0 && (
            Array.from({ length: 3 }).map((_, index) => (
              <Section
                key={`placeholder-${index}`}
                title={t('home.sections.loading')}
                books={[]}
                isLoading
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
