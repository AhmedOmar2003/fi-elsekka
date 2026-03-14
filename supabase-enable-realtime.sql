-- Run this in your Supabase SQL Editor to enable Realtime for the orders table
-- Supabase Dashboard > SQL Editor > New Query > Paste & Run

-- Add the orders table to the "supabase_realtime" publication
-- This allows the frontend to listen to INSERT, UPDATE, and DELETE events without refreshing the page.
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
