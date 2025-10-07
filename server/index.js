/* eslint-env node */

import { createServer } from 'node:http';
import { URL } from 'node:url';

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
const DEFAULT_KAS_LOGO =
  resolveEnvValue('KAS_LOGO_URL', 'VITE_KAS_LOGO_URL') ||
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/400006eb0_15301661.png';
const PORT = Number.parseInt(env.PORT || '4173', 10);
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
    source: 'coinmarketcap',
    logo: kas?.logo || DEFAULT_KAS_LOGO
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
    source: 'coingecko',
    logo: DEFAULT_KAS_LOGO
  };
};

const fallbackKasRate = () => ({
  success: true,
  rate: 0.025,
  lastUpdated: new Date().toISOString(),
  symbol: 'KAS',
  name: 'Kaspa',
  source: 'fallback',
  logo: DEFAULT_KAS_LOGO
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

  sendJson(res, 404, { success: false, error: 'Not Found' });
});

if ((env.NODE_ENV || 'development') !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

export default server;
export { resolveEnvValue };
