alter table if exists public.restaurants
add column if not exists menu_sections text[] not null default '{}'::text[];
