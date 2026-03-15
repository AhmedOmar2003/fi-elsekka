-- ============================================================
-- Performance Indexes for في السكة E-Commerce Store
-- Run this in Supabase SQL Editor
-- ============================================================

-- PRODUCTS TABLE
CREATE INDEX IF NOT EXISTS idx_products_category_id
    ON public.products (category_id);

CREATE INDEX IF NOT EXISTS idx_products_created_at
    ON public.products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_is_best_seller
    ON public.products (is_best_seller)
    WHERE is_best_seller = true;

CREATE INDEX IF NOT EXISTS idx_products_show_in_offers
    ON public.products (show_in_offers)
    WHERE show_in_offers = true;

CREATE INDEX IF NOT EXISTS idx_products_category_created
    ON public.products (category_id, created_at DESC);

-- CART_ITEMS TABLE
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id
    ON public.cart_items (user_id);

-- ORDERS TABLE
CREATE INDEX IF NOT EXISTS idx_orders_user_id
    ON public.orders (user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
    ON public.orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON public.orders (created_at DESC);

-- USERS TABLE
CREATE INDEX IF NOT EXISTS idx_users_role
    ON public.users (role);
