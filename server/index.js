/* eslint-env node */

import { createServer } from 'node:http';
import { URL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const nodeProcess = globalThis.process;
nodeProcess?.loadEnvFile?.();
const env = nodeProcess?.env ?? {};

const resolveEnvValue = (...keys) => {
  for (const key of keys) {
    if (!key) continue;

    if (env[key] !== undefined) {
      return env[key];
    }

    if (!key.startsWith('VITE_')) {
      const viteKey = `VITE_${key}`;
      if (env[viteKey] !== undefined) {
        return env[viteKey];
      }
    } else {
      const unprefixed = key.slice(5);
      if (unprefixed && env[unprefixed] !== undefined) {
        return env[unprefixed];
      }
    }
  }
  return undefined;
};

const COINMARKETCAP_API_KEY = resolveEnvValue(
  'COINMARKETCAP_API_KEY',
  'CMC_API_KEY',
  'VITE_COINMARKETCAP_API_KEY',
  'VITE_CMC_API_KEY'
);

const COINMARKETCAP_BASE_URL = 'https://pro-api.coinmarketcap.com';
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd';
const PORT = Number.parseInt(env.PORT || '4173', 10);
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

const SUPABASE_URL = resolveEnvValue('SUPABASE_URL', 'VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = resolveEnvValue('SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_SERVICE_ROLE_KEY');

const normalizeRole = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
};

let cachedSupabaseAdmin = null;
const getSupabaseAdmin = () => {
  if (!cachedSupabaseAdmin && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    cachedSupabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return cachedSupabaseAdmin;
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

const fetchKasRateFromCoinMarketCap = async () => {
  if (!COINMARKETCAP_API_KEY) {
    throw new Error('CoinMarketCap API key is not configured.');
  }

  const params = new URLSearchParams({ symbol: 'KAS', convert: 'USD' });
  const response = await fetch(
    `${COINMARKETCAP_BASE_URL}/v1/cryptocurrency/quotes/latest?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY
      }
    }
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.status?.error_message || `Failed to fetch CoinMarketCap data (status ${response.status})`;
    throw new Error(message);
  }

  const kas = data?.data?.KAS;
  const usdQuote = kas?.quote?.USD;
  const rate = Number.parseFloat(usdQuote?.price);

  if (!Number.isFinite(rate)) {
    throw new Error('CoinMarketCap response did not include a valid rate.');
  }

  return {
    success: true,
    rate,
    lastUpdated: usdQuote?.last_updated || null,
    symbol: kas?.symbol || 'KAS',
    name: kas?.name || 'Kaspa',
    source: 'coinmarketcap'
  };
};

const fetchKasRateFromCoinGecko = async () => {
  const response = await fetch(COINGECKO_URL);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || `CoinGecko request failed (status ${response.status})`;
    throw new Error(message);
  }

  const rate = Number.parseFloat(data?.kaspa?.usd);
  if (!Number.isFinite(rate)) {
    throw new Error('CoinGecko response did not include a valid rate.');
  }

  return {
    success: true,
    rate,
    lastUpdated: new Date().toISOString(),
    symbol: 'KAS',
    name: 'Kaspa',
    source: 'coingecko'
  };
};

const fallbackKasRate = () => ({
  success: true,
  rate: 0.025,
  lastUpdated: new Date().toISOString(),
  symbol: 'KAS',
  name: 'Kaspa',
  source: 'fallback'
});

const handleKasRate = async (res) => {
  try {
    const result = await fetchKasRateFromCoinMarketCap();
    sendJson(res, 200, result);
  } catch (error) {
    console.error('[CoinMarketCap] primary request failed:', error);
    try {
      const fallback = await fetchKasRateFromCoinGecko();
      sendJson(res, 200, fallback);
    } catch (fallbackError) {
      console.error('[CoinGecko] fallback failed:', fallbackError);
      sendJson(res, 200, fallbackKasRate());
    }
  }
};

const handleCoinGeckoProxy = async (req, res) => {
  const body = await readRequestBody(req);
  if (!body || body.action !== 'getCurrentKasRate') {
    sendJson(res, 400, { success: false, error: 'Unsupported action' });
    return;
  }

  try {
    const result = await fetchKasRateFromCoinMarketCap();
    sendJson(res, 200, result);
  } catch (error) {
    console.error('[CoinGecko proxy] CoinMarketCap request failed:', error);
    try {
      const fallback = await fetchKasRateFromCoinGecko();
      sendJson(res, 200, fallback);
    } catch (fallbackError) {
      console.error('[CoinGecko proxy] fallback failed:', fallbackError);
      sendJson(res, 200, fallbackKasRate());
    }
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
    await handleKasRate(res);
    return;
  }

  if (method === 'POST' && requestUrl.pathname === '/api/coingecko') {
    await handleCoinGeckoProxy(req, res);
    return;
  }

  if (method === 'PATCH' && requestUrl.pathname.startsWith('/api/moderation/books/')) {
    const bookId = requestUrl.pathname.replace('/api/moderation/books/', '').trim();
    await handleBookModeration(req, res, bookId);
    return;
  }

  sendJson(res, 404, { success: false, error: 'Not Found' });
});

if ((env.NODE_ENV || 'development') !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

export default server;
export { resolveEnvValue };
