export const fixedDatabaseScript = `
-- =================================================================
-- KASBOOK - ИСПРАВЛЕННЫЙ скрипт настройки БД с RLS, индексами и триггерами
-- Устраняет ошибки: 42601 syntax error at or near "FOR"
-- =================================================================

BEGIN;

-- === ЧАСТЬ 1: ВКЛЮЧЕНИЕ RLS ===
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_book_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- === ЧАСТЬ 2: ПОЛИТИКИ БЕЗОПАСНОСТИ ===

-- Удаляем существующие политики
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admin can manage users" ON public.users;
DROP POLICY IF EXISTS "Books visible if approved or own" ON public.books;
DROP POLICY IF EXISTS "Authors can insert books" ON public.books;
DROP POLICY IF EXISTS "Authors can update own books" ON public.books;
DROP POLICY IF EXISTS "Reviews visible if approved" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can see own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can manage own reading data" ON public.user_book_data;

-- Users policies - ИСПРАВЛЕНО
CREATE POLICY "Users can read own data" ON public.users 
FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can manage users" ON public.users
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);

-- Books policies - ИСПРАВЛЕНО
CREATE POLICY "Books visible if approved or own" ON public.books 
FOR SELECT USING (
    status = 'approved' 
    OR author_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Authors can insert books" ON public.books 
FOR INSERT WITH CHECK (
    author_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
);

CREATE POLICY "Authors can update own books" ON public.books 
FOR UPDATE USING (
    author_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'moderator')
    )
);

-- Reviews policies - ИСПРАВЛЕНО  
CREATE POLICY "Reviews visible if approved" ON public.reviews 
FOR SELECT USING (
    status = 'approved'
    OR reviewer_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Users can insert reviews" ON public.reviews 
FOR INSERT WITH CHECK (
    reviewer_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own reviews" ON public.reviews 
FOR UPDATE USING (
    reviewer_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'moderator')
    )
);

-- Purchases policies - ИСПРАВЛЕНО
CREATE POLICY "Users can see own purchases" ON public.purchases 
FOR SELECT USING (
    buyer_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
    OR seller_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);

-- User book data policies - ИСПРАВЛЕНО
CREATE POLICY "Users can manage own reading data" ON public.user_book_data 
FOR ALL USING (
    user_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
);

-- Payments policies
CREATE POLICY "Users can see own payments" ON public.payments 
FOR SELECT USING (
    user_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);

CREATE POLICY "Users can insert own payments" ON public.payments 
FOR INSERT WITH CHECK (
    user_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
);

-- AI recommendations policies
CREATE POLICY "Users can manage own AI recommendations" ON public.ai_recommendations 
FOR ALL USING (
    user_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
);

-- Resale listings policies
CREATE POLICY "Users can manage own resale listings" ON public.resale_listings 
FOR ALL USING (
    seller_email = (
        SELECT email FROM public.users WHERE id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);

-- === ЧАСТЬ 3: ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ ===

-- Books indexes
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_genre ON public.books(genre);
CREATE INDEX IF NOT EXISTS idx_books_author_email ON public.books(author_email);
CREATE INDEX IF NOT EXISTS idx_books_moderator_email ON public.books(moderator_email);
CREATE INDEX IF NOT EXISTS idx_books_created_at_desc ON public.books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_updated_at_desc ON public.books(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_rating_desc ON public.books(rating DESC);
CREATE INDEX IF NOT EXISTS idx_books_sales_count_desc ON public.books(sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_books_likes_count_desc ON public.books(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_books_price_kas ON public.books(price_kas);
CREATE INDEX IF NOT EXISTS idx_books_compound_status_genre ON public.books(status, genre);
CREATE INDEX IF NOT EXISTS idx_books_compound_status_created ON public.books(status, created_at DESC);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON public.reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON public.reviews(reviewer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_votes_desc ON public.reviews(helpful_votes DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at_desc ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_likes_gin ON public.reviews USING gin (likes);
CREATE INDEX IF NOT EXISTS idx_reviews_comment_search ON public.reviews USING gin (to_tsvector('russian', comment));

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_book_id ON public.purchases(book_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON public.purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_seller_email ON public.purchases(seller_email);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at_desc ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_qualified_sale ON public.purchases(is_qualified_sale);

-- User book data indexes
CREATE INDEX IF NOT EXISTS idx_user_book_data_user_email ON public.user_book_data(user_email);
CREATE INDEX IF NOT EXISTS idx_user_book_data_book_id ON public.user_book_data(book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_data_last_sync ON public.user_book_data(last_sync);
CREATE INDEX IF NOT EXISTS idx_user_book_data_last_sync_attempt ON public.user_book_data(last_sync_attempt);
CREATE INDEX IF NOT EXISTS idx_user_book_data_reading_progress ON public.user_book_data(reading_progress DESC);
CREATE INDEX IF NOT EXISTS idx_user_book_data_compound ON public.user_book_data(user_email, book_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_email ON public.payments(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at_desc ON public.payments(created_at DESC);

-- AI recommendations indexes
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_email ON public.ai_recommendations(user_email);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_query_type ON public.ai_recommendations(query_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created_at_desc ON public.ai_recommendations(created_at DESC);

-- Exchange rates indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_pair ON public.exchange_rates(currency_pair);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_created_at_desc ON public.exchange_rates(created_at DESC);

-- === ЧАСТЬ 4: ФУНКЦИИ И ТРИГГЕРЫ ===

-- Function для обновления updated_at - БЕЗОПАСНАЯ
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Триггеры для updated_at - БЕЗОПАСНЫЕ
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

DROP TRIGGER IF EXISTS trigger_user_book_data_updated_at ON public.user_book_data;
CREATE TRIGGER trigger_user_book_data_updated_at 
    BEFORE UPDATE ON public.user_book_data 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function для обновления helpful_votes - БЕЗОПАСНАЯ
CREATE OR REPLACE FUNCTION public.update_helpful_votes()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    NEW.helpful_votes = jsonb_array_length(COALESCE(NEW.likes, '[]'::jsonb));
    RETURN NEW;
END;
$$;

-- Триггер для обновления helpful_votes - БЕЗОПАСНЫЙ
DROP TRIGGER IF EXISTS trigger_reviews_helpful_votes ON public.reviews;
CREATE TRIGGER trigger_reviews_helpful_votes 
    BEFORE INSERT OR UPDATE ON public.reviews 
    FOR EACH ROW EXECUTE FUNCTION public.update_helpful_votes();

-- Function для обновления likes_count в books - БЕЗОПАСНАЯ
CREATE OR REPLACE FUNCTION public.update_book_likes_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- Обновляем likes_count для затронутой книги
    IF TG_OP = 'DELETE' THEN
        UPDATE public.books 
        SET likes_count = COALESCE((
            SELECT SUM(helpful_votes) 
            FROM public.reviews 
            WHERE book_id = OLD.book_id AND status = 'approved'
        ), 0)
        WHERE id = OLD.book_id;
        RETURN OLD;
    ELSE
        UPDATE public.books 
        SET likes_count = COALESCE((
            SELECT SUM(helpful_votes) 
            FROM public.reviews 
            WHERE book_id = NEW.book_id AND status = 'approved'
        ), 0)
        WHERE id = NEW.book_id;
        
        -- Если book_id изменился, обновляем и старую книгу
        IF TG_OP = 'UPDATE' AND OLD.book_id IS DISTINCT FROM NEW.book_id THEN
            UPDATE public.books 
            SET likes_count = COALESCE((
                SELECT SUM(helpful_votes) 
                FROM public.reviews 
                WHERE book_id = OLD.book_id AND status = 'approved'
            ), 0)
            WHERE id = OLD.book_id;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$;

-- Триггер для обновления likes_count - БЕЗОПАСНЫЙ
DROP TRIGGER IF EXISTS trigger_reviews_book_likes ON public.reviews;
CREATE TRIGGER trigger_reviews_book_likes 
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews 
    FOR EACH ROW EXECUTE FUNCTION public.update_book_likes_count();

-- Function для обновления reviews_count и rating - БЕЗОПАСНАЯ
CREATE OR REPLACE FUNCTION public.update_book_reviews_stats()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- Обновляем статистику для затронутой книги
    IF TG_OP = 'DELETE' THEN
        UPDATE public.books 
        SET 
            reviews_count = COALESCE((
                SELECT COUNT(*) 
                FROM public.reviews 
                WHERE book_id = OLD.book_id AND status = 'approved'
            ), 0),
            rating = COALESCE((
                SELECT ROUND(AVG(rating)::numeric, 2)
                FROM public.reviews 
                WHERE book_id = OLD.book_id AND status = 'approved'
            ), 0.0)
        WHERE id = OLD.book_id;
        RETURN OLD;
    ELSE
        UPDATE public.books 
        SET 
            reviews_count = COALESCE((
                SELECT COUNT(*) 
                FROM public.reviews 
                WHERE book_id = NEW.book_id AND status = 'approved'
            ), 0),
            rating = COALESCE((
                SELECT ROUND(AVG(rating)::numeric, 2)
                FROM public.reviews 
                WHERE book_id = NEW.book_id AND status = 'approved'
            ), 0.0)
        WHERE id = NEW.book_id;
        
        -- Если book_id изменился, обновляем и старую книгу
        IF TG_OP = 'UPDATE' AND OLD.book_id IS DISTINCT FROM NEW.book_id THEN
            UPDATE public.books 
            SET 
                reviews_count = COALESCE((
                    SELECT COUNT(*) 
                    FROM public.reviews 
                    WHERE book_id = OLD.book_id AND status = 'approved'
                ), 0),
                rating = COALESCE((
                    SELECT ROUND(AVG(rating)::numeric, 2)
                    FROM public.reviews 
                    WHERE book_id = OLD.book_id AND status = 'approved'
                ), 0.0)
            WHERE id = OLD.book_id;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$;

-- Триггер для reviews_count и rating - БЕЗОПАСНЫЙ
DROP TRIGGER IF EXISTS trigger_reviews_book_stats ON public.reviews;
CREATE TRIGGER trigger_reviews_book_stats 
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews 
    FOR EACH ROW EXECUTE FUNCTION public.update_book_reviews_stats();

-- Function для обновления sales_count - БЕЗОПАСНАЯ
CREATE OR REPLACE FUNCTION public.update_book_sales_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.books 
    SET sales_count = COALESCE((
        SELECT COUNT(*) 
        FROM public.purchases 
        WHERE book_id = NEW.book_id
    ), 0)
    WHERE id = NEW.book_id;
    RETURN NEW;
END;
$$;

-- Триггер для sales_count - БЕЗОПАСНЫЙ
DROP TRIGGER IF EXISTS trigger_purchases_book_sales ON public.purchases;
CREATE TRIGGER trigger_purchases_book_sales 
    AFTER INSERT ON public.purchases 
    FOR EACH ROW EXECUTE FUNCTION public.update_book_sales_count();

-- Function для обновления last_sync - БЕЗОПАСНАЯ
CREATE OR REPLACE FUNCTION public.update_last_sync()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    NEW.last_sync = NOW();
    RETURN NEW;
END;
$$;

-- Триггер для last_sync - БЕЗОПАСНЫЙ
DROP TRIGGER IF EXISTS trigger_user_book_data_sync ON public.user_book_data;
CREATE TRIGGER trigger_user_book_data_sync 
    BEFORE UPDATE ON public.user_book_data 
    FOR EACH ROW EXECUTE FUNCTION public.update_last_sync();

-- === ЧАСТЬ 5: ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ДАННЫХ ===

-- Безопасно обновляем helpful_votes для существующих отзывов
UPDATE public.reviews 
SET helpful_votes = jsonb_array_length(COALESCE(likes, '[]'::jsonb))
WHERE likes IS NOT NULL;

-- Безопасно обновляем likes_count для существующих книг
UPDATE public.books 
SET likes_count = COALESCE((
    SELECT SUM(helpful_votes) 
    FROM public.reviews 
    WHERE book_id = books.id AND status = 'approved'
), 0);

-- Безопасно обновляем reviews_count для существующих книг
UPDATE public.books 
SET reviews_count = COALESCE((
    SELECT COUNT(*) 
    FROM public.reviews 
    WHERE book_id = books.id AND status = 'approved'
), 0);

-- Безопасно обновляем rating для существующих книг
UPDATE public.books 
SET rating = COALESCE((
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM public.reviews 
    WHERE book_id = books.id AND status = 'approved'
), 0.0);

-- Безопасно обновляем sales_count для существующих книг
UPDATE public.books 
SET sales_count = COALESCE((
    SELECT COUNT(*) 
    FROM public.purchases 
    WHERE book_id = books.id
), 0);

COMMIT;

-- Анализируем таблицы для обновления статистики планировщика
ANALYZE public.users;
ANALYZE public.books;
ANALYZE public.reviews;
ANALYZE public.purchases;
ANALYZE public.user_book_data;
ANALYZE public.payments;
ANALYZE public.resale_listings;
ANALYZE public.ai_recommendations;
ANALYZE public.exchange_rates;
`;

