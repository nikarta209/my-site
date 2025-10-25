import { afterEach, describe, expect, it, vi } from 'vitest';

declare global {
  // eslint-disable-next-line no-var
  var fetch: typeof fetch;
}

const mockFetch = (impl: (input: RequestInfo | URL) => Promise<Response>) => {
  const fetchSpy = vi.fn((input: RequestInfo | URL) => impl(input));
  global.fetch = fetchSpy as typeof fetch;
  return fetchSpy;
};

describe('rateFetcher', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('fetches from CoinMarketCap when API key is present and caches the result', async () => {
    process.env.COINMARKETCAP_API_KEY = 'test-key';
    process.env.COINGECKO_API_KEY = '';

    const fetchSpy = mockFetch(async (input) => {
      const url = input.toString();
      if (url.includes('coinmarketcap')) {
        return new Response(
          JSON.stringify({
            status: { error_code: 0 },
            data: {
              20396: { quote: { USD: { price: 0.051234 } } },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    const module = await import('../../server/lib/rateFetcher.js');
    const { getKasUsdRate, __clearRateCache } = module;

    const rate1 = await getKasUsdRate();
    expect(rate1).toBeCloseTo(0.051234);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const rate2 = await getKasUsdRate();
    expect(rate2).toBe(rate1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    __clearRateCache();
  });

  it('falls back to CoinGecko when CoinMarketCap fails', async () => {
    process.env.COINMARKETCAP_API_KEY = 'test-key';

    const fetchSpy = mockFetch(async (input) => {
      const url = input.toString();
      if (url.includes('coinmarketcap')) {
        return new Response('Unauthorized', { status: 401 });
      }
      if (url.includes('coingecko')) {
        return new Response(
          JSON.stringify({ kaspa: { usd: 0.049 } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    const module = await import('../../server/lib/rateFetcher.js');
    const { getKasUsdRate, __clearRateCache } = module;

    const rate = await getKasUsdRate({ bypassCache: true });
    expect(rate).toBeCloseTo(0.049);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls.at(-1)?.[0].toString()).toContain('coingecko');

    __clearRateCache();
  });

  it('falls back to CoinGecko when CoinMarketCap returns empty payload', async () => {
    process.env.COINMARKETCAP_API_KEY = 'test-key';

    const fetchSpy = mockFetch(async (input) => {
      const url = input.toString();
      if (url.includes('coinmarketcap')) {
        return new Response(
          JSON.stringify({ status: { error_code: 0 }, data: {} }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('coingecko')) {
        return new Response(
          JSON.stringify({ kaspa: { usd: 0.052 } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    const module = await import('../../server/lib/rateFetcher.js');
    const { getKasUsdRate, __clearRateCache } = module;

    const rate = await getKasUsdRate({ bypassCache: true });
    expect(rate).toBeCloseTo(0.052);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls.at(-1)?.[0].toString()).toContain('coingecko');

    __clearRateCache();
  });
});
