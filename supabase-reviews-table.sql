-- ═══════════════════════════════════════════════════
-- Create the `reviews` table for product reviews
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reviews (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    images      TEXT[] DEFAULT '{}',
    user_name   TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),

    -- Each user can only review a product once
    UNIQUE (user_id, product_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- ═══════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY "Anyone can view reviews"
    ON public.reviews FOR SELECT
    USING (true);

-- Users can insert their own reviews
CREATE POLICY "Users can create own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- Storage bucket for review images (optional)
-- ═══════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload review images
CREATE POLICY "Auth users can upload review images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');

-- Allow public read on review images
CREATE POLICY "Public read review images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'review-images');

-- ═══════════════════════════════════════════════════
-- Realtime (Enable to get admin notification alerts)
-- ═══════════════════════════════════════════════════
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
