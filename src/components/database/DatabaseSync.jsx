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
-- KASBOOK DATABASE SYNC SCRIPT (v.3.0)
-- Описание: Этот скрипт синхронизирует схему Supabase с актуальной
-- структурой таблиц, используемой приложением. Скрипт безопасен для
-- повторного запуска: он создает отсутствующие объекты и добавляет
-- отсутствующие столбцы/ограничения.
-- =================================================================

BEGIN;

-- Убедимся, что расширение pgcrypto установлено (нужно для gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================================================================
-- 1. Таблица пользователей приложения
-- =================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL,
    email text UNIQUE,
    full_name text,
    display_name text,
    avatar_url text,
    bio text,
    wallet_address text,
    balance_kas numeric NOT NULL DEFAULT 0,
    preferred_languages text[] NOT NULL DEFAULT '{ru}'::text[],
    ui_theme text,
    dark_mode boolean NOT NULL DEFAULT false,
    notifications_enabled boolean NOT NULL DEFAULT true,
    two_factor_enabled boolean NOT NULL DEFAULT false,
    phone_number text,
    last_login timestamptz,
    role text NOT NULL DEFAULT 'reader',
    user_type text NOT NULL DEFAULT 'reader',
    is_author boolean NOT NULL DEFAULT false,
    is_moderator boolean NOT NULL DEFAULT false,
    referral_code text UNIQUE,
    referred_by text,
    referral_earnings_kas numeric NOT NULL DEFAULT 0,
    active_referrals integer NOT NULL DEFAULT 0,
    subscription_status text NOT NULL DEFAULT 'inactive',
    subscription_expires_at timestamptz,
    subscription_plan text,
    translation_credits integer NOT NULL DEFAULT 0,
    author_bio text,
    author_experience text,
    author_genres text[] NOT NULL DEFAULT '{}'::text[],
    author_motivation text,
    author_sample_work text,
    author_social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
    author_application_status text DEFAULT 'pending',
    author_tier text,
    royalty_percentage numeric,
    qualified_sales integer NOT NULL DEFAULT 0,
    author_total_sales integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    email_verified boolean NOT NULL DEFAULT false,
    phone_verified boolean NOT NULL DEFAULT false,
    sub uuid NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS display_name text,
    ADD COLUMN IF NOT EXISTS bio text,
    ADD COLUMN IF NOT EXISTS ui_theme text,
    ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS phone_number text,
    ADD COLUMN IF NOT EXISTS last_login timestamptz,
    ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'reader',
    ADD COLUMN IF NOT EXISTS is_moderator boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS referral_code text,
    ADD COLUMN IF NOT EXISTS referred_by text,
    ADD COLUMN IF NOT EXISTS referral_earnings_kas numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS active_referrals integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'inactive',
    ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
    ADD COLUMN IF NOT EXISTS subscription_plan text,
    ADD COLUMN IF NOT EXISTS translation_credits integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS author_bio text,
    ADD COLUMN IF NOT EXISTS author_experience text,
    ADD COLUMN IF NOT EXISTS author_genres text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS author_motivation text,
    ADD COLUMN IF NOT EXISTS author_sample_work text,
    ADD COLUMN IF NOT EXISTS author_social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS author_application_status text DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS author_tier text,
    ADD COLUMN IF NOT EXISTS royalty_percentage numeric,
    ADD COLUMN IF NOT EXISTS qualified_sales integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS author_total_sales integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sub uuid NOT NULL;

ALTER TABLE public.users
    ADD CONSTRAINT IF NOT EXISTS users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_subscription_status_check'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_subscription_status_check
            CHECK (subscription_status = ANY (ARRAY['inactive'::text, 'active'::text, 'cancelled'::text, 'expired'::text, 'past_due'::text]));
    END IF;
END $$;

-- =================================================================
-- 2. Таблица книг
-- =================================================================
CREATE TABLE IF NOT EXISTS public.books (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    author_id uuid,
    author_email text,
    author text,
    title text NOT NULL,
    description text,
    preview_text text,
    file_url text,
    cover_images jsonb NOT NULL DEFAULT '{}'::jsonb,
    genre text,
    genres text[] NOT NULL DEFAULT '{}'::text[],
    languages jsonb NOT NULL DEFAULT '[]'::jsonb,
    mood text,
    price_kas numeric,
    price_usd numeric,
    is_usd_fixed boolean NOT NULL DEFAULT false,
    is_public_domain boolean NOT NULL DEFAULT false,
    is_in_subscription boolean NOT NULL DEFAULT false,
    is_editors_pick boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'pending',
    rejection_info jsonb,
    rejection_reason text,
    moderator_email text,
    qualified_sale boolean NOT NULL DEFAULT true,
    is_qualified_for_royalty_tiers boolean NOT NULL DEFAULT true,
    sales_count integer NOT NULL DEFAULT 0,
    likes_count integer NOT NULL DEFAULT 0,
    reviews_count integer NOT NULL DEFAULT 0,
    rating numeric NOT NULL DEFAULT 0,
    ai_rating numeric,
    ai_evaluation_text text,
    page_count integer,
    views integer NOT NULL DEFAULT 0,
    reading_time_minutes integer,
    translated_languages text[] NOT NULL DEFAULT '{}'::text[],
    tags text[] NOT NULL DEFAULT '{}'::text[],
    drm_watermark boolean NOT NULL DEFAULT true,
    publication_date date,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT books_pkey PRIMARY KEY (id)
);

ALTER TABLE public.books
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_by uuid,
    ADD COLUMN IF NOT EXISTS author_id uuid,
    ADD COLUMN IF NOT EXISTS author_email text,
    ADD COLUMN IF NOT EXISTS author text,
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS preview_text text,
    ADD COLUMN IF NOT EXISTS file_url text,
    ADD COLUMN IF NOT EXISTS cover_images jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS genre text,
    ADD COLUMN IF NOT EXISTS genres text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS languages jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS mood text,
    ADD COLUMN IF NOT EXISTS price_kas numeric,
    ADD COLUMN IF NOT EXISTS price_usd numeric,
    ADD COLUMN IF NOT EXISTS is_usd_fixed boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_public_domain boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_in_subscription boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_editors_pick boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS rejection_info jsonb,
    ADD COLUMN IF NOT EXISTS rejection_reason text,
    ADD COLUMN IF NOT EXISTS moderator_email text,
    ADD COLUMN IF NOT EXISTS qualified_sale boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS is_qualified_for_royalty_tiers boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS sales_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reviews_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_rating numeric,
    ADD COLUMN IF NOT EXISTS ai_evaluation_text text,
    ADD COLUMN IF NOT EXISTS page_count integer,
    ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reading_time_minutes integer,
    ADD COLUMN IF NOT EXISTS translated_languages text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS drm_watermark boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS publication_date date,
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.books
    ADD CONSTRAINT IF NOT EXISTS books_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.books
    ADD CONSTRAINT IF NOT EXISTS books_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
ALTER TABLE public.books
    ADD CONSTRAINT IF NOT EXISTS books_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'books_status_check'
    ) THEN
        ALTER TABLE public.books
            ADD CONSTRAINT books_status_check
            CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'public_domain'::text]));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'books_rating_check'
    ) THEN
        ALTER TABLE public.books
            ADD CONSTRAINT books_rating_check
            CHECK (rating >= 0::numeric AND rating <= 5::numeric);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'books_ai_rating_check'
    ) THEN
        ALTER TABLE public.books
            ADD CONSTRAINT books_ai_rating_check
            CHECK (ai_rating >= 0::numeric AND ai_rating <= 5::numeric);
    END IF;
