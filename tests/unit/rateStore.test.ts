import { describe, expect, it, vi } from 'vitest';

describe('rateStore', () => {
  it('reads the latest rate record', async () => {
    const expected = {
      currency_pair: 'KAS_USD',
      rate: 0.05,
      updated_at: '2024-01-01T00:00:00Z',
    };

    const maybeSingle = vi.fn().mockResolvedValue({
      data: { ...expected, created_at: '2024-01-01T00:00:00Z' },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as any;

    const { getLatestRateRecord } = await import('../../server/lib/rateStore.js');
    const record = await getLatestRateRecord(supabase);

    expect(record).toEqual(expected);
    expect(from).toHaveBeenCalledWith('exchange_rates');
    expect(select).toHaveBeenCalledWith('currency_pair, rate, updated_at, created_at');
    expect(eq).toHaveBeenCalledWith('currency_pair', 'KAS_USD');
  });

  it('upserts the rate record', async () => {
    const upsertPayload: any[] = [];
    const result = {
      currency_pair: 'KAS_USD',
      rate: 0.048,
      updated_at: '2024-01-02T00:00:00Z',
      created_at: '2024-01-02T00:00:00Z',
    };

    const single = vi.fn().mockResolvedValue({ data: result, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const upsert = vi.fn().mockImplementation((payload) => {
      upsertPayload.push(payload);
      return { select };
    });
    const from = vi.fn().mockReturnValue({ upsert });
    const supabase = { from } as any;

    const { upsertRateRecord } = await import('../../server/lib/rateStore.js');
    const record = await upsertRateRecord(0.048, supabase);

    expect(record).toEqual({
      currency_pair: 'KAS_USD',
      rate: 0.048,
      updated_at: '2024-01-02T00:00:00Z',
    });
    expect(upsert).toHaveBeenCalled();
    expect(upsertPayload[0].currency_pair).toBe('KAS_USD');
    expect(upsertPayload[0].rate).toBeCloseTo(0.048);
    expect(typeof upsertPayload[0].updated_at).toBe('string');
    expect(select).toHaveBeenCalledWith('currency_pair, rate, updated_at, created_at');
  });
});
