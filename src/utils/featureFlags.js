const getEnvValue = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }
  return undefined;
};

const coerceBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
};

const resolveFlag = (keys, fallback) => {
  for (const key of keys) {
    const result = coerceBoolean(getEnvValue(key));
    if (result !== undefined) {
      return result;
    }
  }
  return typeof fallback === 'boolean' ? fallback : false;
};

export const isSubscriptionFeatureEnabled = () =>
  resolveFlag(['NEXT_PUBLIC_FEATURE_SUBSCRIPTION', 'VITE_FEATURE_SUBSCRIPTION'], false);

export const getFeatureFlagValue = (key, fallback = false) =>
  resolveFlag([key, `NEXT_PUBLIC_${key}`, `VITE_${key}`], fallback);