END $$;

-- =================================================================
-- 3. Таблица покупок
-- =================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    book_id uuid NOT NULL,
    buyer_email text NOT NULL,
    buyer_user_id uuid,
    seller_email text NOT NULL,
    seller_user_id uuid,
    purchase_type text NOT NULL DEFAULT 'primary',
    price_kas numeric NOT NULL,
    price_usd numeric,
    transaction_hash text,
    author_payout_kas numeric,
    platform_fee_kas numeric,
    referral_commission_kas numeric,
    author_referral_bonus_kas numeric,
    referrer_email text,
    royalty_amount numeric,
    seller_payout numeric,
    is_qualified_sale boolean NOT NULL DEFAULT true,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT purchases_pkey PRIMARY KEY (id)
);

ALTER TABLE public.purchases
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS buyer_user_id uuid,
    ADD COLUMN IF NOT EXISTS seller_user_id uuid,
    ADD COLUMN IF NOT EXISTS price_usd numeric,
    ADD COLUMN IF NOT EXISTS referral_commission_kas numeric,
    ADD COLUMN IF NOT EXISTS author_referral_bonus_kas numeric,
    ADD COLUMN IF NOT EXISTS referrer_email text,
    ADD COLUMN IF NOT EXISTS royalty_amount numeric,
    ADD COLUMN IF NOT EXISTS seller_payout numeric,
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.purchases
    ADD CONSTRAINT IF NOT EXISTS purchases_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.purchases
    ADD CONSTRAINT IF NOT EXISTS purchases_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);
