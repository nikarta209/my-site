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

export const getLatestRateRecord = async (client = getSupabaseAdmin()) => {
  const supabase = ensureClient(client);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('currency_pair, rate, updated_at')
    .eq('currency_pair', KAS_USD_PAIR)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ?? null;
};

export const upsertRateRecord = async (rate, client = getSupabaseAdmin()) => {
  const supabase = ensureClient(client);
  const payload = {
    currency_pair: KAS_USD_PAIR,
    rate,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(payload, { onConflict: 'currency_pair' })
    .select('currency_pair, rate, updated_at')
    .single();

  if (error) {
    throw error;
  }
  return data;
};
