import { scoreByFreshness } from './utils';

const ensureNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const defaultGenreBonus = (genre) => {
  const popular = ['fantasy', 'sci-fi', 'science fiction', 'detective', 'thriller'];
  const normalized = (genre || '').toLowerCase();
  return popular.includes(normalized) ? 0.2 : 0;
};

const pickGenre = (book) => {
  if (!book) return 'other';
  if (Array.isArray(book.genres) && book.genres.length > 0) {
    return String(book.genres[0]).toLowerCase();
  }
  if (book.genre) return String(book.genre).toLowerCase();
  return 'other';
};

const hasCover = (book) => {
  if (!book) return false;
  if (book.cover_url) return true;
  const images = book.cover_images || book.coverImages;
  if (!images) return false;
  return Object.values(images).some(Boolean);
};

const weightedPick = (list) => {
  if (!Array.isArray(list) || list.length === 0) return null;
  const weights = list.map((entry) => Math.max(entry.score, 0.0001));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) {
    return list[0];
  }
  const threshold = Math.random() * total;
  let accum = 0;
  for (let index = 0; index < list.length; index += 1) {
    accum += weights[index];
    if (accum >= threshold) {
      return list[index];
    }
  }
  return list[list.length - 1];
};

export const scoreBook = (book, options = {}) => {
  if (!book) return 0;

  const ratingWeight = options.ratingWeight ?? 2;
  const rating = ensureNumber(book.rating, 0);
  const weeklySales = ensureNumber(book.weekly_sales ?? book.weeklySales, 0);
  const totalSales = ensureNumber(book.total_sales ?? book.totalSales, 0);
  const likes = ensureNumber(book.likes_count ?? book.likesCount, 0);

  let score = rating * ratingWeight + Math.log10(1 + weeklySales);

  if (options.totalSalesWeight) {
    score += Math.log10(1 + totalSales) * options.totalSalesWeight;
  }

  if (options.likesWeight) {
    score += Math.log10(1 + likes) * options.likesWeight;
  }

  const genre = pickGenre(book);
  const genreBonus = options.genreBonuses?.[genre] ?? defaultGenreBonus(genre);
  score += genreBonus;

  const freshnessHalfLife = options.freshnessHalfLifeDays ?? 14;
  const freshnessWeight = options.freshnessWeight ?? 1;
  if (freshnessWeight > 0) {
    score += scoreByFreshness(book, freshnessHalfLife) * freshnessWeight;
  }

  if (options.exclusiveBoost && (book.is_exclusive || book.isExclusive)) {
    score += options.exclusiveBoost;
  }

  if (options.editorChoiceBoost && (book.is_editors_pick || book.isEditorsPick)) {
    score += options.editorChoiceBoost;
  }

  if (options.aiPickBoost && book.aiRecommended) {
    score += options.aiPickBoost;
  }

  return score;
};

export const rankAndSampleBooks = (books, size, options = {}) => {
  const targetSize = Math.max(0, size || 0);
  if (targetSize === 0) return [];

  const avoidIds = new Set((options.avoidIds && Array.from(options.avoidIds)) || []);
  const allowFallback = options.allowFallback ?? true;
  const maxPerGenre = options.maxPerGenre ?? Infinity;

  const entries = (Array.isArray(books) ? books : [])
    .filter((book) => book && hasCover(book) && !avoidIds.has(String(book.id)))
    .map((book) => ({
      book,
      score: scoreBook(book, options),
      genre: pickGenre(book),
    }));

  const byGenre = new Map();
  for (const entry of entries) {
    if (!byGenre.has(entry.genre)) {
      byGenre.set(entry.genre, []);
    }
    byGenre.get(entry.genre).push(entry);
  }

  for (const [, list] of byGenre) {
    list.sort((a, b) => b.score - a.score);
  }

  const genreOrder = Array.from(byGenre.entries())
    .filter(([, list]) => list.length > 0)
    .sort(([, a], [, b]) => (b[0]?.score || 0) - (a[0]?.score || 0))
    .map(([genre]) => genre);

  const picks = [];
  const seenIds = new Set();
  const genreUsage = new Map();
  let round = 0;

  while (picks.length < targetSize && round < targetSize * 6 && genreOrder.length > 0) {
    const genre = genreOrder[round % genreOrder.length];
    const list = byGenre.get(genre);
    if (!list || list.length === 0) {
      round += 1;
      continue;
    }

    const selected = weightedPick(list);
    if (!selected) {
      round += 1;
      continue;
    }

    const index = list.indexOf(selected);
    if (index >= 0) {
      list.splice(index, 1);
    }

    if (seenIds.has(selected.book.id)) {
      round += 1;
      continue;
    }

    const used = genreUsage.get(genre) ?? 0;
    if (used >= maxPerGenre) {
      round += 1;
      continue;
    }

    picks.push(selected.book);
    seenIds.add(selected.book.id);
    genreUsage.set(genre, used + 1);
    round += 1;
  }

  if (picks.length < targetSize && allowFallback) {
    const sortedByScore = [...entries].sort((a, b) => b.score - a.score);
    for (const entry of sortedByScore) {
      if (picks.length >= targetSize) break;
      if (seenIds.has(entry.book.id)) continue;
      picks.push(entry.book);
      seenIds.add(entry.book.id);
    }
  }

  return picks.slice(0, targetSize);
};
