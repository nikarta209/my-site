const COINMARKETCAP_BASE_URL = 'https://pro-api.coinmarketcap.com';
const DEFAULT_TIMEOUT_MS = 7000;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedKasRate = null;
let cachedKasRateTimestamp = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT_MS, fetchImpl = fetch) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetchImpl(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

const toNumber = (value) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};

const parseKasQuotePayload = (payload) => {
  const kasData = payload?.data?.KAS;
  const usdQuote = kasData?.quote?.USD;

  const rate = toNumber(usdQuote?.price);
  if (!rate) {
    throw new Error('KAS rate not found in CoinMarketCap response');
  }

  return {
    rate,
    lastUpdated: usdQuote?.last_updated || new Date().toISOString(),
    logo: kasData?.logo || null,
    symbol: kasData?.symbol || 'KAS',
    name: kasData?.name || 'Kaspa'
  };
};

const fetchKasQuote = async (apiKey, fetchImpl = fetch) => {
  const params = new URLSearchParams({ symbol: 'KAS', convert: 'USD' });
  const response = await fetchWithTimeout(
    `${COINMARKETCAP_BASE_URL}/v1/cryptocurrency/quotes/latest?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'X-CMC_PRO_API_KEY': apiKey
      }
    },
    DEFAULT_TIMEOUT_MS,
    fetchImpl
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = payload?.status?.error_message || `Failed to fetch KAS rate (status ${response.status})`;
    throw new Error(errorMessage);
  }

  return parseKasQuotePayload(payload);
};

const fetchKasLogo = async (apiKey, fetchImpl = fetch) => {
  const params = new URLSearchParams({ symbol: 'KAS' });
  const response = await fetchWithTimeout(
    `${COINMARKETCAP_BASE_URL}/v2/cryptocurrency/info?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'X-CMC_PRO_API_KEY': apiKey
      }
    },
    DEFAULT_TIMEOUT_MS,
    fetchImpl
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = payload?.status?.error_message || `Failed to fetch KAS logo (status ${response.status})`;
    throw new Error(errorMessage);
  }

  return payload?.data?.KAS?.logo || null;
};

export const clearKasRateCache = () => {
  cachedKasRate = null;
  cachedKasRateTimestamp = 0;
};

export const getCachedKasRate = () => cachedKasRate;

export const getKasRateFromCoinMarketCap = async (
  apiKey,
  {
    fetchImpl = fetch,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    retries = 1,
    retryDelayMs = 250
  } = {}
) => {
  if (!apiKey) {
    throw new Error('CoinMarketCap API key is not configured');
  }

  const now = Date.now();
  if (cachedKasRate && now - cachedKasRateTimestamp < cacheTtlMs) {
    return cachedKasRate;
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const data = await fetchKasQuote(apiKey, fetchImpl);
      if (!data.logo) {
        try {
          data.logo = await fetchKasLogo(apiKey, fetchImpl);
        } catch (logoError) {
          // Logo is optional; log error in console but do not fail the whole request.
          console.warn('[coinmarketcap] Unable to load Kaspa logo', logoError);
        }
      }

      cachedKasRate = {
        success: true,
        source: 'coinmarketcap',
        ...data
      };
      cachedKasRateTimestamp = Date.now();
      return cachedKasRate;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(retryDelayMs);
      }
    }
  }

  throw lastError || new Error('Failed to fetch Kaspa rate from CoinMarketCap');
};

export const COINMARKETCAP_CACHE_TTL_MS = DEFAULT_CACHE_TTL_MS;
