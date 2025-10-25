/* eslint-env node */
import { getKasUsdRate } from '../lib/rateFetcher.js';
import {
  KAS_USD_PAIR,
  lastUpdatedAt,
  readPair,
  upsertPair,
} from '../lib/rateStore.js';

export const getRateApiResponse = async () => {
  try {
    const existing = await readPair(KAS_USD_PAIR);
    if (existing) {
      return { status: 200, body: existing };
    }

    const rate = await getKasUsdRate();
    const record = await upsertPair(KAS_USD_PAIR, rate);
    return { status: 200, body: record };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RateRoute] failed to provide rate:', message);
    return { status: 502, body: { error: message } };
  }
};

export const registerRateRoutes = (app) => {
  app.get('/api/rate', async (_req, res) => {
    const { status, body } = await getRateApiResponse();
    res.status(status).json(body);
  });

  app.get('/api/rate/debug', async (_req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    try {
      const updatedAt = await lastUpdatedAt(KAS_USD_PAIR);
      res.json({
        hasCMCKey: Boolean(process.env.COINMARKETCAP_API_KEY),
        isProd,
        workerEnabled: process.env.DISABLE_RATE_WORKER !== '1',
        lastUpdatedAt: updatedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });

  const sendRate = async (_req, res) => {
    const { status, body } = await getRateApiResponse();
    res.status(status).json(body);
  };

  app.get('/api/coinmarketcap/kas-rate', sendRate);
  app.get('/api/coingecko', sendRate);
  app.post('/api/coingecko', sendRate);
};
