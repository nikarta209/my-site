const normalizeError = (error) => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error('Unknown error');
  }
};

export const logError = (scope, error) => {
  if (typeof console === 'undefined') {
    return;
  }

  const normalized = normalizeError(error);
  console.error(`[${scope}]`, normalized);
};
