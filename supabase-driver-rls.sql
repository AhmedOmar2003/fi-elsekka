-- Run this in your Supabase SQL Editor to allow drivers to receive Realtime updates
-- Supabase Dashboard > SQL Editor > New Query > Paste & Run

-- Add a policy that allows drivers to SELECT orders where their ID is in the shipping_address
CREATE POLICY "Drivers can view assigned orders" ON orders
  FOR SELECT
  USING (
    auth.uid() = (shipping_address->'driver'->>'id')::uuid
  );

-- Allow drivers to UPDATE the status of their assigned orders
CREATE POLICY "Drivers can update assigned orders status" ON orders
  FOR UPDATE
  USING (
    auth.uid() = (shipping_address->'driver'->>'id')::uuid
  );
