const STORAGE_KEY = 'kasbook.recentShownIds';
const LIMIT = 200;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[feed:storage] Failed to parse recent ids', error);
    return null;
  }
};

export const loadRecent = () => {
  if (typeof window === 'undefined' || !window?.localStorage) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const payload = safeParse(raw);
  if (!payload || !Array.isArray(payload.ids)) return [];
  const timestamp = Number(payload.timestamp || 0);
  if (timestamp && Date.now() - timestamp > TTL_MS) {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
  return payload.ids.filter((id) => typeof id === 'string');
};

export const saveRecent = (ids) => {
  if (typeof window === 'undefined' || !window?.localStorage) return;
  const uniqueIds = Array.from(new Set(ids.filter((id) => typeof id === 'string')));
  const trimmed = uniqueIds.slice(-LIMIT);
  const payload = JSON.stringify({ ids: trimmed, timestamp: Date.now() });
  window.localStorage.setItem(STORAGE_KEY, payload);
};

export const rememberShown = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const recent = loadRecent();
  const merged = [...recent, ...ids];
  saveRecent(merged);
};
