import { ensureCoverUrl, getPrimaryGenre, inferGenres, inferLanguages, type Book } from '@/lib/api/books';

const DEFAULT_GENRE_BONUSES: Record<string, number> = {
  fantasy: 0.25,
  'sci-fi': 0.25,
  science: 0.1,
  adventure: 0.15,
};

const MS_IN_DAY = 86_400_000;

export type ScoreWeights = {
  ratingWeight?: number;
  salesWeight?: number;
  genreBonuses?: Record<string, number>;
  editorsPickBonus?: number;
  exclusiveBonus?: number;
  aiPickBonus?: number;
  languageBonuses?: Record<string, number>;
  freshnessHalfLifeDays?: number;
  freshnessMaxBoost?: number;
  stalePenaltyAfterDays?: number;
};

export type RankingSampleOptions = {
  size: number;
  avoidIds?: Set<string>;
  weights?: ScoreWeights;
  allowedGenres?: string[];
  preferredGenres?: string[];
  requiredTags?: string[];
  disallowedTags?: string[];
  allowSubscriptionOnly?: boolean;
  maxPerGenre?: number;
  minScore?: number;
  filter?: (book: Book) => boolean;
  now?: Date;
};

type WeightedBook = { book: Book; score: number; genre: string };

const parseDate = (value?: string | null): number | null => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const getFreshnessBoost = (book: Book, weights: ScoreWeights = {}, now: Date) => {
  const sources = [book.published_at, book.release_date, book.created_at, book.updated_at, book.last_sold_at];
  const firstValid = sources
    .map(parseDate)
    .find((timestamp): timestamp is number => timestamp !== null && Number.isFinite(timestamp));

  if (!firstValid) return 0;

  const delta = Math.max(0, now.getTime() - firstValid);
  const days = delta / MS_IN_DAY;
  const halfLife = Math.max(1, weights.freshnessHalfLifeDays ?? 12);
  const maxBoost = weights.freshnessMaxBoost ?? 1.25;
  const decay = Math.pow(0.5, days / halfLife);
  let boost = maxBoost * decay;

  const stalePenaltyAfter = weights.stalePenaltyAfterDays ?? 90;
  if (days > stalePenaltyAfter) {
    const penalty = Math.min(0.75, (days - stalePenaltyAfter) / stalePenaltyAfter);
    boost -= penalty;
  }

  return boost;
};

const getGenreBonus = (genre: string, weights: ScoreWeights = {}) => {
  const bonuses = { ...DEFAULT_GENRE_BONUSES, ...(weights.genreBonuses || {}) };
  return bonuses[genre] ?? 0;
};

const getLanguageBonus = (book: Book, weights: ScoreWeights = {}) => {
  if (!weights.languageBonuses) return 0;
  const languages = inferLanguages(book);
  if (languages.length === 0) return 0;
  return languages.reduce((total, lang) => total + (weights.languageBonuses?.[lang] ?? 0), 0);
};

export function scoreBook(book: Book, weights: ScoreWeights = {}, now: Date = new Date()): number {
  const rating = book.rating ?? 0;
  const weeklySales = book.weekly_sales ?? 0;
  const ratingWeight = weights.ratingWeight ?? 2;
  const salesWeight = weights.salesWeight ?? 1;

  let score = rating * ratingWeight + Math.log10(1 + weeklySales) * salesWeight;

  const genre = getPrimaryGenre(book).toLowerCase();
  score += getGenreBonus(genre, weights);
  score += getFreshnessBoost(book, weights, now);
  score += getLanguageBonus(book, weights);

  if (weights.editorsPickBonus && book.is_editors_pick) {
    score += weights.editorsPickBonus;
  }

  if (weights.exclusiveBonus && book.is_exclusive) {
    score += weights.exclusiveBonus;
  }

  if (weights.aiPickBonus && Array.isArray(book.tags)) {
    const hasAiTag = book.tags.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes('ai'));
    if (hasAiTag) {
      score += weights.aiPickBonus;
    }
  }

  return score;
}

