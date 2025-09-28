import supabase, { supabaseStorageBucket } from './supabaseClient';
import { Book } from './entities';

const bucket = supabaseStorageBucket;

const ensureFileName = (file) => {
  const base = typeof file?.name === 'string' ? file.name : 'upload.bin';
  const timestamp = Date.now();
  return `${timestamp}_${base}`.replace(/\s+/g, '_');
};

export const UploadFile = async ({ file, path, options = {} }) => {
  if (!file) {
    throw new Error('UploadFile: file is required');
  }

  const filePath = path || ensureFileName(file);
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'application/octet-stream',
    ...options
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { file_url: data?.publicUrl || null, path: filePath };
};

export const UploadPrivateFile = async ({ file, path, expiresIn = 3600 }) => {
  const upload = await UploadFile({ file, path, options: { upsert: true } });
  if (!upload.path) return upload;
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(upload.path, expiresIn);
  if (error) throw error;
  return { ...upload, signed_url: data?.signedUrl || null };
};

export const CreateFileSignedUrl = async ({ path, expiresIn = 3600 }) => {
  if (!path) throw new Error('CreateFileSignedUrl: path is required');
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return { signedUrl: data?.signedUrl || null };
};

export const InvokeLLM = async ({ prompt = '', bookId, context } = {}) => {
  const trimmedPrompt = prompt.trim();
  let book = null;
  if (bookId) {
    try {
      book = await Book.get(bookId);
    } catch (error) {
      console.warn('[InvokeLLM] Failed to load book', bookId, error);
    }
  }

  const summary = book?.description || book?.preview_text;
  const responseText = summary
    ? `Вот краткое описание книги "${book.title}": ${summary}`
    : `AI-ответ: ${trimmedPrompt || 'запрос без текста'}.`;

  return {
    success: true,
    result: responseText,
    metadata: {
      source: 'supabase-local-llm',
      bookId: book?.id || null,
      context
    }
  };
};

export const SendEmail = async ({ to, subject, body }) => {
  console.info('[SendEmail] Simulated email', { to, subject, body });
  return { success: true };
};

export const GenerateImage = async ({ prompt }) => ({
  success: true,
  url: `https://placehold.co/600x800?text=${encodeURIComponent(prompt || 'KASBOOK')}`
});

export const ExtractDataFromUploadedFile = async ({ file }) => ({
  success: true,
  fileName: file?.name || 'unknown',
  size: file?.size || 0
});

export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
  CreateFileSignedUrl,
  UploadPrivateFile
};
