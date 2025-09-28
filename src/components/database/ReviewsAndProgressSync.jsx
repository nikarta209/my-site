/**
 * @file ReviewsAndProgressSync.js
 * @description SQL скрипт для добавления системы лайков отзывов и синхронизации прогресса чтения
 * Скопируйте содержимое databaseUpdateSQL и выполните в Supabase SQL Editor
 */

export const databaseUpdateSQL = `
-- =================================================================
-- REVIEWS AND PROGRESS SYNC UPDATE (Goodreads-style)
-- Добавляем систему лайков, триггеры и индексы для производительности
-- =================================================================

BEGIN;

-- 1. ДОБАВЛЕНИЕ КОЛОНКИ ЛАЙКОВ В ТАБЛИЦУ REVIEWS
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS likes JSONB DEFAULT '[]'::jsonb;

-- Обновляем существующие записи, если колонка уже была добавлена ранее
UPDATE public.reviews 
SET likes = '[]'::jsonb 
WHERE likes IS NULL;

-- 2. СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
CREATE INDEX IF NOT EXISTS idx_reviews_likes ON public.reviews USING gin (likes);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_votes ON public.reviews (helpful_votes DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_date ON public.reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_comment_search ON public.reviews USING gin (to_tsvector('russian', comment));

-- 3. СОЗДАНИЕ ФУНКЦИИ ДЛЯ АВТООБНОВЛЕНИЯ HELPFUL_VOTES
CREATE OR REPLACE FUNCTION update_helpful_votes() 
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем helpful_votes на основе длины массива likes
    NEW.helpful_votes = jsonb_array_length(NEW.likes);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. СОЗДАНИЕ ТРИГГЕРА ДЛЯ АВТООБНОВЛЕНИЯ HELPFUL_VOTES
DROP TRIGGER IF EXISTS before_update_reviews_helpful_votes ON public.reviews;
CREATE TRIGGER before_update_reviews_helpful_votes
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    WHEN (OLD.likes IS DISTINCT FROM NEW.likes)
    EXECUTE FUNCTION update_helpful_votes();

-- 5. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ЗАПИСЕЙ
UPDATE public.reviews 
SET helpful_votes = jsonb_array_length(COALESCE(likes, '[]'::jsonb));

-- 6. ДОБАВЛЕНИЕ LIKES_COUNT В ТАБЛИЦУ BOOKS
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 7. СОЗДАНИЕ ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ LIKES_COUNT В КНИГАХ
CREATE OR REPLACE FUNCTION update_book_likes() 
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем likes_count в таблице books
    UPDATE public.books 
    SET likes_count = COALESCE((
        SELECT SUM(helpful_votes) 
        FROM public.reviews 
        WHERE book_id = NEW.book_id AND status = 'approved'
    ), 0)
    WHERE id = NEW.book_id;
    
    -- Если это UPDATE и book_id изменился, обновляем и старую книгу
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
END;
$$ LANGUAGE plpgsql;

-- 8. СОЗДАНИЕ ТРИГГЕРОВ ДЛЯ ОБНОВЛЕНИЯ LIKES_COUNT
DROP TRIGGER IF EXISTS after_reviews_insert_update_book_likes ON public.reviews;
DROP TRIGGER IF EXISTS after_reviews_update_update_book_likes ON public.reviews;
DROP TRIGGER IF EXISTS after_reviews_delete_update_book_likes ON public.reviews;

CREATE TRIGGER after_reviews_insert_update_book_likes
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_book_likes();

CREATE TRIGGER after_reviews_update_update_book_likes
    AFTER UPDATE ON public.reviews
    FOR EACH ROW
    WHEN (OLD.helpful_votes IS DISTINCT FROM NEW.helpful_votes OR OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_book_likes();

CREATE TRIGGER after_reviews_delete_update_book_likes
    AFTER DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_book_likes();

-- 9. ИНДЕКСЫ ДЛЯ BOOKS
CREATE INDEX IF NOT EXISTS idx_books_likes_count ON public.books (likes_count DESC);

-- 10. ИНИЦИАЛИЗАЦИЯ СУЩЕСТВУЮЩИХ ДАННЫХ
UPDATE public.books 
SET likes_count = COALESCE((
    SELECT SUM(helpful_votes) 
    FROM public.reviews 
    WHERE book_id = books.id AND status = 'approved'
), 0);

-- 11. ОБНОВЛЕНИЕ USER_BOOK_DATA ДЛЯ СИНХРОНИЗАЦИИ ПРОГРЕССА
ALTER TABLE public.user_book_data
ADD COLUMN IF NOT EXISTS sync_queue JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_sync_attempt TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_book_data_sync ON public.user_book_data (user_email, last_sync_attempt);
CREATE INDEX IF NOT EXISTS idx_user_book_data_progress ON public.user_book_data (reading_progress DESC);

COMMIT;
`;

export default function ReviewsAndProgressSyncComponent() {
    return null; // Компонент только для хранения SQL-скрипта
}