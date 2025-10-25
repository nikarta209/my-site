/* eslint-env node */

import { createServer } from 'node:http';
import { URL } from 'node:url';
import { env, resolveEnvValue, getSupabaseAdmin } from './lib/env.js';
import { getRateApiResponse } from './routes/rate.js';
import { startRatePoller } from './jobs/ratePoller.js';

const PORT = Number.parseInt(env.PORT || '4173', 10);
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

const N8N_WEBHOOK_URL = resolveEnvValue('N8N_WEBHOOK_URL');
const N8N_WEBHOOK_URL_TEST = resolveEnvValue('N8N_WEBHOOK_URL_TEST');
const isProduction = (env.NODE_ENV || 'development') === 'production';

const resolveN8nWebhookUrl = () => {
  if (isProduction) {
    return N8N_WEBHOOK_URL || N8N_WEBHOOK_URL_TEST || null;
  }
  return N8N_WEBHOOK_URL_TEST || N8N_WEBHOOK_URL || null;
};

const normalizeRole = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const sendJson = (res, statusCode, body) => {
  const payload = JSON.stringify(body);
  const contentLength = encoder.encode(payload).length;
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': contentLength,
    ...CORS_HEADERS
  });
  res.end(payload);
};

const collectRequestBuffer = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else if (chunk instanceof Buffer) {
      chunks.push(chunk);
    } else if (chunk instanceof Uint8Array) {
      chunks.push(Buffer.from(chunk));
    } else if (chunk) {
      chunks.push(Buffer.from(String(chunk)));
    }
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0);
};

const parseMultipartFormData = async (req) => {
  const contentType = req.headers?.['content-type'] || '';
  if (!/multipart\/form-data/i.test(contentType)) {
    throw new Error('Unsupported content type');
  }

  const boundaryMatch = contentType.match(/boundary=(?:"?)([^";]+)(?:"?)/i);
  if (!boundaryMatch) {
    throw new Error('Multipart boundary not found');
  }

  const boundary = boundaryMatch[1];
  const buffer = await collectRequestBuffer(req);
  const rawBody = buffer.toString('binary');
  const boundaryMarker = `--${boundary}`;
  const segments = rawBody.split(boundaryMarker);

  const fields = {};
  let file = null;

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed || trimmed === '--') continue;

    const [rawHeaders, ...rest] = trimmed.split('\r\n\r\n');
    if (!rawHeaders || rest.length === 0) continue;

    const bodySection = rest.join('\r\n\r\n');
    const bodyContent = bodySection.endsWith('\r\n')
      ? bodySection.slice(0, -2)
      : bodySection;

    const headerLines = rawHeaders.split('\r\n');
    const dispositionLine = headerLines.find((line) => /^content-disposition:/i.test(line)) || '';
    const nameMatch = dispositionLine.match(/name="?([^";]+)"?/i);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];

    const filenameMatch = dispositionLine.match(/filename="?([^";]*)"?/i);
    const contentTypeLine = headerLines.find((line) => /^content-type:/i.test(line));
    const mimeType = contentTypeLine ? contentTypeLine.split(':')[1].trim() : 'application/octet-stream';

    if (filenameMatch && filenameMatch[1]) {
      file = {
        fieldName,
        filename: filenameMatch[1],
        mimeType,
        buffer: Buffer.from(bodyContent, 'binary')
      };
    } else {
      fields[fieldName] = bodyContent;
    }
  }

  return { fields, file };
};

const readRequestBody = async (req) => {
  const chunks = [];
  let totalLength = 0;
  for await (const chunk of req) {
    const view = typeof chunk === 'string' ? encoder.encode(chunk) : new Uint8Array(chunk);
    chunks.push(view);
    totalLength += view.byteLength;
  }
  if (totalLength === 0) return null;

  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const view of chunks) {
    merged.set(view, offset);
    offset += view.byteLength;
  }

  const raw = decoder.decode(merged);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[server] Failed to parse JSON body', error);
    return null;
  }
};

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }

  if (authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.slice(7);
  }

  return null;
};

const getModeratorFromRequest = async (req) => {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return { error: 'Supabase service role key is not configured.', status: 500 };
  }

  const accessToken = extractBearerToken(req.headers?.authorization);
  if (!accessToken) {
    return { error: 'Missing Authorization header.', status: 401 };
  }

  try {
    const { data, error } = await adminClient.auth.getUser(accessToken);
    if (error || !data?.user) {
      return { error: 'Invalid or expired access token.', status: 401 };
    }

    const supabaseUser = data.user;
    const profileResponse = await adminClient
      .from('users')
      .select('email, role, is_admin, is_moderator, roles')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (profileResponse.error) {
      console.warn('[server] Failed to fetch moderator profile:', profileResponse.error);
    }

    const profile = profileResponse.data || {};
    const roles = new Set();

    const pushRole = (value) => {
      const normalized = normalizeRole(value);
      if (normalized) {
        roles.add(normalized);
      }
    };

    pushRole(profile.role);
    pushRole(supabaseUser.role);
    pushRole(supabaseUser.user_metadata?.role);

    if (profile.is_admin || supabaseUser.user_metadata?.is_admin) {
      roles.add('admin');
    }
    if (profile.is_moderator || supabaseUser.user_metadata?.is_moderator) {
      roles.add('moderator');
    }

    const metadataRoles = supabaseUser.user_metadata?.roles;
    if (Array.isArray(metadataRoles)) {
      metadataRoles.forEach(pushRole);
    }

    const profileRoles = profile.roles;
    if (Array.isArray(profileRoles)) {
      profileRoles.forEach(pushRole);
    }

    const isAdmin = roles.has('admin');
    const isModerator = roles.has('moderator');

    if (!isAdmin && !isModerator) {
      return { error: 'Недостаточно прав для модерации.', status: 403 };
    }

    const email = profile.email || supabaseUser.email;
    if (!email) {
      return { error: 'Профиль пользователя не содержит email.', status: 400 };
    }

    return {
      moderator: {
        id: supabaseUser.id,
        email,
        isAdmin,
        isModerator
      }
    };
  } catch (error) {
    console.error('[server] Failed to validate moderator request:', error);
    return { error: 'Не удалось проверить права пользователя.', status: 500 };
  }
};

