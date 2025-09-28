
// =================================================================
// КРИТИЧЕСКИ ВАЖНЫЕ ИНДЕКСЫ ДЛЯ KASBOOK
// Скопируйте каждый блок отдельно и выполните в SQL Editor
// =================================================================

// =================================================================
// БЛОК 1: ОСНОВНЫЕ ИНДЕКСЫ ДЛЯ BOOKS (самые важные для производительности)
// =================================================================
export const CRITICAL_BOOKS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_books_status ON books (status);
CREATE INDEX IF NOT EXISTS idx_books_author_email ON books (author_email);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books (genre);
CREATE INDEX IF NOT EXISTS idx_books_created_at_desc ON books (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_rating_desc ON books (rating DESC);
CREATE INDEX IF NOT EXISTS idx_books_sales_count_desc ON books (sales_count DESC);
`;

// =================================================================
// БЛОК 2: ИНДЕКСЫ ДЛЯ JSONB ПОЛЕЙ (если они есть в таблицах)
// =================================================================
export const JSONB_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_books_languages_gin ON books USING gin (languages);
CREATE INDEX IF NOT EXISTS idx_books_genres_gin ON books USING gin (genres);
CREATE INDEX IF NOT EXISTS idx_users_preferred_languages_gin ON users USING gin (preferred_languages);
CREATE INDEX IF NOT EXISTS idx_users_purchase_history_gin ON users USING gin (purchase_history);
`;

// =================================================================
// БЛОК 3: ИНДЕКСЫ ДЛЯ СВЯЗАННЫХ ТАБЛИЦ
// =================================================================
export const RELATED_TABLE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_purchases_book_id ON purchases (book_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON purchases (buyer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at_desc ON purchases (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews (book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);
CREATE INDEX IF NOT EXISTS idx_user_book_data_user_email ON user_book_data (user_email);
CREATE INDEX IF NOT EXISTS idx_user_book_data_book_id ON user_book_data (book_id);
`;

// =================================================================
// БЛОК 4: КОМПОЗИТНЫЕ ИНДЕКСЫ (для сложных запросов)
// =================================================================
export const COMPOSITE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_books_status_created_at ON books (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_genre_rating ON books (genre, rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_book_id_status ON reviews (book_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email_created_at ON purchases (buyer_email, created_at DESC);
`;

// =================================================================
// ИНСТРУКЦИИ:
// 1. Выполните БЛОК 1 первым - это самые важные индексы
// 2. Если есть ошибки с JSONB полями в БЛОКЕ 2, пропустите их
// 3. БЛОК 3 и 4 выполните, если первые два прошли успешно
// =================================================================

export const USAGE_INSTRUCTIONS = `
ПОРЯДОК ВЫПОЛНЕНИЯ:
1. Скопируйте содержимое CRITICAL_BOOKS_INDEXES и выполните в SQL Editor
2. Скопируйте содержимое JSONB_INDEXES и выполните (если есть JSONB поля)
3. Скопируйте содержимое RELATED_TABLE_INDEXES и выполните
4. Скопируйте содержимое COMPOSITE_INDEXES и выполните

Если какой-то индекс выдаёт ошибку - просто пропустите его и продолжайте с остальными.
`;

// =================================================================
// ШАГ 6: ТРИГГЕРЫ (Выполнять после создания всех индексов)
// =================================================================
export const CLEAN_TRIGGERS_SQL = `
CREATE OR REPLACE FUNCTION update_book_rating() 
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE books SET 
            rating = COALESCE((
                SELECT AVG(rating) 
                FROM reviews 
                WHERE book_id = OLD.book_id AND status = 'approved'
            ), 0),
            reviews_count = COALESCE((
                SELECT COUNT(*) 
                FROM reviews 
                WHERE book_id = OLD.book_id AND status = 'approved'
            ), 0)
        WHERE id = OLD.book_id;
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF NEW.status = 'approved' OR (TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved') THEN
             UPDATE books SET 
                rating = COALESCE((
                    SELECT AVG(rating) 
                    FROM reviews 
                    WHERE book_id = NEW.book_id AND status = 'approved'
                ), 0),
                reviews_count = COALESCE((
                    SELECT COUNT(*) 
                    FROM reviews 
                    WHERE book_id = NEW.book_id AND status = 'approved'
                ), 0)
            WHERE id = NEW.book_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_review_change ON reviews;
CREATE TRIGGER after_review_change 
    AFTER INSERT OR UPDATE OR DELETE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_book_rating();

CREATE OR REPLACE FUNCTION update_sales_count() 
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE books SET 
            sales_count = COALESCE(sales_count, 0) + 1 
        WHERE id = NEW.book_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE books SET 
            sales_count = GREATEST(COALESCE(sales_count, 0) - 1, 0)
        WHERE id = OLD.book_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_purchase_change ON purchases;
CREATE TRIGGER after_purchase_change 
    AFTER INSERT OR DELETE ON purchases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_sales_count();

CREATE OR REPLACE FUNCTION update_purchase_history() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET 
        purchase_history = COALESCE(purchase_history, '[]'::jsonb) || 
        jsonb_build_object(
            'book_id', NEW.book_id,
            'date', NEW.created_at,
            'price_kas', NEW.price_kas,
            'type', NEW.purchase_type
        )
    WHERE email = NEW.buyer_email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_purchase_history_insert ON purchases;
CREATE TRIGGER after_purchase_history_insert 
    AFTER INSERT ON purchases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_purchase_history();
`;
