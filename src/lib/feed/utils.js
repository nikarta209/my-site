const dateFrom = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const scoreByFreshness = (book, halfLifeDays = 14) => {
  const now = Date.now();
  const candidates = [book.published_at, book.release_date, book.released_at, book.created_at, book.updated_at];
  const validDates = candidates.map(dateFrom).filter(Boolean);
  if (validDates.length === 0) return 0;
  const latest = Math.max(...validDates.map((date) => date.getTime()));
  const ageMs = now - latest;
  if (ageMs <= 0) return 1;
  const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;
  if (halfLifeMs <= 0) return 0;
  const decay = Math.log(2) / halfLifeMs;
  return Math.exp(-decay * ageMs);
};

export const uniqueById = (items) => {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (!item || !item.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};
