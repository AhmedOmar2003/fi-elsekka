-- Add an is_available column to the public.users table to track if a driver is resting
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Update existing drivers to be available by default if null
UPDATE public.users 
SET is_available = true 
WHERE role = 'driver' AND is_available IS NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
