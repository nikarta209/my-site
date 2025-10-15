import { createPageUrl } from '@/utils';

const parseDate = (value) => {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
};

const isWithinDays = (book, days, now) => {
  const published = parseDate(book?.published_at) ?? parseDate(book?.release_date) ?? parseDate(book?.created_at);
  if (!published) return false;
  const diffDays = (now.getTime() - published) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
};

const isEditorsPick = (book) => Boolean(book?.is_editors_pick);
const hasPreview = (book) => Boolean(book?.is_preview_available || book?.is_public_domain);
const hasAiTag = (book) => Array.isArray(book?.tags) && book.tags.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes('ai'));

const WEEKLY_SALES_POPULAR = 12;

export const HOME_FEED_PRESETS = [
  {
    id: 'new-week',
    titleKey: 'home.sections.newThisWeek',
    viewAllHref: `${createPageUrl('Catalog')}?sort=newest`,
    size: 8,
    weights: {
      freshnessHalfLifeDays: 4,
      freshnessMaxBoost: 1.9,
      salesWeight: 0.75,
    },
    filter: (book, now) => isWithinDays(book, 14, now),
  },
  {
    id: 'best-sellers',
    titleKey: 'home.sections.bestSellers',
    viewAllHref: `${createPageUrl('Catalog')}?sort=popular`,
    size: 8,
    weights: {
      ratingWeight: 2.2,
      salesWeight: 1.3,
      freshnessHalfLifeDays: 10,
      freshnessMaxBoost: 1.2,
    },
    filter: (book) => (book?.weekly_sales ?? 0) >= WEEKLY_SALES_POPULAR,
  },
  {
    id: 'editor-picks',
    titleKey: 'home.sections.editorsChoice',
    viewAllHref: `${createPageUrl('Catalog')}?filter=editors-picks`,
    size: 6,
    weights: {
      ratingWeight: 2.4,
      editorsPickBonus: 1.2,
      freshnessHalfLifeDays: 14,
      freshnessMaxBoost: 1.1,
    },
    filter: (book) => isEditorsPick(book),
    allowSubscriptionOnly: true,
  },
  {
    id: 'free-previews',
    titleKey: 'home.sections.freePreviews',
    viewAllHref: `${createPageUrl('Catalog')}?tag=preview`,
    size: 6,
    weights: {
      ratingWeight: 1.8,
      freshnessHalfLifeDays: 20,
    },
    filter: (book) => hasPreview(book),
    allowSubscriptionOnly: true,
  },
  {
    id: 'ai-picks',
    titleKey: 'home.sections.aiPicks',
    viewAllHref: `${createPageUrl('AIRecommendations')}`,
    size: 6,
    weights: {
      ratingWeight: 1.9,
      salesWeight: 1,
      aiPickBonus: 1.4,
      freshnessHalfLifeDays: 10,
    },
    filter: (book) => hasAiTag(book),
    allowSubscriptionOnly: true,
  },
  {
    id: 'classics',
    titleKey: 'home.sections.classics',
    viewAllHref: `${createPageUrl('Catalog')}?genre=klassicheskaya-literatura`,
    size: 6,
    weights: {
      ratingWeight: 2.5,
      freshnessHalfLifeDays: 45,
      freshnessMaxBoost: 0.8,
      salesWeight: 0.8,
    },
    allowedGenres: ['klassicheskaya-literatura', 'classic', 'literature'],
    allowSubscriptionOnly: true,
  },
  {
    id: 'fantasy-adventure',
    titleKey: 'home.sections.fantasyAdventure',
    viewAllHref: `${createPageUrl('Catalog')}?genre=fantasy`,
    size: 8,
    weights: {
      ratingWeight: 2,
      salesWeight: 1.1,
      freshnessHalfLifeDays: 18,
      genreBonuses: {
        fantasy: 0.4,
        adventure: 0.3,
        'sci-fi': 0.3,
      },
    },
    allowedGenres: ['fantasy', 'sci-fi', 'science-fiction', 'priklyucheniya', 'adventure'],
    preferredGenres: ['fantasy', 'sci-fi', 'adventure'],
  },
];
