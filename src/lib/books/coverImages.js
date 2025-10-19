const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const getCoverImagesObject = (book) => {
  if (!book) return null;
  if (book.cover_images && typeof book.cover_images === 'object') {
    return book.cover_images;
  }
  if (book.coverImages && typeof book.coverImages === 'object') {
    return book.coverImages;
  }
  return null;
};

export const COVER_IMAGE_PRIORITIES = {
  portrait: ['default', 'portrait_large', 'square', 'landscape', 'main_banner', 'library_hero', 'notes_1', 'notes_2'],
  square: ['square', 'default', 'portrait_large', 'landscape', 'main_banner', 'library_hero', 'notes_1', 'notes_2'],
  landscape: ['landscape', 'main_banner', 'library_hero', 'portrait_large', 'default', 'square', 'notes_1', 'notes_2'],
  banner: ['main_banner', 'landscape', 'library_hero', 'portrait_large', 'default', 'square', 'notes_1', 'notes_2'],
  libraryHero: ['library_hero', 'landscape', 'main_banner', 'portrait_large', 'default', 'square', 'notes_1', 'notes_2'],
  notes: ['notes_1', 'notes_2', 'landscape', 'main_banner', 'library_hero', 'portrait_large', 'default', 'square'],
};

const DEFAULT_PRIORITY = COVER_IMAGE_PRIORITIES.portrait;

export const getCoverImageUrl = (book, priorityList = DEFAULT_PRIORITY) => {
  const images = getCoverImagesObject(book);
  if (!images) return null;

  for (const key of priorityList) {
    const value = images?.[key];
    if (isNonEmptyString(value)) {
      return value.trim();
    }
  }

  return null;
};

export const getBookCoverUrl = (book, { variant = 'portrait', fallback = null } = {}) => {
  const priorities = COVER_IMAGE_PRIORITIES[variant] || DEFAULT_PRIORITY;
  return getCoverImageUrl(book, priorities) ?? fallback ?? null;
};

export const getCoverOrPlaceholder = (book, fallback, variant = 'portrait') =>
  getBookCoverUrl(book, { variant, fallback }) ?? fallback ?? null;

export const hasCoverImage = (book) => {
  if (!book) return false;
  const images = getCoverImagesObject(book);
  if (!images) return false;
  return DEFAULT_PRIORITY.some((key) => isNonEmptyString(images?.[key]));
};

export const getCoverImages = (book) => getCoverImagesObject(book) ?? {};
