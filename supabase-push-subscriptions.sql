-- Run this in your Supabase SQL Editor to enable push notifications
-- Supabase Dashboard > SQL Editor > New Query > Paste & Run

CREATE TABLE IF NOT EXISTS driver_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, subscription)
);

-- Enable Row Level Security
ALTER TABLE driver_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drivers can insert their own subscriptions
CREATE POLICY "Drivers can insert own subscriptions" ON driver_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Only admins/service role can read subscriptions for sending notifications
CREATE POLICY "Service role can read subscriptions" ON driver_subscriptions
  FOR SELECT USING (true);
