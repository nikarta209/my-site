import { createClient } from '@supabase/supabase-js';

const readViteEnv = (key) => {
  if (!key) return undefined;

  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
    return import.meta.env[key];
  }

  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }

  return undefined;
};

const SUPABASE_URL = readViteEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = readViteEnv('VITE_SUPABASE_ANON_KEY');
const STORAGE_BUCKET = readViteEnv('VITE_SUPABASE_STORAGE_BUCKET') || 'books';
const EDGE_FUNCTION_URL = readViteEnv('VITE_SUPABASE_EDGE_FUNCTION_URL') || null;

const createNoopQueryBuilder = (error) => {
  const builder = {
    select() { return builder; },
    eq() { return builder; },
    neq() { return builder; },
    in() { return builder; },
    contains() { return builder; },
    containsAny() { return builder; },
    overlaps() { return builder; },
    ilike() { return builder; },
    gte() { return builder; },
    gt() { return builder; },
    lte() { return builder; },
    lt() { return builder; },
    order() { return builder; },
    limit() { return builder; },
    range() { return builder; },
    single() { return Promise.resolve({ data: null, error }); },
    maybeSingle() { return Promise.resolve({ data: null, error }); },
    insert() { return Promise.resolve({ data: null, error }); },
    update() { return Promise.resolve({ data: null, error }); },
    delete() { return Promise.resolve({ data: null, error }); },
    then(onFulfilled, onRejected) {
      return Promise.reject(error).then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return Promise.reject(error).catch(onRejected);
    }
  };

  return builder;
};

const createNoopClient = () => {
  const error = new Error('Supabase environment variables are not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');

  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error };
      },
      async signInWithOAuth() {
        throw error;
      },
      async signInWithPassword() {
        throw error;
      },
      async signInWithOtp() {
        throw error;
      },
      async signOut() {
        return { error };
      },
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe() {} } } };
      }
    },
    from() {
      return createNoopQueryBuilder(error);
    },
    storage: {
      from() {
        return {
          upload: async () => ({ data: null, error }),
          getPublicUrl: () => ({ data: { publicUrl: null } }),
          createSignedUrl: async () => ({ data: null, error }),
          update: async () => ({ data: null, error }),
          remove: async () => ({ data: null, error })
        };
      }
    }
  };
};

const createSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (typeof console !== 'undefined') {
      console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Falling back to a no-op client.');
    }
    return createNoopClient();
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'kasbook.supabase.auth'
    }
  });
};

export const supabase = createSupabaseClient();
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabaseStorageBucket = STORAGE_BUCKET;
export const supabaseEdgeFunctionUrl = EDGE_FUNCTION_URL;

export const createSupabaseAdminClient = (serviceRoleKey) => {
  if (!serviceRoleKey) return null;
  if (!SUPABASE_URL) return null;

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
};

export default supabase;
