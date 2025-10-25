/* eslint-env node */
import { getKasUsdRate } from '../lib/rateFetcher.js';
import { getSupabaseAdmin } from '../lib/env.js';
import { upsertRateRecord } from '../lib/rateStore.js';

const BASE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const JITTER_MS = 60 * 1000; // +/- 60 seconds

let timer = null;
let isRunning = false;

export const computeNextDelay = () => {
  const jitter = Math.floor((Math.random() * 2 - 1) * JITTER_MS);
  return BASE_INTERVAL_MS + jitter;
};

export const runRateUpdateOnce = async () => {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase client is not configured');
  }

  const rate = await getKasUsdRate();
  const record = await upsertRateRecord(rate, client);
  console.log('[RatePoller] updated KAS_USD =', rate.toFixed(6));
  return record;
};

const scheduleNext = () => {
  const delay = computeNextDelay();
  timer = setTimeout(async () => {
    try {
      await runRateUpdateOnce();
    } catch (error) {
      console.warn('[RatePoller] tick failed:', error instanceof Error ? error.message : error);
    } finally {
      scheduleNext();
    }
  }, delay);
};

export const startRatePoller = () => {
  if (isRunning) {
    return;
  }

  if (process.env.DISABLE_RATE_WORKER === '1') {
    console.log('[RatePoller] disabled by flag');
    return;
  }

  if (!getSupabaseAdmin()) {
    console.warn('[RatePoller] Supabase service role key is not configured; poller not started.');
    return;
  }

  isRunning = true;
  runRateUpdateOnce().catch((error) => {
    console.warn('[RatePoller] initial update failed:', error instanceof Error ? error.message : error);
  }).finally(() => {
    scheduleNext();
  });
};

export const stopRatePoller = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  isRunning = false;
};