ALTER TABLE public.purchases
    ADD CONSTRAINT IF NOT EXISTS purchases_buyer_user_id_fkey FOREIGN KEY (buyer_user_id) REFERENCES public.users(id);
ALTER TABLE public.purchases
    ADD CONSTRAINT IF NOT EXISTS purchases_seller_user_id_fkey FOREIGN KEY (seller_user_id) REFERENCES public.users(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchases_purchase_type_check'
    ) THEN
        ALTER TABLE public.purchases
            ADD CONSTRAINT purchases_purchase_type_check
            CHECK (purchase_type = ANY (ARRAY['primary'::text, 'resale'::text, 'subscription'::text]));
    END IF;
END $$;

-- =================================================================
-- 4. Таблица отзывов
-- =================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    book_id uuid NOT NULL,
    reviewer_email text NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    helpful_votes integer NOT NULL DEFAULT 0,
    likes text[] NOT NULL DEFAULT '{}'::text[],
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT reviews_pkey PRIMARY KEY (id)
);

ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS likes text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.reviews
    ADD CONSTRAINT IF NOT EXISTS reviews_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.reviews
    ADD CONSTRAINT IF NOT EXISTS reviews_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reviews_rating_check'
    ) THEN
        ALTER TABLE public.reviews
            ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reviews_status_check'
    ) THEN
        ALTER TABLE public.reviews
            ADD CONSTRAINT reviews_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));
    END IF;
END $$;

-- =================================================================
-- 5. Таблица объявлений о перепродаже
-- =================================================================
CREATE TABLE IF NOT EXISTS public.resale_listings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    book_id uuid NOT NULL,
    seller_email text NOT NULL,
    seller_user_id uuid,
    price_kas numeric NOT NULL,
    status text NOT NULL DEFAULT 'active',
    original_purchase_id uuid,
    nft_token_id text,
    royalty_percentage numeric,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT resale_listings_pkey PRIMARY KEY (id)
);

ALTER TABLE public.resale_listings
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS seller_user_id uuid,
    ADD COLUMN IF NOT EXISTS original_purchase_id uuid,
    ADD COLUMN IF NOT EXISTS royalty_percentage numeric,
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.resale_listings
    ADD CONSTRAINT IF NOT EXISTS resale_listings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.resale_listings
    ADD CONSTRAINT IF NOT EXISTS resale_listings_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);
ALTER TABLE public.resale_listings
    ADD CONSTRAINT IF NOT EXISTS resale_listings_seller_user_id_fkey FOREIGN KEY (seller_user_id) REFERENCES public.users(id);
ALTER TABLE public.resale_listings
    ADD CONSTRAINT IF NOT EXISTS resale_listings_original_purchase_id_fkey FOREIGN KEY (original_purchase_id) REFERENCES public.purchases(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'resale_listings_status_check'
    ) THEN
        ALTER TABLE public.resale_listings
            ADD CONSTRAINT resale_listings_status_check
            CHECK (status = ANY (ARRAY['active'::text, 'sold'::text, 'cancelled'::text]));
    END IF;