const handleBookModeration = async (req, res, bookId) => {
  if (!bookId) {
    sendJson(res, 400, { success: false, error: 'Book ID is required.' });
    return;
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    sendJson(res, 500, { success: false, error: 'Supabase service role key is not configured.' });
    return;
  }

  const authResult = await getModeratorFromRequest(req);
  if (authResult.error) {
    sendJson(res, authResult.status, { success: false, error: authResult.error });
    return;
  }

  const body = (await readRequestBody(req)) || {};
  const action = normalizeRole(body.action);
  if (!action || !['approved', 'rejected'].includes(action)) {
    sendJson(res, 400, { success: false, error: 'Unsupported moderation action.' });
    return;
  }

  const rejectionReason = body.rejection_reason ?? body.rejectionReason ?? null;
  const rejectionInfo = body.rejection_info ?? body.rejectionInfo ?? null;

  const updatePayload = {
    status: action,
    moderator_email: authResult.moderator.email,
    updated_at: new Date().toISOString(),
  };

  if (action === 'rejected') {
    if (rejectionReason !== undefined) {
      updatePayload.rejection_reason = rejectionReason;
    }
    if (rejectionInfo !== undefined) {
      updatePayload.rejection_info = rejectionInfo;
    }
  } else {
    updatePayload.rejection_reason = null;
    updatePayload.rejection_info = null;
  }

  try {
    const { data, error } = await adminClient
      .from('books')
      .update(updatePayload)
      .eq('id', bookId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[server] Failed to update book status:', error);
      sendJson(res, 500, { success: false, error: error.message || 'Failed to update book status.' });
      return;
    }

    if (!data) {
      sendJson(res, 404, { success: false, error: 'Book not found.' });
      return;
    }

    sendJson(res, 200, { success: true, data });
  } catch (error) {
    console.error('[server] Unexpected error during moderation:', error);
    sendJson(res, 500, { success: false, error: 'Unexpected error while moderating the book.' });
  }
};

const handleRateResponse = async (res) => {
  const { status, body } = await getRateApiResponse();
  sendJson(res, status, body);
};

const handleN8nBookUpload = async (req, res) => {
  try {
    const { fields, file } = await parseMultipartFormData(req);

    if (!file || !file.buffer || file.buffer.length === 0) {
      sendJson(res, 400, { error: 'No file provided' });
      return;
    }

    const title = (fields.title || '').trim();
    if (!title) {
      sendJson(res, 400, { error: 'Missing "title"' });
      return;
    }

    const targetLang = (fields.target_lang || '').trim();
    if (!targetLang) {
      sendJson(res, 400, { error: 'Missing "target_lang"' });
      return;
    }

    const webhookUrl = resolveN8nWebhookUrl();
    if (!webhookUrl) {
      sendJson(res, 500, { error: 'N8N_WEBHOOK_URL is not set' });
      return;
    }

    const formData = new FormData();
    const filename = file.filename || 'book.bin';
    const mimeType = file.mimeType || 'application/octet-stream';
    formData.append('file', new Blob([file.buffer], { type: mimeType }), filename);
    formData.append('title', title);
    if (fields.source_lang) formData.append('source_lang', fields.source_lang);
    formData.append('target_lang', targetLang);
    if (fields.user_email) formData.append('user_email', fields.user_email);
    if (fields.user_id) formData.append('user_id', fields.user_id);
    if (fields.book_id) formData.append('book_id', fields.book_id);
    if (fields.metadata_json) formData.append('metadata_json', fields.metadata_json);

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });

    const responseText = await n8nResponse.text();
    const contentType = n8nResponse.headers.get('content-type') || 'text/plain; charset=utf-8';
    const contentLength = Buffer.byteLength(responseText);

    res.writeHead(n8nResponse.status, {
      'Content-Type': contentType,
      'Content-Length': contentLength,
      ...CORS_HEADERS,
    });
    res.end(responseText);
  } catch (error) {
    console.error('n8n proxy failed:', error);
    sendJson(res, 500, {
      error: 'n8n proxy failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

const server = createServer(async (req, res) => {
  const method = req.method || 'GET';

  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (method === 'GET' && requestUrl.pathname === '/api/coinmarketcap/kas-rate') {
    await handleRateResponse(res);
    return;
  }

  if (method === 'GET' && requestUrl.pathname === '/api/rate') {
    await handleRateResponse(res);
    return;
  }

  if (method === 'POST' && requestUrl.pathname === '/api/n8n/book-upload') {
    await handleN8nBookUpload(req, res);
    return;
  }

  if (method === 'POST' && requestUrl.pathname === '/api/coingecko') {
    await handleRateResponse(res);
    return;
  }

  if (method === 'PATCH' && requestUrl.pathname.startsWith('/api/moderation/books/')) {
    const bookId = requestUrl.pathname.replace('/api/moderation/books/', '').trim();
    await handleBookModeration(req, res, bookId);
    return;
  }

  sendJson(res, 404, { success: false, error: 'Not Found' });
});

if (isProduction) {
  try {
    startRatePoller();
  } catch (error) {
    console.error('[RatePoller] failed to start:', error instanceof Error ? error.message : error);
  }
}

if ((env.NODE_ENV || 'development') !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

export default server;
export { resolveEnvValue };
