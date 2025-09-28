export const FixedDatabaseUpdateSQL = `
-- =================================================================
-- KASBOOK - ИСПРАВЛЕННЫЙ скрипт настройки базы данных (v.5)
-- Устраняет ошибку: policy "..." already exists
-- =================================================================

BEGIN;

-- === ЧАСТЬ 1: ФУНКЦИИ И ТРИГГЕРЫ ===

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления статистики книг
CREATE OR REPLACE FUNCTION public.update_book_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_book_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_book_id := OLD.book_id;
    ELSE
        v_book_id := NEW.book_id;
    END IF;

    -- Обновляем счетчики и рейтинг
    UPDATE public.books
    SET
        reviews_count = (
            SELECT COUNT(*) 
            FROM public.reviews 
            WHERE book_id = v_book_id AND status = 'approved'
        ),
        rating = COALESCE((
            SELECT AVG(rating) 
            FROM public.reviews 
            WHERE book_id = v_book_id AND status = 'approved'
        ), 0),
        sales_count = (
            SELECT COUNT(*) 
            FROM public.purchases 
            WHERE book_id = v_book_id
        )
    WHERE id = v_book_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для создания пользователя при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, balance_kas)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'reader',
        1000.0
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === ЧАСТЬ 2: ПРИМЕНЕНИЕ ТРИГГЕРОВ ===

-- Триггер для создания пользователя при регистрации
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Триггеры для обновления статистики книг
DROP TRIGGER IF EXISTS on_book_stats_reviews ON public.reviews;
CREATE TRIGGER on_book_stats_reviews
    AFTER INSERT OR UPDATE OF status, rating OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_book_stats();

DROP TRIGGER IF EXISTS on_book_stats_purchases ON public.purchases;
CREATE TRIGGER on_book_stats_purchases
    AFTER INSERT OR DELETE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION public.update_book_stats();

-- Триггеры для updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_books_updated_at ON public.books;
CREATE TRIGGER trigger_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON public.reviews;
CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- === ЧАСТЬ 3: ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ ===

-- Индексы для books
CREATE INDEX IF NOT EXISTS idx_books_status_created_at ON public.books(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_author_email ON public.books(author_email);
CREATE INDEX IF NOT EXISTS idx_books_genre ON public.books(genre);
CREATE INDEX IF NOT EXISTS idx_books_moderator_email ON public.books(moderator_email) WHERE moderator_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_genres_gin ON public.books USING GIN(genres);

-- Индексы для reviews
CREATE INDEX IF NOT EXISTS idx_reviews_book_id_status ON public.reviews(book_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON public.reviews(reviewer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_likes_gin ON public.reviews USING GIN(likes);

-- Индексы для purchases
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON public.purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_seller_email ON public.purchases(seller_email);
CREATE INDEX IF NOT EXISTS idx_purchases_book_id ON public.purchases(book_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);

-- Индексы для user_book_data
CREATE INDEX IF NOT EXISTS idx_user_book_data_composite ON public.user_book_data(user_email, book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_data_last_sync ON public.user_book_data(last_sync) WHERE last_sync IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_book_data_highlights_gin ON public.user_book_data USING GIN(highlights);


-- === ЧАСТЬ 4: ПОЛИТИКИ БЕЗОПАСНОСТИ (RLS) ===

-- Включаем RLS для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики, чтобы избежать конфликтов
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admin can manage users" ON public.users;
DROP POLICY IF EXISTS "Public can read approved books" ON public.books;
DROP POLICY IF EXISTS "Authors can manage own books" ON public.books;
DROP POLICY IF EXISTS "Moderators can see pending books" ON public.books;
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can see own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can manage own reading data" ON public.user_book_data;
DROP POLICY IF EXISTS "Users can see own payments" ON public.payments;

-- Политики для users
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can manage users" ON public.users FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Политики для books
CREATE POLICY "Public can read approved books" ON public.books FOR SELECT USING (status = 'approved');
CREATE POLICY "Authors can manage own books" ON public.books FOR ALL USING (author_email = (SELECT email FROM public.users WHERE id = auth.uid())) WITH CHECK (author_email = (SELECT email FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Moderators can see pending books" ON public.books FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'moderator')));

-- Политики для reviews
CREATE POLICY "Public can read approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can manage own reviews" ON public.reviews FOR ALL USING (reviewer_email = (SELECT email FROM public.users WHERE id = auth.uid())) WITH CHECK (reviewer_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Политики для purchases
CREATE POLICY "Users can see own purchases" ON public.purchases FOR SELECT USING (buyer_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Политики для user_book_data
CREATE POLICY "Users can manage own reading data" ON public.user_book_data FOR ALL USING (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Политики для payments
CREATE POLICY "Users can see own payments" ON public.payments FOR SELECT USING (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

COMMIT;

-- Сообщение об успешном завершении
SELECT 'База данных успешно обновлена!' as message;

`;