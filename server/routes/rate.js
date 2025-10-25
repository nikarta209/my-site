/* eslint-env node */
import { getKasUsdRate } from '../lib/rateFetcher.js';
import { getLatestRateRecord, upsertRateRecord } from '../lib/rateStore.js';

export const getRateApiResponse = async () => {
  try {
    const existing = await getLatestRateRecord();
    if (existing) {
      return { status: 200, body: existing };
    }

    const rate = await getKasUsdRate();
    const record = await upsertRateRecord(rate);
    return { status: 200, body: record };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RateRoute] failed to provide rate:', message);
    return { status: 500, body: { error: message } };
  }
};
