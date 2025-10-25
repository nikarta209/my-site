import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../server/lib/rateStore.js', () => ({
  readPair: vi.fn(),
  upsertPair: vi.fn(),
  lastUpdatedAt: vi.fn(),
  KAS_USD_PAIR: 'KAS_USD',
}));

vi.mock('../../server/lib/rateFetcher.js', () => ({
  getKasUsdRate: vi.fn(),
}));

describe('rate route', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns existing rate when available', async () => {
    const record = { currency_pair: 'KAS_USD', rate: 0.05, updated_at: '2024-01-01T00:00:00Z' };
    const store = await import('../../server/lib/rateStore.js');
    (store.readPair as unknown as vi.Mock).mockResolvedValue(record);

    const { getRateApiResponse } = await import('../../server/routes/rate.js');
    const response = await getRateApiResponse();

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(store.upsertPair).not.toHaveBeenCalled();
  });

  it('fetches and stores rate on cold start', async () => {
    const store = await import('../../server/lib/rateStore.js');
    (store.readPair as unknown as vi.Mock).mockResolvedValue(null);
    (store.upsertPair as unknown as vi.Mock).mockResolvedValue({
      currency_pair: 'KAS_USD',
      rate: 0.047,
      updated_at: '2024-01-02T00:00:00Z',
    });

    const fetcher = await import('../../server/lib/rateFetcher.js');
    (fetcher.getKasUsdRate as unknown as vi.Mock).mockResolvedValue(0.047);

    const { getRateApiResponse } = await import('../../server/routes/rate.js');
    const response = await getRateApiResponse();

    expect(fetcher.getKasUsdRate).toHaveBeenCalled();
    expect(store.upsertPair).toHaveBeenCalledWith('KAS_USD', 0.047);
    expect(response.status).toBe(200);
    expect(response.body.rate).toBeCloseTo(0.047);
  });

  it('returns error when store throws', async () => {
    const store = await import('../../server/lib/rateStore.js');
    (store.readPair as unknown as vi.Mock).mockRejectedValue(new Error('boom'));

    const { getRateApiResponse } = await import('../../server/routes/rate.js');
    const response = await getRateApiResponse();

    expect(response.status).toBe(502);
    expect(response.body).toHaveProperty('error');
  });
});