END $$;

-- =================================================================
-- 6. AI рекомендации
-- =================================================================
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    user_email text NOT NULL,
    user_id uuid,
    query text NOT NULL,
    query_type text,
    recommended_books jsonb NOT NULL DEFAULT '[]'::jsonb,
    recommendation_reason text,
    confidence_score numeric,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id)
);

ALTER TABLE public.ai_recommendations
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS user_id uuid,
    ADD COLUMN IF NOT EXISTS query_type text,
    ADD COLUMN IF NOT EXISTS recommendation_reason text,
    ADD COLUMN IF NOT EXISTS confidence_score numeric,
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.ai_recommendations
    ADD CONSTRAINT IF NOT EXISTS ai_recommendations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.ai_recommendations
    ADD CONSTRAINT IF NOT EXISTS ai_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_recommendations_query_type_check'
    ) THEN
        ALTER TABLE public.ai_recommendations
            ADD CONSTRAINT ai_recommendations_query_type_check
            CHECK (query_type = ANY (ARRAY['genre'::text, 'mood'::text, 'similar'::text, 'general'::text, 'personalized'::text]));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_recommendations_confidence_score_check'
    ) THEN
        ALTER TABLE public.ai_recommendations
            ADD CONSTRAINT ai_recommendations_confidence_score_check
            CHECK (confidence_score >= 0::numeric AND confidence_score <= 1::numeric);
    END IF;
END $$;

-- =================================================================
-- 7. Пользовательские данные по книгам
-- =================================================================
CREATE TABLE IF NOT EXISTS public.user_book_data (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    user_email text NOT NULL,
    user_id uuid,
    book_id uuid NOT NULL,
    current_page integer NOT NULL DEFAULT 1,
    total_pages integer NOT NULL DEFAULT 1,
    last_page_read integer,
    reading_progress integer NOT NULL DEFAULT 0,
    started_reading_at timestamptz,
    last_read_at timestamptz,
    total_reading_time integer NOT NULL DEFAULT 0,
    reading_sessions jsonb NOT NULL DEFAULT '[]'::jsonb,
    notes jsonb NOT NULL DEFAULT '[]'::jsonb,
    bookmarks jsonb NOT NULL DEFAULT '[]'::jsonb,
    highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
    tts_voice text NOT NULL DEFAULT 'default',
    tts_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT user_book_data_pkey PRIMARY KEY (id)
);

ALTER TABLE public.user_book_data
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS user_id uuid,
    ADD COLUMN IF NOT EXISTS current_page integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS total_pages integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS last_page_read integer,
    ADD COLUMN IF NOT EXISTS total_reading_time integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reading_sessions jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS notes jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS bookmarks jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.user_book_data
    ADD CONSTRAINT IF NOT EXISTS user_book_data_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.user_book_data
    ADD CONSTRAINT IF NOT EXISTS user_book_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.user_book_data
    ADD CONSTRAINT IF NOT EXISTS user_book_data_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_book_data_reading_progress_check'
    ) THEN
        ALTER TABLE public.user_book_data
            ADD CONSTRAINT user_book_data_reading_progress_check
            CHECK (reading_progress >= 0 AND reading_progress <= 100);
    END IF;
END $$;

-- =================================================================
-- 8. Пользовательские рейтинги книг
-- =================================================================
CREATE TABLE IF NOT EXISTS public.user_book_ratings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    user_email text NOT NULL,
    user_id uuid,
    book_id uuid NOT NULL,
    ai_rating numeric,
    rating_source text,
    generated_review text,
    generated_reason text,
    confidence numeric,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT user_book_ratings_pkey PRIMARY KEY (id)
);

