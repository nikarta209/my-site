import supabase, { isSupabaseConfigured } from './supabaseClient';
import { Book, Purchase, User, UserAIPreferences } from './entities';

const importMetaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;

const getEnvValue = (...keys) => {
  for (const key of keys) {
    if (importMetaEnv && importMetaEnv[key] !== undefined) {
      return importMetaEnv[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return process.env[key];
    }
  }
  return undefined;
};

const safeUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
};

const ok = (data) => ({ data, error: null });
const fail = (error) => ({ data: null, error: error?.message || error });

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const COINMARKETCAP_PROXY_BASE_URL = normalizeBaseUrl(
  getEnvValue(
    'VITE_PROXY_BASE_URL',
    'VITE_SERVER_BASE_URL',
    'VITE_API_PROXY_URL',
    'COINMARKETCAP_PROXY_BASE_URL',
    'SERVER_BASE_URL',
    'API_PROXY_URL'
  )
);

const buildProxyUrl = (path) => {
  if (!path) return '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return COINMARKETCAP_PROXY_BASE_URL
    ? `${COINMARKETCAP_PROXY_BASE_URL}${normalizedPath}`
    : normalizedPath;
};

const proxyFetchJson = async (path, options = {}) => {
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(buildProxyUrl(path), {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = payload?.error || `Proxy request failed (status ${response.status})`;
    throw new Error(errorMessage);
  }

  if (payload?.success === false) {
    const errorMessage = payload?.error || 'Proxy responded with an error';
    throw new Error(errorMessage);
  }

  return payload;
};

const fetchKasRateViaProxy = async () => {
  const payload = await proxyFetchJson('/api/coinmarketcap/kas-rate');
  if (!payload?.rate) {
    throw new Error('Proxy response did not include a valid KAS rate');
  }
  return payload;
};

const toISODate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

const sum = (items, selector) => items.reduce((acc, item) => acc + (selector(item) || 0), 0);

export const nowpayments = async (payload = {}) => {
  try {
    const action = payload.action || 'createPayment';

    if (action === 'createPayment') {
      const paymentId = safeUuid();
      const orderId = payload.orderId || `order_${Date.now()}`;
      const status = 'waiting';
      const paymentRecord = {
        payment_id: paymentId,
        order_id: orderId,
        user_email: payload.userEmail || payload?.user?.email || null,
        books: payload.books || null,
        amount_usd: payload.totalAmount || 0,
        amount_kas: payload.totalAmountKas || 0,
        status,
        payment_method: 'nowpayments_kas',
        nowpayments_data: payload,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('payments')
        .upsert(paymentRecord, { onConflict: 'payment_id' });
      if (error) throw error;

      return ok({
        success: true,
        payment_id: paymentId,
        order_id: orderId,
        status,
        amount: paymentRecord.amount_usd,
        amount_kas: paymentRecord.amount_kas,
        payment_url: payload.appBaseUrl
          ? `${payload.appBaseUrl}/payments/${paymentId}`
          : `https://nowpayments.io/payment/${paymentId}`
      });
    }

    if (action === 'getPaymentStatus') {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_id', payload.payment_id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return ok({ success: false, status: 'not_found' });
      }
      return ok({
        success: true,
        status: data.status,
        payment_id: data.payment_id,
        order_id: data.order_id
      });
    }

    return ok({ success: false, error: `Unsupported action: ${action}` });
  } catch (error) {
    console.error('[nowpayments] error', error);
    return fail(error);
  }
};

export const nowpaymentsIPN = async () => ok({ success: true });

const fetchLatestKasRateFromSupabase = async () => {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('currency_pair', 'KAS_USD')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const rate = data?.rate ? Number(data.rate) : null;
  if (!rate) {
    return ok({ success: false, error: 'Rate not found' });
  }

  return ok({
    success: true,
    rate,
    lastUpdated: data?.created_at || null,
    logo: null,
    source: 'supabase'
  });
};

export const coinMarketCap = async ({ action } = {}) => {
  try {
    if (action !== 'getCurrentKasRate') {
      return ok({ success: false, error: 'Unsupported action' });
    }

    let lastError;

    try {
      const proxyData = await fetchKasRateViaProxy();
      return ok(proxyData);
    } catch (proxyError) {
      lastError = proxyError;
      console.warn('[coinMarketCap] proxy error', proxyError);
    }

    try {
      const fallback = await fetchLatestKasRateFromSupabase();
      if (fallback?.data) {
        return fallback;
      }
    } catch (fallbackError) {
      lastError = fallbackError;
      console.warn('[coinMarketCap] fallback error', fallbackError);
    }

    throw lastError || new Error('Не удалось получить курс KAS');
  } catch (error) {
    console.error('[coinMarketCap] error', error);

    try {
      const fallback = await fetchLatestKasRateFromSupabase();
      if (fallback?.data) {
        return fallback;
      }
    } catch (fallbackError) {
      console.warn('[coinMarketCap] fallback error', fallbackError);
    }

    return fail(error);
  }
};

export const supabaseIntegration = async () => ok({ configured: isSupabaseConfigured });
export const supabaseStatus = supabaseIntegration;

export const getBookPageData = async ({ bookId }) => {
  try {
    const book = await Book.get(bookId);
    if (!book) {
      return fail(new Error('Book not found'));
    }

    return ok({
      book,
      similar: await Book.filter({
        status: 'approved',
        genres: { $overlaps: Array.isArray(book.genres) ? book.genres : [] },
        id: { $neq: book.id }
      }, '-rating', 6)
    });
  } catch (error) {
    console.error('[getBookPageData] error', error);
    return fail(error);
  }
};

export const authorAnalytics = async () => getAdminDashboardStats();
export const catalogOptimized = async () => getHomePageData();

const computeAdminStats = (books, purchases, users, userData, referrals) => {
  const totalBooks = books.length;
  const publishedBooks = books.filter((b) => b.status === 'approved').length;
  const totalSales = purchases.length;
  const totalRevenue = sum(purchases, (p) => Number(p.price_kas) || 0);
  const totalUsers = users.length;
  const totalAuthors = users.filter((u) => u.role === 'author' || u.user_type === 'author' || u.is_author).length;

  const booksById = new Map(books.map((book) => [book.id, book]));

  let totalReadingMinutes = 0;
  userData.forEach((record) => {
    const book = booksById.get(record.book_id);
    const pageCount = book?.page_count || 200;
    const progress = record.reading_progress || 0;
    totalReadingMinutes += (pageCount * progress) / 100;
  });

  const authorStats = new Map();
  const genreStats = new Map();

  purchases.forEach((purchase) => {
    const book = booksById.get(purchase.book_id);
    if (!book) return;
    const authorEmail = book.author_email || 'unknown';
    const currentAuthor = authorStats.get(authorEmail) || {
      name: book.author || authorEmail,
      sales: 0,
      revenue: 0,
      avgRating: 0,
      ratings: []
    };
    currentAuthor.sales += 1;
    currentAuthor.revenue += Number(purchase.author_payout_kas || purchase.price_kas || 0);
    if (book.rating) currentAuthor.ratings.push(book.rating);
    authorStats.set(authorEmail, currentAuthor);

    const genres = Array.isArray(book.genres) ? book.genres : (book.genre ? [book.genre] : []);
    genres.forEach((genre) => {
      const currentGenre = genreStats.get(genre) || { genre, sales: 0, revenue: 0 };
      currentGenre.sales += 1;
      currentGenre.revenue += Number(purchase.price_kas || 0);
      genreStats.set(genre, currentGenre);
    });
  });

  const topAuthors = Array.from(authorStats.values())
    .map((author) => ({
      ...author,
      avgRating: author.ratings.length
        ? author.ratings.reduce((acc, value) => acc + value, 0) / author.ratings.length
        : 0
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);

  const topGenres = Array.from(genreStats.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);

  const bookSalesRevenue = sum(purchases, (p) => Number(p.platform_fee_kas) || Number(p.price_kas) * 0.1 || 0);
  const referralPayouts = sum(referrals, (r) => Number(r.amount_kas) || Number(r.referrer_commission_kas) || 0);
  const platformNetRevenue = totalRevenue - bookSalesRevenue - referralPayouts;

  const translatedBooks = books.filter((book) => {
    const langs = Array.isArray(book.languages) ? book.languages : [];
    return langs.filter((lang) => (typeof lang === 'string' ? lang !== 'ru' : lang?.lang && lang.lang !== 'ru')).length > 0;
  });

  const bookStatusStats = {
    pending: books.filter((book) => book.status === 'pending').length,
    approved: books.filter((book) => book.status === 'approved').length,
    rejected: books.filter((book) => book.status === 'rejected').length,
    translated: translatedBooks.length
  };

  const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const dailyActivity = {};
  purchases.forEach((purchase) => {
    const createdAt = purchase.created_at || purchase.created_date;
    const timestamp = createdAt ? new Date(createdAt).getTime() : null;
    if (timestamp && timestamp >= last30Days) {
      const key = toISODate(createdAt);
      dailyActivity[key] = (dailyActivity[key] || 0) + 1;
    }
  });

  const dailyRegistrations = {};
  users.forEach((user) => {
    const createdAt = user.created_at || user.created_date;
    const timestamp = createdAt ? new Date(createdAt).getTime() : null;
    if (timestamp && timestamp >= last30Days) {
      const key = toISODate(createdAt);
      dailyRegistrations[key] = (dailyRegistrations[key] || 0) + 1;
    }
  });

  return {
    totalBooks,
    publishedBooks,
    totalSales,
    totalRevenue,
    totalUsers,
    totalAuthors,
    totalReadingTimeMinutes: Math.round(totalReadingMinutes),
    avgRevenuePerSale: totalSales ? Number((totalRevenue / totalSales).toFixed(2)) : 0,
    conversionRate: totalUsers ? Number(((totalSales / totalUsers) * 100).toFixed(2)) : 0,
    avgBooksPerAuthor: totalAuthors ? Number((publishedBooks / totalAuthors).toFixed(2)) : 0,
    dailyActivity,
    dailyRegistrations,
    topAuthors,
    topGenres,
    salesByGenre: Object.fromEntries(genreStats),
    totalTranslated: translatedBooks.length,
    translationRate: totalBooks ? Number(((translatedBooks.length / totalBooks) * 100).toFixed(2)) : 0,
    bookStatusStats,
    bookSalesRevenue,
    referralPayouts,
    platformNetRevenue
  };
};

export const getAdminDashboardStats = async () => {
  try {
    const [{ data: books = [] }, { data: purchases = [] }, { data: users = [] }, { data: userData = [] }, { data: referrals = [] }] = await Promise.all([
      supabase.from('books').select('*'),
      supabase.from('purchases').select('*'),
      supabase.from('users').select('*'),
      supabase.from('user_book_data').select('*'),
      supabase.from('referral_transactions').select('*')
    ]);

    const stats = computeAdminStats(books, purchases, users, userData, referrals);
    return ok(stats);
  } catch (error) {
    console.error('[getAdminDashboardStats] error', error);
    return fail(error);
  }
};

export const updateBookPrices = async () => {
  try {
    const { data: rateRow, error: rateError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('currency_pair', 'KAS_USD')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (rateError) throw rateError;

    const rate = rateRow?.rate ? Number(rateRow.rate) : null;
    if (!rate || rate <= 0) {
      throw new Error('Актуальный курс KAS/USD не найден');
    }

    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, price_usd, is_usd_fixed');
    if (booksError) throw booksError;

    const updates = (books || [])
      .filter((book) => book.price_usd && !book.is_usd_fixed)
      .map((book) => ({
        id: book.id,
        price_kas: Number((Number(book.price_usd) / rate).toFixed(2)),
        updated_at: new Date().toISOString()
      }));

    if (updates.length > 0) {
      const { error } = await supabase
        .from('books')
        .upsert(updates, { onConflict: 'id' });
      if (error) throw error;
    }

    return ok({ success: true, message: `Обновлено книг: ${updates.length}` });
  } catch (error) {
    console.error('[updateBookPrices] error', error);
    return fail(error);
  }
};

export const getTranslatedStats = async ({ start, end } = {}) => {
  try {
    const { data: books, error } = await supabase.from('books').select('id, languages, updated_at, created_at');
    if (error) throw error;

    const startMs = start ? start * 1000 : Date.now() - 30 * 24 * 60 * 60 * 1000;
    const endMs = end ? end * 1000 : Date.now();

    const dailyMap = new Map();
    let total = 0;

    (books || []).forEach((book) => {
      const languages = Array.isArray(book.languages) ? book.languages : [];
      const translatedCount = languages.filter((lang) => (typeof lang === 'string' ? lang !== 'ru' : lang?.lang && lang.lang !== 'ru')).length;
      if (translatedCount === 0) return;

      const timestamp = new Date(book.updated_at || book.created_at || Date.now()).getTime();
      if (timestamp < startMs || timestamp > endMs) return;

      const dateKey = toISODate(book.updated_at || book.created_at || new Date());
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + translatedCount);
      total += translatedCount;
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return ok({ total, daily });
  } catch (error) {
    console.error('[getTranslatedStats] error', error);
    return fail(error);
  }
};

export const updateTheme = async ({ user_id, theme }) => {
  try {
    if (!user_id) throw new Error('user_id is required');
    const { data, error } = await supabase
      .from('users')
      .update({ ui_theme: theme, updated_at: new Date().toISOString() })
      .eq('id', user_id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return ok({ success: true, user: data });
  } catch (error) {
    console.error('[updateTheme] error', error);
    return fail(error);
  }
};

export const n8nTranslateWebhook = async (payload) => {
  try {
    const webhookUrl = import.meta.env.VITE_N8N_URL;
    if (!webhookUrl) {
      return ok({ success: true, message: 'N8N URL not configured; skipping webhook call.' });
    }

    const body = payload instanceof FormData ? payload : JSON.stringify(payload);
    const headers = payload instanceof FormData ? undefined : { 'Content-Type': 'application/json' };

    const response = await fetch(`${webhookUrl.replace(/\/$/, '')}/webhook/translate`, {
      method: 'POST',
      body,
      headers
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed with status ${response.status}`);
    }

    const data = await response.json().catch(() => ({ success: true }));
    return ok(data);
  } catch (error) {
    console.error('[n8nTranslateWebhook] error', error);
    return fail(error);
  }
};

export const getBookContent = async ({ bookId, isPreview } = {}) => {
  try {
    if (!bookId) throw new Error('bookId is required');
    const book = await Book.get(bookId);
    if (!book) throw new Error('Книга не найдена');

    const urls = [];
    if (book.file_url) urls.push(book.file_url);
    if (Array.isArray(book.languages)) {
      book.languages.forEach((lang) => {
        if (lang && typeof lang === 'object' && lang.file_url) {
          urls.push(lang.file_url);
        }
      });
    }

    let content = null;
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const text = await response.text();
        if (text) {
          content = text;
          break;
        }
      } catch (err) {
        console.warn('Failed to fetch book content from', url, err);
      }
    }

    if (!content) {
      content = book.preview_text || book.description || 'Контент книги недоступен. Пожалуйста, загрузите файл книги в Supabase Storage.';
    }

    if (isPreview && content.length > 5000) {
      content = content.slice(0, 5000);
    }

    return ok({ content, book });
  } catch (error) {
    console.error('[getBookContent] error', error);
    return fail(error);
  }
};

const sortBy = (array, selector, direction = 'desc') => {
  return [...array].sort((a, b) => {
    const valueA = selector(a) ?? 0;
    const valueB = selector(b) ?? 0;
    if (direction === 'asc') return valueA - valueB;
    return valueB - valueA;
  });
};

export const getHomePageData = async () => {
  try {
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .eq('status', 'approved');
    if (error) throw error;

    const list = books || [];
    const byKey = {};

    const hasGenre = (book, genres) => {
      const bookGenres = Array.isArray(book.genres) ? book.genres : (book.genre ? [book.genre] : []);
      return genres.some((genre) => bookGenres.includes(genre));
    };

    byKey['new-releases'] = sortBy(list, (book) => new Date(book.created_at || book.created_date).getTime(), 'desc').slice(0, 12);
    byKey['popular'] = sortBy(list, (book) => book.sales_count || 0, 'desc').slice(0, 12);
    byKey['editors-picks'] = sortBy(list.filter((book) => book.is_editors_pick), (book) => new Date(book.updated_at || book.created_at).getTime(), 'desc').slice(0, 12);
    byKey['top-sales'] = sortBy(list, (book) => book.sales_count || 0, 'desc').slice(0, 12);
    byKey['trending-now'] = sortBy(list, (book) => book.likes_count || 0, 'desc').slice(0, 12);
    byKey['top-rated'] = sortBy(list, (book) => book.rating || 0, 'desc').slice(0, 12);
    byKey['classic-literature'] = list.filter((book) => hasGenre(book, ['klassicheskaya-literatura'])).slice(0, 12);
    byKey['evening-reads'] = list.filter((book) => (book.page_count || 0) <= 150).slice(0, 12);
    byKey['inspiring'] = list.filter((book) => hasGenre(book, ['motivatsiya', 'lichnostnyy-rost', 'psikhologiya-uspekha'])).slice(0, 12);
    byKey['modern-prose'] = list.filter((book) => hasGenre(book, ['sovremennaya-proza'])).slice(0, 12);

    return ok(byKey);
  } catch (error) {
    console.error('[getHomePageData] error', error);
    return fail(error);
  }
};

export const getAuthorStats = async () => {
  try {
    const currentUser = await User.me();
    if (!currentUser?.email) {
      throw new Error('Требуется авторизация');
    }

    const [authorBooks, authorPurchases] = await Promise.all([
      Book.filter({ author_email: currentUser.email }),
      Purchase.filter({ seller_email: currentUser.email })
    ]);

    const monthlyCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthlySales = authorPurchases.filter((purchase) => {
      const createdAt = purchase.created_at || purchase.created_date;
      if (!createdAt) return false;
      return new Date(createdAt).getTime() >= monthlyCutoff;
    });

    const totalRevenue = sum(authorPurchases, (p) => Number(p.author_payout_kas || p.price_kas) || 0);
    const monthlyRevenue = sum(monthlySales, (p) => Number(p.author_payout_kas || p.price_kas) || 0);

    return ok({
      monthlySales: monthlySales.length,
      totalSales: authorPurchases.length,
      totalRevenue,
      monthlyRevenue,
      totalBooks: authorBooks.length
    });
  } catch (error) {
    console.error('[getAuthorStats] error', error);
    return fail(error);
  }
};

export const handleSubscriptionPayment = async ({ userId }) => {
  try {
    if (!userId) throw new Error('userId is required');
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .maybeSingle();
    if (error) throw error;

    return ok({ success: true, subscription: data });
  } catch (error) {
    console.error('[handleSubscriptionPayment] error', error);
    return fail(error);
  }
};

export const updateSubscriptionBooks = async ({ bookIds } = {}) => {
  try {
    const ids = Array.isArray(bookIds) ? bookIds : [];

    const reset = await supabase
      .from('books')
      .update({ is_in_subscription: false })
      .neq('id', null);
    if (reset.error) throw reset.error;

    if (ids.length > 0) {
      const { error } = await supabase
        .from('books')
        .update({ is_in_subscription: true })
        .in('id', ids);
      if (error) throw error;
    }

    return ok({ success: true, count: ids.length });
  } catch (error) {
    console.error('[updateSubscriptionBooks] error', error);
    return fail(error);
  }
};

export const generatePersonalizedRatings = async ({ userEmail }) => {
  try {
    const preferences = await UserAIPreferences.filter({ user_email: userEmail });
    return ok({
      success: true,
      ratings: preferences.map((pref) => ({
        genre: pref.genre,
        score: pref.preference_score || 0.5
      }))
    });
  } catch (error) {
    console.error('[generatePersonalizedRatings] error', error);
    return fail(error);
  }
};

export const getPersonalizedReview = async ({ bookId, language = 'ru' } = {}) => {
  try {
    const book = await Book.get(bookId);
    if (!book) throw new Error('Книга не найдена');

    const summary = book.description || book.preview_text || 'Описание недоступно.';
    return ok({
      success: true,
      review: `"${book.title}" — ${summary.slice(0, 220)}${summary.length > 220 ? '…' : ''}`,
      language
    });
  } catch (error) {
    console.error('[getPersonalizedReview] error', error);
    return fail(error);
  }
};
