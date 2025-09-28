export const FullDatabaseUpdateSQL = `
-- =================================================================
-- KASBOOK - Полный скрипт обновления и настройки базы данных (v.3)
-- Описание: Этот скрипт обновляет существующую схему, добавляет
-- недостающие колонки, создает функции, триггеры, индексы и
-- настраивает политики безопасности (RLS).
-- Он является идемпотентным и его можно безопасно выполнять повторно.
-- =================================================================

BEGIN;

-- === ЧАСТЬ 1: ФУНКЦИИ И ТРИГГЕРЫ ===

-- Line 14: Функция для автоматического обновления "updated_at"
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Line 23: Функция для обновления счетчиков и рейтинга в "books"
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

    -- Обновляем счетчики
    UPDATE public.books
    SET
        reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE book_id = v_book_id AND status = 'approved'),
        rating = COALESCE((SELECT AVG(rating) FROM public.reviews WHERE book_id = v_book_id AND status = 'approved'), 0),
        sales_count = (SELECT COUNT(*) FROM public.purchases WHERE book_id = v_book_id)
    WHERE id = v_book_id;

    RETURN NULL; -- Результат триггера не важен
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Line 50: Применение триггеров
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_book_related_change_reviews ON public.reviews;
CREATE TRIGGER on_book_related_change_reviews
  AFTER INSERT OR UPDATE OF status, rating OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.update_book_stats();

DROP TRIGGER IF EXISTS on_book_related_change_purchases ON public.purchases;
CREATE TRIGGER on_book_related_change_purchases
  AFTER INSERT OR DELETE ON public.purchases
  FOR EACH ROW EXECUTE PROCEDURE public.update_book_stats();
  
DROP TRIGGER IF EXISTS on_books_update ON public.books;
CREATE TRIGGER on_books_update BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- === ЧАСТЬ 2: ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ ===

-- Line 71: Индексы для "books" (улучшено)
CREATE INDEX IF NOT EXISTS idx_books_status_created_at ON public.books(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_author_email ON public.books(author_email);
CREATE INDEX IF NOT EXISTS idx_books_genre ON public.books(genre);
CREATE INDEX IF NOT EXISTS idx_books_genres_gin ON public.books USING GIN (genres);
CREATE INDEX IF NOT EXISTS idx_books_languages_gin ON public.books USING GIN (languages);

-- Line 78: Индексы для "reviews"
CREATE INDEX IF NOT EXISTS idx_reviews_book_id_status ON public.reviews(book_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON public.reviews(reviewer_email);

-- Line 82: Индексы для "purchases"
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON public.purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_seller_email ON public.purchases(seller_email);
CREATE INDEX IF NOT EXISTS idx_purchases_book_id ON public.purchases(book_id);

-- Line 87: Индексы для "user_book_data"
CREATE INDEX IF NOT EXISTS idx_user_book_data_user_book ON public.user_book_data(user_email, book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_data_last_sync ON public.user_book_data(last_sync);

-- === ЧАСТЬ 3: ПОЛИТИКИ БЕЗОПАСНОСТИ (RLS) ===

-- Line 93: Включение RLS для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_data ENABLE ROW LEVEL SECURITY;

-- Line 100: Удаляем старые политики для чистого применения
DROP POLICY IF EXISTS "Allow all users to read own data" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own data" ON public.users;
DROP POLICY IF EXISTS "Allow read access to approved books" ON public.books;
DROP POLICY IF EXISTS "Allow authors to manage own books" ON public.books;
DROP POLICY IF EXISTS "Allow moderators to see pending books" ON public.books;
DROP POLICY IF EXISTS "Allow authenticated users to insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow users to see own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Allow users to manage own book data" ON public.user_book_data;

-- Line 110: Новые, более надежные политики
-- Users
CREATE POLICY "Allow all users to read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Books
CREATE POLICY "Allow read access to approved books" ON public.books FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow authors to manage own books" ON public.books FOR ALL USING (author_email = (SELECT email FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Allow moderators to see pending books" ON public.books FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'moderator'));

-- Reviews
CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);

-- Purchases
CREATE POLICY "Allow users to see own purchases" ON public.purchases FOR SELECT USING (buyer_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- UserBookData
CREATE POLICY "Allow users to manage own book data" ON public.user_book_data FOR ALL USING (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));


COMMIT;