ALTER TABLE public.user_book_ratings
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS user_id uuid,
    ADD COLUMN IF NOT EXISTS ai_rating numeric,
    ADD COLUMN IF NOT EXISTS rating_source text,
    ADD COLUMN IF NOT EXISTS generated_review text,
    ADD COLUMN IF NOT EXISTS generated_reason text,
    ADD COLUMN IF NOT EXISTS confidence numeric,
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.user_book_ratings
    ADD CONSTRAINT IF NOT EXISTS user_book_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.user_book_ratings
    ADD CONSTRAINT IF NOT EXISTS user_book_ratings_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_book_ratings_ai_rating_check'
    ) THEN
        ALTER TABLE public.user_book_ratings
            ADD CONSTRAINT user_book_ratings_ai_rating_check
            CHECK (ai_rating >= 0::numeric AND ai_rating <= 5::numeric);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_book_ratings_confidence_check'
    ) THEN
        ALTER TABLE public.user_book_ratings
            ADD CONSTRAINT user_book_ratings_confidence_check
            CHECK (confidence >= 0::numeric AND confidence <= 1::numeric);
    END IF;
END $$;

-- =================================================================
-- 9. Платежи
-- =================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    payment_id text NOT NULL UNIQUE,
    order_id text NOT NULL,
    user_email text NOT NULL,
    user_id uuid,
    books jsonb NOT NULL DEFAULT '[]'::jsonb,
    amount_usd numeric NOT NULL,
    amount_kas numeric NOT NULL,
    status text NOT NULL,
    payment_method text NOT NULL DEFAULT 'nowpayments_kas',
    nowpayments_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    completed_at timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT payments_pkey PRIMARY KEY (id)
);

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS user_id uuid,
    ADD COLUMN IF NOT EXISTS books jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'nowpayments_kas',
    ADD COLUMN IF NOT EXISTS nowpayments_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.payments
    ADD CONSTRAINT IF NOT EXISTS payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

-- =================================================================
-- 10. Валютные курсы
-- =================================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamptz NOT NULL DEFAULT now(),
    currency_pair text NOT NULL UNIQUE,
    rate numeric NOT NULL,
    CONSTRAINT exchange_rates_pkey PRIMARY KEY (id)
);

-- =================================================================
-- 11. Конфигурация системы
-- =================================================================
CREATE TABLE IF NOT EXISTS public.system_config (
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT system_config_pkey PRIMARY KEY (key)
);

-- =================================================================
-- 12. Лайки заметок
-- =================================================================
CREATE TABLE IF NOT EXISTS public.note_likes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    user_email text NOT NULL,
    user_id uuid,
    shared_note_id uuid NOT NULL,
    CONSTRAINT note_likes_pkey PRIMARY KEY (id)
);

ALTER TABLE public.note_likes
    ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.note_likes
    ADD CONSTRAINT IF NOT EXISTS note_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.note_likes
    ADD CONSTRAINT IF NOT EXISTS note_likes_shared_note_id_fkey FOREIGN KEY (shared_note_id) REFERENCES public.shared_notes(id);

-- =================================================================
-- 13. Платежные транзакции по рефералам
-- =================================================================
CREATE TABLE IF NOT EXISTS public.referral_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    referrer_email text NOT NULL,
    referrer_user_id uuid,
    referee_email text NOT NULL,
    referee_user_id uuid,
    purchase_id uuid,
    book_id uuid,
    book_author_email text,
    purchase_amount_kas numeric NOT NULL DEFAULT 0,
    referrer_commission_kas numeric NOT NULL DEFAULT 0,
    author_referral_bonus_kas numeric NOT NULL DEFAULT 0,
    commission_rate numeric,
    transaction_type text,
    processed boolean NOT NULL DEFAULT false,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT referral_transactions_pkey PRIMARY KEY (id)
);

ALTER TABLE public.referral_transactions
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS referrer_user_id uuid,
    ADD COLUMN IF NOT EXISTS referee_user_id uuid,
    ADD COLUMN IF NOT EXISTS purchase_id uuid,
    ADD COLUMN IF NOT EXISTS book_id uuid,
    ADD COLUMN IF NOT EXISTS book_author_email text,
    ADD COLUMN IF NOT EXISTS purchase_amount_kas numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS referrer_commission_kas numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS author_referral_bonus_kas numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_rate numeric,
    ADD COLUMN IF NOT EXISTS transaction_type text,
    ADD COLUMN IF NOT EXISTS processed boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.referral_transactions
    ADD CONSTRAINT IF NOT EXISTS referral_transactions_referrer_user_id_fkey FOREIGN KEY (referrer_user_id) REFERENCES public.users(id);
