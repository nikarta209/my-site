
// =================================================================
// ПОЛИТИКИ БЕЗОПАСНОСТИ НА УРОВНЕ СТРОК (RLS) ДЛЯ KASBOOK
// ИНСТРУКЦИЯ: Выполняйте каждый блок SQL кода по отдельности!
// =================================================================

// =================================================================
// ШАГ 1: ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ (Выполнить один раз)
// Эта функция поможет упростить и ускорить проверку роли администратора.
// =================================================================
export const SQL_STEP_1_HELPER_FUNCTION = `
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Используем auth.email() для получения email текущего пользователя
  SELECT role INTO user_role FROM public.users WHERE email = auth.email();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// =================================================================
// ШАГ 2: ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ `books`
// =================================================================
export const SQL_STEP_2_BOOKS_RLS = `
-- 1. Включаем RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- 2. Политики
-- Публичный доступ к одобренным книгам
CREATE POLICY "Public can read approved books" ON public.books FOR SELECT USING (status = 'approved');
-- Авторы и модераторы могут видеть свои книги в любом статусе
CREATE POLICY "Owners and moderators can see their books" ON public.books FOR SELECT USING (author_email = auth.email() OR moderator_email = auth.email());
-- Авторы могут создавать книги
CREATE POLICY "Authors can insert their own books" ON public.books FOR INSERT WITH CHECK (author_email = auth.email());
-- Авторы и модераторы могут обновлять свои книги
CREATE POLICY "Authors and moderators can update their books" ON public.books FOR UPDATE USING (author_email = auth.email() OR moderator_email = auth.email());
-- Администраторы имеют полный доступ
CREATE POLICY "Admins can do anything" ON public.books FOR ALL USING (get_my_role() = 'admin');
`;

// =================================================================
// ШАГ 3: ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ `users`
// =================================================================
export const SQL_STEP_3_USERS_RLS = `
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and update their own data" ON public.users FOR ALL USING (email = auth.email());
CREATE POLICY "Admins have full access to users" ON public.users FOR ALL USING (get_my_role() = 'admin');
`;

// =================================================================
// ШАГ 4: ПОЛИТИКИ ДЛЯ ОСТАЛЬНЫХ ТАБЛИЦ
// =================================================================
export const SQL_STEP_4_OTHER_TABLES_RLS = `
-- Purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their purchases" ON public.purchases FOR ALL USING (buyer_email = auth.email() OR seller_email = auth.email());
CREATE POLICY "Admins have full access to purchases" ON public.purchases FOR ALL USING (get_my_role() = 'admin');

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can see approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can manage their own reviews" ON public.reviews FOR ALL USING (reviewer_email = auth.email());
CREATE POLICY "Admins have full access to reviews" ON public.reviews FOR ALL USING (get_my_role() = 'admin');

-- User Book Data
ALTER TABLE public.user_book_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own book data" ON public.user_book_data FOR ALL USING (user_email = auth.email());
CREATE POLICY "Admins have full access to user_book_data" ON public.user_book_data FOR ALL USING (get_my_role() = 'admin');

-- Resale Listings
ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can see active resale listings" ON public.resale_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can manage their own listings" ON public.resale_listings FOR ALL USING (seller_email = auth.email());
CREATE POLICY "Admins have full access to resale_listings" ON public.resale_listings FOR ALL USING (get_my_role() = 'admin');

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own payments" ON public.payments FOR ALL USING (user_email = auth.email());
CREATE POLICY "Admins have full access to payments" ON public.payments FOR ALL USING (get_my_role() = 'admin');

-- AI Recommendations
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own recommendations" ON public.ai_recommendations FOR ALL USING (user_email = auth.email());
CREATE POLICY "Admins have full access to ai_recommendations" ON public.ai_recommendations FOR ALL USING (get_my_role() = 'admin');

-- Exchange Rates (публичный просмотр, админское управление)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view exchange rates" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "Admins can manage exchange rates" ON public.exchange_rates FOR ALL USING (get_my_role() = 'admin');

-- System Config (только для админов)
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage system config" ON public.system_config FOR ALL USING (get_my_role() = 'admin');
`;

// =================================================================
// ШАГ 5: ПОЛИТИКИ ДЛЯ STORAGE (ХРАНИЛИЩА ФАЙЛОВ)
// Обеспечивают безопасный доступ к обложкам и файлам книг.
// =================================================================
export const SQL_STEP_5_STORAGE_RLS = `
-- --- Covers Bucket Policies (Обложки) ---

-- Публичный SELECT доступ для всех
CREATE POLICY "Public can view covers"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'covers' );

-- Авторы могут загружать/обновлять/удалять свои обложки (путь должен содержать их UID)
CREATE POLICY "Authors can manage their own covers"
  ON storage.objects FOR INSERT, UPDATE, DELETE
  USING ( bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1] )
  WITH CHECK ( bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1] );

-- --- Books Bucket Policies (Файлы книг - приватные) ---

-- Полный запрет на публичный доступ
CREATE POLICY "Book files are private"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'books' AND false );

-- Разрешаем авторам управлять файлами в их папке
CREATE POLICY "Authors can manage their book files"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1] )
  WITH CHECK ( bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1] );
`;

// =================================================================
// ШАГ 6: КОНФИГУРАЦИЯ СИСТЕМЫ
// Устанавливаем время жизни подписанных URL по умолчанию.
// =================================================================
export const SQL_STEP_6_SYSTEM_CONFIG = `
INSERT INTO public.system_config (key, value)
VALUES ('signed_url_expires_in', '{"seconds": 3600}'::jsonb)
ON CONFLICT (key) DO UPDATE
SET value = '{"seconds": 3600}'::jsonb;
`;
