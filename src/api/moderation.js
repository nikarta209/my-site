import supabase, { isSupabaseConfigured } from './supabaseClient';

const importMetaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;

const getEnvValue = (...keys) => {
  for (const key of keys) {
    if (!key) continue;

    if (importMetaEnv && importMetaEnv[key] !== undefined) {
      return importMetaEnv[key];
    }

    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return process.env[key];
    }
  }

  return undefined;
};

const API_BASE_URL = getEnvValue(
  'VITE_APP_SERVER_URL',
  'APP_SERVER_URL',
  'VITE_BACKEND_URL',
  'BACKEND_URL'
);

const buildApiUrl = (path) => {
  if (!path) return '';
  if (API_BASE_URL) {
    const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
};

const ensureAccessToken = async () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase не настроен. Проверьте переменные окружения.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message || 'Не удалось получить текущую сессию.');
  }

  const token = data?.session?.access_token;
  if (!token) {
    throw new Error('Сессия не найдена. Пожалуйста, выполните вход заново.');
  }

  return token;
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const moderateBook = async (bookId, { action, rejectionInfo = null, rejectionReason = null } = {}) => {
  if (!bookId) {
    throw new Error('Не указан идентификатор книги.');
  }

  if (!action || !['approved', 'rejected'].includes(action)) {
    throw new Error('Недопустимое действие модерации.');
  }

  const token = await ensureAccessToken();

  const response = await fetch(buildApiUrl(`/api/moderation/books/${bookId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      action,
      rejection_info: rejectionInfo,
      rejection_reason: rejectionReason
    })
  });

  if (!response.ok) {
    const errorPayload = await parseJsonSafe(response);
    const message = errorPayload?.error || `Не удалось обновить статус книги (код ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.details = errorPayload;
    throw error;
  }

  const payload = await parseJsonSafe(response);
  return payload?.data || null;
};

export default moderateBook;
