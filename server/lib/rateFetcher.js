/* eslint-env node */
import { env } from './env.js';

const CMC_KAS_ID = '20396';
const COINMARKETCAP_URL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${CMC_KAS_ID}&convert=USD`;
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd';
const COINGECKO_PRO_URL = 'https://pro-api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd';
const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 7_000;
const MAX_RETRIES = 2;

let cachedRate = null;
let cachedAt = 0;
let inflightPromise = null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async (promiseFactory) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
};

const parsePrice = (value, sourceName) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`${sourceName} price not found`);
  }
  return price;
};

const fetchFromCMCOnce = async (signal) => {
  const apiKey = env.COINMARKETCAP_API_KEY;
  if (!apiKey) {
    throw new Error('CoinMarketCap API key missing');
  }

  const response = await fetch(COINMARKETCAP_URL, {
    headers: {
      Accept: 'application/json',
      'X-CMC_PRO_API_KEY': apiKey,
    },
    signal,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = payload?.status?.error_message || `CoinMarketCap request failed (${response.status})`;
    throw new Error(reason);
  }

  if (!payload?.status || Number(payload.status.error_code) !== 0) {
    const errorCode = payload?.status?.error_code ?? 'unknown';
    const errorMessage = payload?.status?.error_message || 'no status message';
    throw new Error(`CoinMarketCap error_code=${errorCode} message=${errorMessage}`);
  }

  const asset = payload?.data?.[CMC_KAS_ID];
  if (!asset) {
    throw new Error('CoinMarketCap payload missing asset data');
  }

  const rate = parsePrice(asset?.quote?.USD?.price, 'CoinMarketCap');
  return rate;
};

const fetchFromCoingeckoOnce = async (signal) => {
  const apiKey = env.COINGECKO_API_KEY;
  const response = await fetch(apiKey ? COINGECKO_PRO_URL : COINGECKO_URL, {
    headers: apiKey
      ? {
          Accept: 'application/json',
          'x-cg-pro-api-key': apiKey,
        }
      : { Accept: 'application/json' },
    signal,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error || `CoinGecko request failed (${response.status})`;
    throw new Error(message);
  }

  const rate = parsePrice(payload?.kaspa?.usd, 'CoinGecko');
  return rate;
};

const retry = async (fn, label) => {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await withTimeout((signal) => fn(signal));
    } catch (error) {
      lastError = error;
      const wait = attempt * 250;
      await delay(wait);
    }
  }
  throw new Error(`${label} failed after ${MAX_RETRIES} attempts: ${lastError?.message || lastError}`);
};

export const fetchFromCMC = () => retry(fetchFromCMCOnce, 'CoinMarketCap');
export const fetchFromCoingecko = () => retry(fetchFromCoingeckoOnce, 'CoinGecko');

export const getKasUsdRate = async ({ bypassCache = false } = {}) => {
  const now = Date.now();
  if (!bypassCache && cachedRate !== null && now - cachedAt < CACHE_TTL_MS) {
    return cachedRate;
  }
  if (!bypassCache && inflightPromise) {
    return inflightPromise;
  }

  const fetchPromise = (async () => {
    try {
      let rate = null;
      if (env.COINMARKETCAP_API_KEY) {
        try {
          rate = await fetchFromCMC();
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          console.warn('[RateFetcher] CoinMarketCap fallback:', reason);
        }
      }

      if (rate === null) {
        rate = await fetchFromCoingecko();
      }

      cachedRate = rate;
      cachedAt = Date.now();
      return rate;
    } finally {
      inflightPromise = null;
    }
  })();

  if (!bypassCache) {
    inflightPromise = fetchPromise;
  }

  return fetchPromise;
};

export const __clearRateCache = () => {
  cachedRate = null;
  cachedAt = 0;
  inflightPromise = null;
};
