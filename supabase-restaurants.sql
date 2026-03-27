create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  short_description text,
  description text,
  cuisine text,
  image_url text,
  phone text,
  manager_name text,
  manager_email text,
  is_active boolean not null default true,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurants_category_id_idx on public.restaurants(category_id);
create index if not exists restaurants_active_sort_idx on public.restaurants(is_active, sort_order);
