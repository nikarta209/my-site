const STORAGE_KEY = 'kasbook.recentShown.v1';
const LIMIT = 200;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const sanitizeEntries = (entries, now) => {
  const cutoff = now - TTL_MS;
  const unique = new Map();
  entries.forEach((entry) => {
    if (!entry?.id) return;
    if (!Number.isFinite(entry.ts)) return;
    if (entry.ts < cutoff) return;
    const existing = unique.get(entry.id);
    if (!existing || existing.ts < entry.ts) {
      unique.set(entry.id, { id: entry.id, ts: entry.ts });
    }
  });
  return Array.from(unique.values())
    .sort((a, b) => a.ts - b.ts)
    .slice(-LIMIT);
};

export const loadRecentIds = (now = Date.now()) => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const payload = JSON.parse(raw);
    const entries = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.entries)
        ? payload.entries
        : [];
    return sanitizeEntries(entries, now).map((entry) => entry.id);
  } catch (error) {
    console.warn('[feed/storage] loadRecentIds failed', error);
    return [];
  }
};

export const saveRecentIds = (ids, now = Date.now()) => {
  if (!isBrowser()) return;
  try {
    const existing = loadRecentIds(now);
    const merged = sanitizeEntries(
      [...existing.map((id) => ({ id, ts: now - 1 })), ...ids.map((id) => ({ id, ts: now }))],
      now
    );
    const payload = { entries: merged };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[feed/storage] saveRecentIds failed', error);
  }
};

export const clearRecentIds = () => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[feed/storage] clearRecentIds failed', error);
  }
};
