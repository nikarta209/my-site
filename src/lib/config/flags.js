export const isSubscriptionEnabled = () =>
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_FEATURE_SUBSCRIPTION === 'true';
