const normalizeMetadata = (metadata) => {
  if (!metadata) return null;

  if (typeof metadata === 'string') {
    return metadata.trim() ? metadata : null;
  }

  try {
    return JSON.stringify(metadata);
  } catch (error) {
    console.warn('[n8n] Failed to stringify metadata payload', error);
    return null;
  }
};

export const submitBookToTranslation = async ({
  file,
  title,
  sourceLang,
  targetLang,
  userEmail,
  userId,
  bookId,
  metadata,
} = {}) => {
  if (!file) {
    throw new Error('Не выбран файл для отправки.');
  }

  if (!title) {
    throw new Error('Укажите название книги.');
  }

  const normalizedTargetLang = typeof targetLang === 'string' ? targetLang.trim() : '';
  if (!normalizedTargetLang) {
    throw new Error('Не выбран язык перевода.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  if (sourceLang) {
    formData.append('source_lang', sourceLang);
  }

  formData.append('target_lang', normalizedTargetLang);

  if (userEmail) {
    formData.append('user_email', userEmail);
  }

  if (userId) {
    formData.append('user_id', userId);
  }

  if (bookId) {
    formData.append('book_id', bookId);
  }

  const metadataPayload = normalizeMetadata(metadata);
  if (metadataPayload) {
    formData.append('metadata_json', metadataPayload);
  }

  let response;
  try {
    response = await fetch('/api/n8n/book-upload', {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    throw new Error(`Не удалось отправить книгу: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
  }

  const responseText = await response.text();

  if (!response.ok) {
    const message = responseText || `n8n error: ${response.status}`;
    throw new Error(message);
  }

  return responseText;
};

export default submitBookToTranslation;
