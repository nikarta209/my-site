export const ensureString = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.data === 'string') {
    return value.data;
  }
  if (value == null) return '';
  try {
    return String(value);
  } catch (error) {
    console.warn('[ensureString] Failed to cast value to string', error, value);
    return '';
  }
};

export const safeMatch = (value, pattern) => {
  if (typeof value !== 'string' || !(pattern instanceof RegExp)) return [];
  const result = value.match(pattern);
  return Array.isArray(result) ? result : [];
};

export const safeSplit = (value, pattern) => {
  if (typeof value !== 'string') return [];
  try {
    return value.split(pattern);
  } catch (error) {
    console.warn('[safeSplit] Failed to split string', error);
    return [];
  }
};

export const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};