export default function DatabaseRLSIndexesTriggersFix() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-red-600">ИСПРАВЛЕННЫЙ База данных скрипт</h2>
      
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Ошибки исправлены</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Основные исправления:</p>
              <ul className="list-disc list-inside mt-1">
                <li><strong>Строка 29:</strong> Исправлена ошибка синтаксиса в политике FOR UPDATE</li>
                <li><strong>Auth функции:</strong> Правильное использование auth.uid() и email lookup</li>
                <li><strong>Безопасность:</strong> Добавлены SECURITY DEFINER и SET search_path</li>
                <li><strong>IF EXISTS:</strong> Добавлены проверки существования таблиц</li>
                <li><strong>Округления:</strong> Исправлены функции округления для rating</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <h3 className="text-sm font-medium text-green-800 mb-2">Инструкции по применению:</h3>
        <ol className="list-decimal list-inside text-sm text-green-700 space-y-1">
          <li>Скопируйте весь SQL код из переменной <code className="bg-green-100 px-1 rounded">fixedDatabaseScript</code></li>
          <li>Откройте Supabase Dashboard → SQL Editor</li>
          <li>Вставьте код и нажмите <strong>"Run"</strong></li>
          <li>Дождитесь успешного выполнения (может занять 1-2 минуты)</li>
          <li>Проверьте, что все политики и триггеры созданы успешно</li>
        </ol>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Что включено в исправленную версию:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-semibold">Безопасность (RLS):</h4>
            <ul className="list-disc list-inside mt-1">
              <li>Политики для всех таблиц</li>
              <li>Правильная работа с auth.uid()</li>
              <li>Роли admin/moderator</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Производительность:</h4>
            <ul className="list-disc list-inside mt-1">
              <li>Индексы на все ключевые поля</li>
              <li>Составные индексы</li>
              <li>GIN индексы для JSONB</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Автоматизация:</h4>
            <ul className="list-disc list-inside mt-1">
              <li>Триггеры updated_at</li>
              <li>Автоподсчет статистики</li>
              <li>Синхронизация рейтингов</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Надежность:</h4>
            <ul className="list-disc list-inside mt-1">
              <li>SECURITY DEFINER функции</li>
              <li>Обработка NULL значений</li>
              <li>Безопасные обновления</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}