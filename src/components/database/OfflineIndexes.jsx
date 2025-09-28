/**
 * SQL для создания индексов для offline sync и производительности
 * Скопируйте код из offlineIndexesSQL и выполните в Supabase SQL Editor
 */

export const offlineIndexesSQL = `
-- ===== OFFLINE SYNC AND PERFORMANCE INDEXES =====
-- Добавляет индексы для оптимизации offline синхронизации и производительности

BEGIN;

-- Books table performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_status_created_desc 
ON public.books (status, created_at DESC) 
WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_genre_status_created 
ON public.books (genre, status, created_at DESC) 
WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_author_status 
ON public.books (author_email, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_search_vector 
ON public.books USING gin (to_tsvector('russian', 
  COALESCE(title, '') || ' ' || 
  COALESCE(author, '') || ' ' || 
  COALESCE(description, '')
));

-- User book data sync indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_book_data_sync_status 
ON public.user_book_data (user_email, last_sync DESC NULLS FIRST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_book_data_reading_activity 
ON public.user_book_data (user_email, last_read_at DESC NULLS LAST, reading_progress DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_book_data_composite 
ON public.user_book_data (user_email, book_id, last_sync DESC);

-- Reviews performance and sync
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_book_status_votes 
ON public.reviews (book_id, status, helpful_votes DESC) 
WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_likes_activity 
ON public.reviews USING gin (likes) 
WHERE jsonb_array_length(likes) > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_sync_timestamp 
ON public.reviews (updated_at DESC, status);

-- Purchases for library loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_buyer_timestamp 
ON public.purchases (buyer_email, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_book_buyer 
ON public.purchases (book_id, buyer_email);

-- System performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_likes_sales_rating 
ON public.books (likes_count DESC, sales_count DESC, rating DESC) 
WHERE status = 'approved';

-- User activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_activity 
ON public.users (email, updated_at DESC);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_recent_approved 
ON public.books (created_at DESC) 
WHERE status = 'approved' AND created_at >= (NOW() - INTERVAL '30 days');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_book_data_active_readers 
ON public.user_book_data (book_id, reading_progress) 
WHERE reading_progress > 0 AND last_read_at >= (NOW() - INTERVAL '7 days');

-- ===== TRIGGER FUNCTIONS FOR SYNC =====

-- Function to update last_sync timestamp automatically
CREATE OR REPLACE FUNCTION update_last_sync() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_sync = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_book_data automatic last_sync update
DROP TRIGGER IF EXISTS trigger_user_book_data_sync ON public.user_book_data;
CREATE TRIGGER trigger_user_book_data_sync
  BEFORE INSERT OR UPDATE ON public.user_book_data
  FOR EACH ROW
  EXECUTE FUNCTION update_last_sync();

-- ===== RLS POLICIES FOR OFFLINE SYNC =====

-- Ensure users can only access their own reading data
DROP POLICY IF EXISTS "Users manage own reading data" ON public.user_book_data;
CREATE POLICY "Users manage own reading data" 
ON public.user_book_data FOR ALL 
USING (
  auth.jwt() ->> 'email' = user_email OR
  auth.uid()::text = created_by::text
) 
WITH CHECK (
  auth.jwt() ->> 'email' = user_email OR
  auth.uid()::text = created_by::text
);

-- Reviews policy for sync
DROP POLICY IF EXISTS "Users manage own reviews" ON public.reviews;
CREATE POLICY "Users manage own reviews" 
ON public.reviews FOR ALL 
USING (
  status = 'approved' OR
  auth.jwt() ->> 'email' = reviewer_email OR
  auth.uid()::text = created_by::text
) 
WITH CHECK (
  auth.jwt() ->> 'email' = reviewer_email OR
  auth.uid()::text = created_by::text
);

-- ===== MAINTENANCE FUNCTIONS =====

-- Function to cleanup old sync data
CREATE OR REPLACE FUNCTION cleanup_old_sync_data(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Clean up old user book data that hasn't been accessed
  DELETE FROM public.user_book_data 
  WHERE last_read_at < (NOW() - (days_old || ' days')::INTERVAL)
    AND reading_progress = 0
    AND (notes IS NULL OR notes = '')
    AND (highlights IS NULL OR jsonb_array_length(highlights) = 0);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze sync performance
CREATE OR REPLACE FUNCTION analyze_sync_performance()
RETURNS TABLE(
  table_name TEXT,
  total_records BIGINT,
  needs_sync BIGINT,
  avg_sync_age INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'user_book_data'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE last_sync < NOW() - INTERVAL '1 hour')::BIGINT,
    AVG(NOW() - last_sync) FILTER (WHERE last_sync IS NOT NULL)
  FROM public.user_book_data
  
  UNION ALL
  
  SELECT 
    'reviews'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '1 hour')::BIGINT,
    AVG(NOW() - updated_at)
  FROM public.reviews;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ===== USAGE NOTES =====
-- Run ANALYZE after creating indexes:
-- ANALYZE public.books;
-- ANALYZE public.user_book_data;
-- ANALYZE public.reviews;
-- ANALYZE public.purchases;

-- Monitor index usage:
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_tup_read DESC;

-- Check sync performance:
-- SELECT * FROM analyze_sync_performance();

-- Cleanup old data (run periodically):
-- SELECT cleanup_old_sync_data(30);
`;

export default function OfflineIndexes() {
  return null; // Component only for storing SQL
}