const pickWeighted = (items: WeightedBook[]): WeightedBook | null => {
  if (!items.length) return null;
  const total = items.reduce((acc, item) => acc + Math.max(0, item.score), 0);
  if (total <= 0) {
    return items[0];
  }
  let threshold = Math.random() * total;
  for (const item of items) {
    threshold -= Math.max(0, item.score);
    if (threshold <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
};

const normalizeTag = (value: string) => value.trim().toLowerCase();

const matchesTagFilters = (book: Book, required?: string[], disallowed?: string[]) => {
  if (!required && !disallowed) return true;

  const tags = (book.tags || [])
    .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    .map(normalizeTag);

  if (required && required.length > 0) {
    const normalizedRequired = required.map(normalizeTag);
    const hasAllRequired = normalizedRequired.every((req) => tags.includes(req));
    if (!hasAllRequired) return false;
  }

  if (disallowed && disallowed.length > 0) {
    const normalizedDisallowed = disallowed.map(normalizeTag);
    const hasDisallowed = normalizedDisallowed.some((value) => tags.includes(value));
    if (hasDisallowed) return false;
  }

  return true;
};

const normalizeGenre = (value?: string | null) => (value ? value.toLowerCase() : 'other');

const shuffle = <T>(list: T[]): T[] => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function rankAndSampleBooks(books: Book[], options: RankingSampleOptions): Book[] {
  const {
    size,
    avoidIds = new Set<string>(),
    weights,
    allowedGenres,
    preferredGenres,
    requiredTags,
    disallowedTags,
    allowSubscriptionOnly = false,
    maxPerGenre,
    minScore,
    filter,
    now = new Date(),
  } = options;

  const safeSize = Math.max(0, size);
  if (safeSize === 0) return [];

  const normalizedAllowedGenres = allowedGenres?.map(normalizeGenre);
  const normalizedPreferred = preferredGenres?.map(normalizeGenre) ?? [];
  const preferredSet = new Set(normalizedPreferred);
  const perGenreLimit = Math.max(1, maxPerGenre ?? Math.ceil(Math.max(1, safeSize) / 3));

  const pool: WeightedBook[] = books
    .filter((book) => {
      if (!book || !book.id) return false;
      if (avoidIds.has(book.id)) return false;
      if (!ensureCoverUrl(book)) return false;
      if (filter && !filter(book)) return false;
      if (!allowSubscriptionOnly && book.is_in_subscription && !book.is_public_domain) {
        return false;
      }
      if (!matchesTagFilters(book, requiredTags, disallowedTags)) {
        return false;
      }
      const primaryGenre = normalizeGenre(getPrimaryGenre(book));
      if (normalizedAllowedGenres && !normalizedAllowedGenres.includes(primaryGenre)) {
        return false;
      }
      return true;
    })
    .map((book) => ({
      book,
      genre: normalizeGenre(getPrimaryGenre(book)),
      score: scoreBook(book, weights, now),
    }))
    .filter(({ score }) => (typeof minScore === 'number' ? score >= minScore : true));

  if (pool.length === 0) {
    return [];
  }

  const byGenre = new Map<string, WeightedBook[]>();
  pool.forEach((entry) => {
    if (!byGenre.has(entry.genre)) {
      byGenre.set(entry.genre, []);
    }
    byGenre.get(entry.genre)!.push(entry);
  });

  byGenre.forEach((list, genre) => {
    list.sort((a, b) => b.score - a.score);
    if (preferredSet.size > 0 && preferredSet.has(genre)) {
      // Slightly boost preferred genres by increasing top scores
      list.forEach((item, index) => {
        item.score += Math.max(0, (list.length - index) / list.length) * 0.2;
      });
    }
  });

  const genreOrder = shuffle(Array.from(byGenre.keys()));
  const picks: Book[] = [];
  const perGenreCounts = new Map<string, number>();
  let index = 0;
  let attempts = 0;
  const maxAttempts = pool.length * 6;

  while (picks.length < safeSize && attempts < maxAttempts && genreOrder.length > 0) {
    const genre = genreOrder[index % genreOrder.length];
    index += 1;
    attempts += 1;

    const list = byGenre.get(genre);
    if (!list || list.length === 0) {
      continue;
    }

    const currentCount = perGenreCounts.get(genre) ?? 0;
    if (currentCount >= perGenreLimit) {
      continue;
    }

    const candidate = pickWeighted(list);
    if (!candidate) {
      continue;
    }

    byGenre.set(
      genre,
      list.filter((entry) => entry.book.id !== candidate.book.id)
    );

    if (picks.some((existing) => existing.id === candidate.book.id)) {
      continue;
    }

    picks.push(candidate.book);
    perGenreCounts.set(genre, currentCount + 1);
  }

  if (picks.length < safeSize) {
    const remaining = pool
      .filter(({ book }) => !picks.some((existing) => existing.id === book.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, safeSize - picks.length)
      .map(({ book }) => book);
    picks.push(...remaining);
  }

  return picks.slice(0, safeSize);
}

export const uniqueBooks = (books: Book[]) => {
  const seen = new Set<string>();
  return books.filter((book) => {
    if (!book || !book.id) return false;
    if (seen.has(book.id)) return false;
    seen.add(book.id);
    return true;
  });
};

export const expandGenre = (book: Book): string[] => inferGenres(book);
