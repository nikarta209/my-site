import supabase, { isSupabaseConfigured } from './supabaseClient';
import { toast } from 'sonner';

const TABLES = {
  Book: 'books',
  Purchase: 'purchases',
  Review: 'reviews',
  ResaleListing: 'resale_listings',
  AIRecommendation: 'ai_recommendations',
  UserBookData: 'user_book_data',
  Payment: 'payments',
  ExchangeRate: 'exchange_rates',
  SystemConfig: 'system_config',
  SharedNote: 'shared_notes',
  NoteLike: 'note_likes',
  ReferralTransaction: 'referral_transactions',
  UserAIPreferences: 'user_ai_preferences',
  UserBookRating: 'user_book_ratings',
  User: 'users'
};

const COLUMN_ALIASES = {
  created_date: 'created_at',
  updated_date: 'updated_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  sales_count: 'sales_count'
};

const normalizeColumn = (column) => COLUMN_ALIASES[column] || column;

const handleQueryError = (error, context) => {
  if (!error) return;
  console.error(`[Supabase] ${context}:`, error);
  if (typeof window !== 'undefined' && toast) {
    toast.error(`Ошибка Supabase: ${error.message || context}`);
  }
  throw error;
};

const applyOrder = (query, orderBy) => {
  if (!orderBy) return query;

  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  orders.forEach((rule) => {
    if (!rule || typeof rule !== 'string') return;
    const ascending = !rule.startsWith('-');
    const column = normalizeColumn(rule.replace(/^[-+]/, ''));
    query = query.order(column, { ascending });
  });
  return query;
};

const applyRange = (query, limit, offset) => {
  if (typeof limit === 'number' && typeof offset === 'number') {
    query = query.range(offset, offset + limit - 1);
  } else if (typeof limit === 'number') {
    query = query.limit(limit);
  }
  return query;
};

const applyFilter = (query, column, value) => {
  const normalizedColumn = normalizeColumn(column);

  if (value === undefined || value === null) {
    return query;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    if ('$in' in value) {
      const values = value.$in;
      if (Array.isArray(values) && values.length > 0) {
        query = query.in(normalizedColumn, values);
      }
    }
    if ('$contains' in value) {
      const values = value.$contains;
      if (Array.isArray(values) || typeof values === 'object') {
        query = query.contains(normalizedColumn, values);
      }
    }
    if ('$overlaps' in value) {
      const values = value.$overlaps;
      if (Array.isArray(values) && values.length > 0) {
        query = query.overlaps(normalizedColumn, values);
      }
    }
    if ('$ilike' in value) {
      query = query.ilike(normalizedColumn, value.$ilike);
    }
    if ('$gte' in value) {
      query = query.gte(normalizedColumn, value.$gte);
    }
    if ('$gt' in value) {
      query = query.gt(normalizedColumn, value.$gt);
    }
    if ('$lte' in value) {
      query = query.lte(normalizedColumn, value.$lte);
    }
    if ('$lt' in value) {
      query = query.lt(normalizedColumn, value.$lt);
    }
    if ('$eq' in value) {
      query = query.eq(normalizedColumn, value.$eq);
    }
    if ('$neq' in value) {
      query = query.neq(normalizedColumn, value.$neq);
    }
    return query;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return query;
    }
    return query.in(normalizedColumn, value);
  }

  return query.eq(normalizedColumn, value);
};

const applyFilters = (query, filters = {}) => {
  if (!filters || typeof filters !== 'object') return query;
  return Object.entries(filters).reduce((acc, [column, value]) => applyFilter(acc, column, value), query);
};

const createEntity = (tableName) => {
  const table = TABLES[tableName];
  if (!table) {
    throw new Error(`Unknown entity: ${tableName}`);
  }

  const selectQuery = () => supabase.from(table).select('*');

  return {
    async list(orderBy = '-created_at', limit, offset) {
      let query = selectQuery();
      query = applyOrder(query, orderBy);
      query = applyRange(query, limit, offset);
      const { data, error } = await query;
      handleQueryError(error, `${tableName}.list`);
      return data || [];
    },
    async filter(filters = {}, orderBy = '-created_at', limit, offset) {
      let query = selectQuery();
      query = applyFilters(query, filters);
      query = applyOrder(query, orderBy);
      query = applyRange(query, limit, offset);
      const { data, error } = await query;
      handleQueryError(error, `${tableName}.filter`);
      return data || [];
    },
    async get(id) {
      const { data, error } = await selectQuery().eq('id', id).maybeSingle();
      handleQueryError(error, `${tableName}.get`);
      return data;
    },
    async create(payload) {
      const { data, error } = await supabase.from(table).insert(payload).select().maybeSingle();
      handleQueryError(error, `${tableName}.create`);
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().maybeSingle();
      handleQueryError(error, `${tableName}.update`);
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      handleQueryError(error, `${tableName}.delete`);
      return { success: !error };
    }
  };
};

const createUserEntity = () => {
  const base = createEntity('User');

  return {
    ...base,
    async me() {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('[Supabase] getSession error:', sessionError);
      }
      const session = sessionData?.session;
      if (!session?.user) return null;

      const { data: profile, error } = await supabase
        .from(TABLES.User)
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      handleQueryError(error, 'User.me');
      return profile ? { ...session.user, ...profile } : session.user;
    },
    async login() {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase не настроен. Укажите переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.');
      }

      const provider = import.meta.env.VITE_SUPABASE_OAUTH_PROVIDER;
      const redirectTo = import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL || window.location.origin;

      if (provider) {
        const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
        handleQueryError(error, 'User.login');
        return { success: !error };
      }

      const email = typeof window !== 'undefined' ? window.prompt('Введите e-mail для входа') : null;
      if (!email) {
        return { success: false, error: 'Login cancelled' };
      }
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      handleQueryError(error, 'User.login');
      return { success: !error };
    },
    async logout() {
      const { error } = await supabase.auth.signOut();
      handleQueryError(error, 'User.logout');
      return { success: !error };
    },
    async updateMyUserData(patch) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        throw new Error('Необходима авторизация');
      }
      const { data, error } = await supabase
        .from(TABLES.User)
        .update(patch)
        .eq('id', userId)
        .select()
        .maybeSingle();
      handleQueryError(error, 'User.updateMyUserData');
      return data;
    }
  };
};

export const Book = createEntity('Book');
export const Purchase = createEntity('Purchase');
export const Review = createEntity('Review');
export const ResaleListing = createEntity('ResaleListing');
export const AIRecommendation = createEntity('AIRecommendation');
export const UserBookData = createEntity('UserBookData');
export const Payment = createEntity('Payment');
export const ExchangeRate = createEntity('ExchangeRate');
export const SystemConfig = createEntity('SystemConfig');
export const SharedNote = createEntity('SharedNote');
export const NoteLike = createEntity('NoteLike');
export const ReferralTransaction = createEntity('ReferralTransaction');
export const UserAIPreferences = createEntity('UserAIPreferences');
export const UserBookRating = createEntity('UserBookRating');
export const User = createUserEntity();
