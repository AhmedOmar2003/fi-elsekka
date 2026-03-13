-- ═══════════════════════════════════════════════════
-- Create the `favorites` table for user wishlists
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.favorites (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),

    -- Each user can only favorite a product once
    UNIQUE (user_id, product_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- ═══════════════════════════════════════════════════
-- Row Level Security (RLS)
-- Users can only see and manage their own favorites
-- ═══════════════════════════════════════════════════

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can read their own favorites
CREATE POLICY "Users can view own favorites"
    ON public.favorites FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can add own favorites"
    ON public.favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can remove own favorites"
    ON public.favorites FOR DELETE
    USING (auth.uid() = user_id);
