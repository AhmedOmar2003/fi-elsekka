-- Run this in your Supabase SQL Editor to enable driver ratings
-- Supabase Dashboard > SQL Editor > New Query > Paste & Run

CREATE TABLE IF NOT EXISTS driver_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)  -- one review per order
);

-- Enable Row Level Security
ALTER TABLE driver_reviews ENABLE ROW LEVEL SECURITY;

-- Customers can insert/update their own reviews
CREATE POLICY "Users can insert own driver reviews" ON driver_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own driver reviews" ON driver_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Everyone can read reviews (drivers, admin, customers)
CREATE POLICY "Public read driver reviews" ON driver_reviews
  FOR SELECT USING (true);
