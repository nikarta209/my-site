const daysBetween = (date) => {
  if (!date) return Infinity;
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return Infinity;
  const diff = Date.now() - parsed.getTime();
  return diff / (1000 * 60 * 60 * 24);
};

const hasGenre = (book, genres = []) => {
  if (!book) return false;
  const list = Array.isArray(book.genres)
    ? book.genres
    : book.genre
      ? [book.genre]
      : [];
  return genres.some((genre) => list.map(String).map((g) => g.toLowerCase()).includes(String(genre).toLowerCase()));
};

export const homeFeedPresets = [
  {
    key: 'new-week',
    titleKey: 'home.sections.newWeek',
    viewAll: { href: 'Catalog?sort=newest' },
    size: 12,
    predicate: (book) => daysBetween(book.published_at || book.release_date || book.created_at) <= 7,
    ranking: {
      freshnessHalfLifeDays: 7,
      freshnessWeight: 2,
      ratingWeight: 1.2,
    },
  },
  {
    key: 'top-sales',
    titleKey: 'home.sections.bestSellers',
    viewAll: { href: 'Catalog?sort=bestseller' },
    size: 12,
    ranking: {
      ratingWeight: 2.5,
      totalSalesWeight: 1.5,
    },
  },
  {
    key: 'editors-picks',
    titleKey: 'home.sections.editorsChoice',
    viewAll: { href: 'Catalog?filter=editors' },
    size: 10,
    predicate: (book) => book.is_editors_pick || book.isEditorsPick,
    ranking: {
      editorChoiceBoost: 1.5,
      ratingWeight: 2.2,
    },
  },
  {
    key: 'free-previews',
    titleKey: 'home.sections.freePreviews',
    viewAll: { href: 'Catalog?filter=preview' },
    size: 10,
    predicate: (book) => book.preview_available || book.is_free,
    ranking: {
      ratingWeight: 1.8,
      freshnessWeight: 1,
    },
  },
  {
    key: 'ai-choice',
    titleKey: 'home.sections.aiChoice',
    viewAll: { href: 'AIRecommendations' },
    size: 12,
    predicate: (book) => book.aiRecommended || hasGenre(book, ['sci-fi', 'science fiction', 'neural']),
    ranking: {
      aiPickBoost: 1.2,
      ratingWeight: 2,
      freshnessWeight: 1.1,
    },
  },
  {
    key: 'classics',
    titleKey: 'home.sections.classics',
    viewAll: { href: 'Catalog?genre=classics' },
    size: 12,
    predicate: (book) => hasGenre(book, ['klassika', 'classics', 'classic-literature']),
    ranking: {
      ratingWeight: 2.4,
      freshnessWeight: 0.4,
    },
  },
  {
    key: 'adventure',
    titleKey: 'home.sections.adventure',
    viewAll: { href: 'Catalog?genre=fantasy' },
    size: 12,
    predicate: (book) => hasGenre(book, ['fantasy', 'sci-fi', 'science fiction', 'adventure']),
    ranking: {
      genreBonuses: {
        fantasy: 0.5,
        'sci-fi': 0.5,
        adventure: 0.4,
      },
      ratingWeight: 2,
      freshnessWeight: 1.2,
    },
  },
];
