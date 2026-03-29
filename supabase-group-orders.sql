create extension if not exists pgcrypto;

create table if not exists public.group_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_user_id uuid not null,
  status text not null default 'open' check (status in ('open', 'confirmed', 'cancelled')),
  final_order_id uuid null references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_order_participants (
  id uuid primary key default gen_random_uuid(),
  group_order_id uuid not null references public.group_orders(id) on delete cascade,
  user_id uuid null,
  display_name text not null,
  is_host boolean not null default false,
  access_key text not null unique,
  created_at timestamptz not null default now()
);

create unique index if not exists group_order_participants_group_user_unique
  on public.group_order_participants(group_order_id, user_id)
  where user_id is not null;

create table if not exists public.group_order_items (
  id uuid primary key default gen_random_uuid(),
  group_order_id uuid not null references public.group_orders(id) on delete cascade,
  participant_id uuid not null references public.group_order_participants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  selected_variant_json jsonb null,
  unit_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists group_orders_host_user_id_idx
  on public.group_orders(host_user_id);

create index if not exists group_orders_status_idx
  on public.group_orders(status);

create index if not exists group_order_participants_group_order_id_idx
  on public.group_order_participants(group_order_id);

create index if not exists group_order_items_group_order_id_idx
  on public.group_order_items(group_order_id);

create index if not exists group_order_items_participant_id_idx
  on public.group_order_items(participant_id);

create index if not exists group_order_items_product_id_idx
  on public.group_order_items(product_id);

create or replace function public.set_group_order_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists group_orders_set_updated_at on public.group_orders;
create trigger group_orders_set_updated_at
before update on public.group_orders
for each row
execute function public.set_group_order_updated_at();

drop trigger if exists group_order_items_set_updated_at on public.group_order_items;
create trigger group_order_items_set_updated_at
before update on public.group_order_items
for each row
execute function public.set_group_order_updated_at();

alter table public.group_orders enable row level security;
alter table public.group_order_participants enable row level security;
alter table public.group_order_items enable row level security;
