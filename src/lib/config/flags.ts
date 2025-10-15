export const isSubscriptionEnabled = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_FEATURE_SUBSCRIPTION) === 'true' ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FEATURE_SUBSCRIPTION === 'true');
