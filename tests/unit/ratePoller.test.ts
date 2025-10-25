import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../server/lib/env.js', () => ({
  getSupabaseAdmin: vi.fn(() => ({ mocked: true })),
}));

vi.mock('../../server/lib/rateFetcher.js', () => ({
  getKasUsdRate: vi.fn(async () => 0.0567),
}));

vi.mock('../../server/lib/rateStore.js', () => ({
  upsertRateRecord: vi.fn(async (rate) => ({
    currency_pair: 'KAS_USD',
    rate,
    updated_at: '2024-01-01T00:00:00Z',
  })),
}));

describe('rate poller', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('upserts the latest rate on each poller tick', async () => {
    const envModule = await import('../../server/lib/env.js');
    const fetcherModule = await import('../../server/lib/rateFetcher.js');
    const storeModule = await import('../../server/lib/rateStore.js');

    const { runRateUpdateOnce } = await import('../../server/jobs/ratePoller.js');
    const record = await runRateUpdateOnce();

    expect(fetcherModule.getKasUsdRate).toHaveBeenCalledTimes(1);
    expect(envModule.getSupabaseAdmin).toHaveBeenCalledTimes(1);
    const supabaseClient = (envModule.getSupabaseAdmin as unknown as vi.Mock).mock.results[0]?.value;
    expect(storeModule.upsertRateRecord).toHaveBeenCalledWith(0.0567, supabaseClient);
    expect(record?.rate).toBeCloseTo(0.0567);
  });
});