ALTER TABLE public.referral_transactions
    ADD CONSTRAINT IF NOT EXISTS referral_transactions_referee_user_id_fkey FOREIGN KEY (referee_user_id) REFERENCES public.users(id);
ALTER TABLE public.referral_transactions
    ADD CONSTRAINT IF NOT EXISTS referral_transactions_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);
ALTER TABLE public.referral_transactions
    ADD CONSTRAINT IF NOT EXISTS referral_transactions_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'referral_transactions_commission_rate_check'
    ) THEN
        ALTER TABLE public.referral_transactions
            ADD CONSTRAINT referral_transactions_commission_rate_check
            CHECK (commission_rate >= 0::numeric AND commission_rate <= 100::numeric);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'referral_transactions_transaction_type_check'
    ) THEN
        ALTER TABLE public.referral_transactions
            ADD CONSTRAINT referral_transactions_transaction_type_check
            CHECK (transaction_type = ANY (ARRAY['regular_referral'::text, 'author_own_book'::text, 'bonus'::text, 'manual_adjustment'::text]));
    END IF;
END $$;

-- =================================================================
-- 14. Общие заметки пользователей
-- =================================================================
CREATE TABLE IF NOT EXISTS public.shared_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    user_email text NOT NULL,
    user_id uuid,
    user_name text,
    book_id uuid NOT NULL,
    book_title text,
    book_author text,
    book_genre text,
    note_text text,
    selected_text text,
    highlight_color text,
    page_number integer,
    likes_count integer NOT NULL DEFAULT 0,
    comments_count integer NOT NULL DEFAULT 0,
    is_public boolean NOT NULL DEFAULT true,
    language text,
    tags text[] NOT NULL DEFAULT '{}'::text[],
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT shared_notes_pkey PRIMARY KEY (id)
);

ALTER TABLE public.shared_notes
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS user_id uuid,
    ADD COLUMN IF NOT EXISTS user_name text,
    ADD COLUMN IF NOT EXISTS book_title text,
    ADD COLUMN IF NOT EXISTS book_author text,
    ADD COLUMN IF NOT EXISTS book_genre text,
    ADD COLUMN IF NOT EXISTS note_text text,
    ADD COLUMN IF NOT EXISTS selected_text text,
    ADD COLUMN IF NOT EXISTS highlight_color text,
    ADD COLUMN IF NOT EXISTS page_number integer,
    ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS language text,
    ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.shared_notes
    ADD CONSTRAINT IF NOT EXISTS shared_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.shared_notes
    ADD CONSTRAINT IF NOT EXISTS shared_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.shared_notes
    ADD CONSTRAINT IF NOT EXISTS shared_notes_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);

-- =================================================================
-- 15. Предпочтения ИИ пользователей
-- =================================================================
CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    user_email text NOT NULL UNIQUE,
    user_id uuid,
    favorite_genres text[] NOT NULL DEFAULT '{}'::text[],
    favorite_books text,
    reading_preferences text,
    disliked_elements text[] NOT NULL DEFAULT '{}'::text[],
    preferred_book_length text,
    mood_preferences text[] NOT NULL DEFAULT '{}'::text[],
    preferred_languages text[] NOT NULL DEFAULT '{}'::text[],
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT user_ai_preferences_pkey PRIMARY KEY (id)
);

ALTER TABLE public.user_ai_preferences
    ADD COLUMN IF NOT EXISTS user_id uuid,
    ADD COLUMN IF NOT EXISTS favorite_genres text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS favorite_books text,
    ADD COLUMN IF NOT EXISTS reading_preferences text,
    ADD COLUMN IF NOT EXISTS disliked_elements text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS preferred_book_length text,
    ADD COLUMN IF NOT EXISTS mood_preferences text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS preferred_languages text[] NOT NULL DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.user_ai_preferences
    ADD CONSTRAINT IF NOT EXISTS user_ai_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

-- =================================================================
-- 16. Индексы
-- =================================================================
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
