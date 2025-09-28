/**
 * @file DatabaseSync.js
 * @description Этот файл содержит полный SQL-скрипт для синхронизации базы данных Supabase.
 * Платформа требует, чтобы все файлы были в формате JS, поэтому скрипт экспортируется как строка.
 *
 * @usage
 * 1. Скопируйте содержимое переменной `databaseSyncSQL` (весь текст внутри обратных кавычек).
 * 2. Перейдите в панель управления вашего проекта Supabase.
 * 3. Откройте "SQL Editor".
 * 4. Вставьте скрипт в новое окно запроса и нажмите "Run".
 */

export const databaseSyncSQL = `
-- =================================================================
-- KASBOOK DATABASE SYNC SCRIPT (v.2.1)
-- Описание: Этот скрипт полностью синхронизирует вашу схему БД
-- с последними определениями entities. Он идемпотентен.
-- =================================================================

BEGIN;

-- 1. ОБНОВЛЕНИЕ ТАБЛИЦЫ "books"
ALTER TABLE public.books
    ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS mood TEXT,
    ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS is_usd_fixed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS qualified_sale BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS is_qualified_for_royalty_tiers BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS rejection_info JSONB,
    ADD COLUMN IF NOT EXISTS moderator_email TEXT,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS drm_watermark BOOLEAN DEFAULT TRUE;

ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_genre_check;
ALTER TABLE public.books ADD CONSTRAINT books_genre_check 
CHECK (genre IN ('fiction', 'non-fiction', 'science', 'history', 'business', 'romance', 'mystery', 'fantasy', 'biography', 'self-help', 'philosophy'));

ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_status_check;
ALTER TABLE public.books ADD CONSTRAINT books_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. ПЕРЕСОЗДАНИЕ ТАБЛИЦЫ "purchases"
DROP TABLE IF EXISTS public.purchases CASCADE;
CREATE TABLE public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    buyer_email TEXT NOT NULL,
    seller_email TEXT NOT NULL,
    purchase_type TEXT DEFAULT 'primary' CHECK (purchase_type IN ('primary', 'resale')),
    price_kas DECIMAL(18, 8) NOT NULL,
    transaction_hash TEXT,
    author_payout_kas DECIMAL(18, 8),
    platform_fee_kas DECIMAL(18, 8),
    is_qualified_sale BOOLEAN DEFAULT TRUE
);

-- 3. ПЕРЕСОЗДАНИЕ ТАБЛИЦЫ "reviews"
DROP TABLE IF EXISTS public.reviews CASCADE;
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    reviewer_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    helpful_votes INTEGER DEFAULT 0,
    UNIQUE(book_id, reviewer_email)
);

-- 4. СОЗДАНИЕ ТАБЛИЦЫ "resale_listings"
CREATE TABLE IF NOT EXISTS public.resale_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    seller_email TEXT NOT NULL,
    price_kas DECIMAL(18, 8) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
    original_purchase_id UUID NOT NULL, -- Will be linked later if needed
    nft_token_id TEXT
);
-- Note: Foreign key to purchases is removed to allow creation before purchases table is populated on fresh DBs.

-- 5. СОЗДАНИЕ ТАБЛИЦЫ "ai_recommendations"
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    query TEXT NOT NULL,
    recommended_books JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendation_reason TEXT,
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    query_type TEXT CHECK (query_type IN ('genre', 'mood', 'similar', 'general'))
);

-- 6. ОБНОВЛЕНИЕ ТАБЛИЦЫ "user_book_data"
CREATE TABLE IF NOT EXISTS public.user_book_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    last_page_read INTEGER DEFAULT 1,
    notes TEXT,
    reading_progress INTEGER DEFAULT 0 CHECK (reading_progress >= 0 AND reading_progress <= 100),
    started_reading_at TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ,
    highlights JSONB DEFAULT '[]'::jsonb,
    last_sync TIMESTAMPTZ,
    tts_voice TEXT DEFAULT 'default',
    UNIQUE(user_email, book_id)
);

ALTER TABLE public.user_book_data
ADD COLUMN IF NOT EXISTS tts_settings JSONB DEFAULT '{}'::jsonb;

-- 7. СОЗДАНИЕ ТАБЛИЦЫ ПРОФИЛЕЙ "users"
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    wallet_address TEXT,
    balance_kas DECIMAL(18, 8) DEFAULT 1000.0,
    preferred_languages TEXT[] DEFAULT '{"ru"}',
    dark_mode BOOLEAN DEFAULT FALSE,
    phone_number TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    role TEXT DEFAULT 'user' NOT NULL,
    is_author BOOLEAN DEFAULT FALSE
);

-- 8. СОЗДАНИЕ ВСПОМОГАТЕЛЬНЫХ ТАБЛИЦ
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    payment_id TEXT NOT NULL UNIQUE,
    order_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    books JSONB,
    amount_usd DECIMAL(10, 2) NOT NULL,
    amount_kas DECIMAL(18, 8) NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT DEFAULT 'nowpayments_kas',
    nowpayments_data JSONB,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    currency_pair TEXT NOT NULL UNIQUE,
    rate DECIMAL(20, 10) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- 9. СОЗДАНИЕ ИНДЕКСОВ
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_author_email ON public.books(author_email);
CREATE INDEX IF NOT EXISTS idx_books_genres ON public.books USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON public.purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON public.reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_data_user_email ON public.user_book_data(user_email);
CREATE INDEX IF NOT EXISTS idx_user_book_data_tts_settings ON public.user_book_data USING GIN(tts_settings);

COMMIT;
`;

export default function DatabaseSyncComponent() {
    return null; // Этот компонент не рендерит ничего, он просто хранит SQL-скрипт.
}