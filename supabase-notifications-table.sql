-- Run this in your Supabase SQL Editor to create the In-App Notifications table
-- Supabase Dashboard > SQL Editor > New Query > Paste & Run

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins and Service Roles can insert notifications
-- This allows our Next.js backend (using Anon/Service keys) to create notifications
CREATE POLICY "Service and public can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create an index to quickly fetch unread notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
