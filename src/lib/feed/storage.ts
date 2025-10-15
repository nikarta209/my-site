const STORAGE_KEY = 'kasbook.recentShown.v1';
const LIMIT = 200;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

type StoredEntry = { id: string; ts: number };

type StoredPayload = {
  entries: StoredEntry[];
};

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const sanitizeEntries = (entries: StoredEntry[], now: number): StoredEntry[] => {
  const cutoff = now - TTL_MS;
  const unique = new Map<string, StoredEntry>();
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

export const loadRecentIds = (now: number = Date.now()): string[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const payload = JSON.parse(raw) as StoredPayload | StoredEntry[];
    const entries = Array.isArray(payload)
      ? (payload as StoredEntry[])
      : Array.isArray((payload as StoredPayload).entries)
        ? (payload as StoredPayload).entries
        : [];
    return sanitizeEntries(entries, now).map((entry) => entry.id);
  } catch (error) {
    console.warn('[feed/storage] loadRecentIds failed', error);
    return [];
  }
};

export const saveRecentIds = (ids: string[], now: number = Date.now()) => {
  if (!isBrowser()) return;
  try {
    const existing = loadRecentIds(now);
    const merged = sanitizeEntries(
      [...existing.map((id) => ({ id, ts: now - 1 })), ...ids.map((id) => ({ id, ts: now }))],
      now
    );
    const payload: StoredPayload = { entries: merged };
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
