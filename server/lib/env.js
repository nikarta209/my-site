/* eslint-env node */
import { createClient } from '@supabase/supabase-js';

const nodeProcess = globalThis.process;
try {
  nodeProcess?.loadEnvFile?.();
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    // ignore missing .env files in test environments
  } else {
    throw error;
  }
}
const env = nodeProcess?.env ?? {};

const resolveEnvValue = (...keys) => {
  for (const key of keys) {
    if (!key) continue;

    if (env[key] !== undefined) {
      return env[key];
    }

    if (!key.startsWith('VITE_')) {
      const viteKey = `VITE_${key}`;
      if (env[viteKey] !== undefined) {
        return env[viteKey];
      }
    } else {
      const unprefixed = key.slice(5);
      if (unprefixed && env[unprefixed] !== undefined) {
        return env[unprefixed];
      }
    }
  }
  return undefined;
};

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

let cachedSupabaseAdmin = null;

const getSupabaseAdmin = () => {
  if (!cachedSupabaseAdmin && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    cachedSupabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return cachedSupabaseAdmin;
};

const assertSupabaseConfigured = () => {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase service role key is not configured.');
  }
  return client;
};

export { env, resolveEnvValue, getSupabaseAdmin, assertSupabaseConfigured, SUPABASE_URL, SUPABASE_SERVICE_KEY };
