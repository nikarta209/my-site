import { AlertTriangle, RefreshCw } from 'lucide-react';
import HeroTabs from '@/components/hero/HeroTabs';
import Section from '@/components/sections/Section';
import BooksMasonry from '@/components/books/BooksMasonry';
import { useHomeFeed } from './useHomeFeed';
import { useCart } from '@/components/cart/CartContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AIRecommendationSection from '@/components/home/AIRecommendationSection';
import PersonalizedAIRecommendations from '@/components/home/PersonalizedAIRecommendations';
import { useAuth } from '@/components/auth/Auth';
import { useTranslation } from '@/components/i18n/SimpleI18n';

const LoadingMasonry = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="flex flex-col gap-3">
        <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

export default function HomePage() {
  const { sections, isLoading, error, refresh } = useHomeFeed();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex flex-col gap-10 px-4 py-6 md:py-10">
        <HeroTabs />

        {error && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-semibold">{t('home.errors.feedTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('home.errors.feedDescription')}</p>
            </div>
            <Button onClick={refresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t('home.errors.retry')}
            </Button>
          </div>
        )}

        {sections.map((section) => (
          <Section key={section.id} titleKey={section.titleKey} viewAllHref={section.viewAllHref}>
            {isLoading && section.books.length === 0 ? (
              <LoadingMasonry />
            ) : section.books.length === 0 ? (
              <div className="rounded-3xl border border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                {t('home.sections.empty')}
              </div>
            ) : (
              <BooksMasonry books={section.books} onAddToCart={addToCart} />
            )}
          </Section>
        ))}

        {isAuthenticated && user && (
          <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
            <PersonalizedAIRecommendations user={user} />
          </div>
        )}

        <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <AIRecommendationSection />
        </div>
      </div>
    </div>
  );
}
