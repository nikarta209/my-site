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
const SUPABASE_SERVICE_ROLE_KEY = resolveEnvValue('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY');

let adminSupabase = null;

const getAdminSupabase = () => {
  if (adminSupabase) return adminSupabase;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[moderation] Supabase admin client is not configured.');
    return null;
  }

  adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return adminSupabase;
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

const normalizeStatus = (status) => {
  if (typeof status !== 'string') return null;
  const value = status.toLowerCase();
  if (['approved', 'rejected', 'pending'].includes(value)) {
    return value;
  }
  return null;
};

const handleModerationUpdate = async (req, res, bookId) => {
  const adminClient = getAdminSupabase();
  if (!adminClient) {
    sendJson(res, 500, { success: false, error: 'Supabase admin client is not configured' });
    return;
  }

  const body = await readRequestBody(req);
  if (!body) {
    sendJson(res, 400, { success: false, error: 'Request body is required' });
    return;
  }

  const status = normalizeStatus(body.status);
  if (!status) {
    sendJson(res, 400, { success: false, error: 'Invalid status value' });
    return;
  }

  if (!body.moderatorEmail || typeof body.moderatorEmail !== 'string') {
    sendJson(res, 400, { success: false, error: 'Moderator email is required' });
    return;
  }

  const updatePayload = {
    status,
    moderator_email: body.moderatorEmail
  };

  if (status === 'approved') {
    updatePayload.rejection_info = null;
  } else if (status === 'rejected') {
    updatePayload.rejection_info = body.rejectionInfo || null;
  }

  try {
    const { data, error } = await adminClient
      .from('books')
      .update(updatePayload)
      .eq('id', bookId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[moderation] Failed to update book', bookId, error);
      const statusCode = Number(error.code) || 400;
      sendJson(res, statusCode, { success: false, error: error.message || 'Failed to update book' });
      return;
    }

    if (!data) {
      sendJson(res, 404, { success: false, error: 'Book not found' });
      return;
    }

    sendJson(res, 200, { success: true, data });
  } catch (error) {
    console.error('[moderation] Unexpected error', error);
    sendJson(res, 500, { success: false, error: 'Unexpected server error' });
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

  const moderationMatch = requestUrl.pathname.match(/^\/api\/moderation\/books\/(.+?)\/status$/);
  if (method === 'POST' && moderationMatch) {
    const [, bookId] = moderationMatch;
    await handleModerationUpdate(req, res, bookId);
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
