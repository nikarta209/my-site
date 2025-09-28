/**
 * Enhanced database indexes and RLS for KASBOOK
 * Copy the SQL content and run in Supabase SQL Editor
 */

export const enhancedIndexesSQL = `
-- Enhanced Database Indexes and RLS for KASBOOK
BEGIN;

-- ===== ENHANCED INDEXES =====

-- Books table indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_status_created_at 
ON public.books (status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_genre_status 
ON public.books (genre, status) WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_author_email_status 
ON public.books (author_email, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_price_range 
ON public.books (price_kas) WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_rating_desc 
ON public.books (rating DESC) WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_search_text 
ON public.books USING gin (to_tsvector('russian', title || ' ' || COALESCE(description, '') || ' ' || author));

-- User book data indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_book_data_user_progress 
ON public.user_book_data (user_email, reading_progress DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_book_data_last_read 
ON public.user_book_data (user_email, last_read_at DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_book_data_sync_queue 
ON public.user_book_data (last_sync DESC NULLS FIRST) 
WHERE last_sync IS NULL OR last_sync < (NOW() - INTERVAL '1 hour');

-- Reviews indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_book_status_helpful 
ON public.reviews (book_id, status, helpful_votes DESC) 
WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_likes_gin 
ON public.reviews USING gin (likes) 
WHERE jsonb_array_length(likes) > 0;

-- Purchases indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_buyer_date 
ON public.purchases (buyer_email, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_seller_qualified 
ON public.purchases (seller_email, is_qualified_sale, created_at DESC);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Enable RLS on all tables
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Books RLS policies
DROP POLICY IF EXISTS "Books are viewable by everyone if approved" ON public.books;
CREATE POLICY "Books are viewable by everyone if approved" 
ON public.books FOR SELECT 
USING (status = 'approved' OR auth.uid()::text = author_email);

DROP POLICY IF EXISTS "Authors can view their own books" ON public.books;
CREATE POLICY "Authors can view their own books" 
ON public.books FOR ALL 
USING (auth.jwt() ->> 'email' = author_email);

DROP POLICY IF EXISTS "Authors can insert their own books" ON public.books;
CREATE POLICY "Authors can insert their own books" 
ON public.books FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = author_email);

DROP POLICY IF EXISTS "Authors can update their own books" ON public.books;
CREATE POLICY "Authors can update their own books" 
ON public.books FOR UPDATE 
USING (auth.jwt() ->> 'email' = author_email);

-- User book data RLS
DROP POLICY IF EXISTS "Users can manage their own book data" ON public.user_book_data;
CREATE POLICY "Users can manage their own book data" 
ON public.user_book_data FOR ALL 
USING (auth.jwt() ->> 'email' = user_email);

-- Reviews RLS
DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Approved reviews are viewable by everyone" 
ON public.reviews FOR SELECT 
USING (status = 'approved' OR auth.jwt() ->> 'email' = reviewer_email);

DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
CREATE POLICY "Users can create their own reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = reviewer_email);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.jwt() ->> 'email' = reviewer_email);

-- Purchases RLS
DROP POLICY IF EXISTS "Users can view their purchases" ON public.purchases;
CREATE POLICY "Users can view their purchases" 
ON public.purchases FOR SELECT 
USING (
  auth.jwt() ->> 'email' = buyer_email OR 
  auth.jwt() ->> 'email' = seller_email
);

DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;
CREATE POLICY "Users can create purchases" 
ON public.purchases FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = buyer_email);

-- ===== HELPFUL FUNCTIONS =====

-- Function to update book stats
CREATE OR REPLACE FUNCTION update_book_stats(book_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.books 
  SET 
    likes_count = COALESCE((
      SELECT SUM(helpful_votes) 
      FROM public.reviews 
      WHERE book_id = book_uuid AND status = 'approved'
    ), 0),
    rating = COALESCE((
      SELECT AVG(rating)::numeric(3,2)
      FROM public.reviews 
      WHERE book_id = book_uuid AND status = 'approved'
    ), 0),
    reviews_count = COALESCE((
      SELECT COUNT(*)
      FROM public.reviews 
      WHERE book_id = book_uuid AND status = 'approved'
    ), 0)
  WHERE id = book_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update book stats when reviews change
CREATE OR REPLACE FUNCTION trigger_update_book_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_book_stats(OLD.book_id);
    RETURN OLD;
  ELSE
    PERFORM update_book_stats(NEW.book_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_book_stats_trigger ON public.reviews;
CREATE TRIGGER update_book_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_update_book_stats();

COMMIT;
`;

export default function EnhancedIndexes() {
  return null; // Component only for storing SQL
}