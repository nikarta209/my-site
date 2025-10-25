/* eslint-env node */
import { getSupabaseAdmin } from './env.js';

const TABLE_NAME = 'exchange_rates';
export const KAS_USD_PAIR = 'KAS_USD';

const ensureClient = (client = getSupabaseAdmin()) => {
  if (!client) {
    throw new Error('Supabase service role client is not configured');
  }
  return client;
};

const mapRecord = (record) => {
  if (!record) return null;
  return {
    currency_pair: record.currency_pair,
    rate: typeof record.rate === 'number' ? record.rate : Number(record.rate),
    updated_at: record.updated_at ?? record.created_at ?? null,
  };
};

export const readPair = async (
  pair = KAS_USD_PAIR,
  client = getSupabaseAdmin(),
) => {
  const supabase = ensureClient(client);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('currency_pair, rate, updated_at, created_at')
    .eq('currency_pair', pair)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapRecord(data);
};

export const upsertPair = async (
  pair,
  rate,
  client = getSupabaseAdmin(),
) => {
  const supabase = ensureClient(client);
  const payload = {
    currency_pair: pair,
    rate,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(payload, { onConflict: 'currency_pair' })
    .select('currency_pair, rate, updated_at, created_at')
    .single();

  if (error) {
    throw error;
  }

  return mapRecord(data);
};

export const lastUpdatedAt = async (
  pair = KAS_USD_PAIR,
  client = getSupabaseAdmin(),
) => {
  const record = await readPair(pair, client);
  return record?.updated_at ?? null;
};

export const getLatestRateRecord = (client = getSupabaseAdmin()) =>
  readPair(KAS_USD_PAIR, client);
export const upsertRateRecord = (rate, client = getSupabaseAdmin()) =>
  upsertPair(KAS_USD_PAIR, rate, client);
