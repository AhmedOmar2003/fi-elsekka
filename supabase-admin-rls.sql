-- Harden admin-only mutations. Run this in Supabase SQL.
-- Safe to re-run; uses IF NOT EXISTS guards.

-- Helper: determine if current JWT belongs to an admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::json -> 'app_metadata' ->> 'role') = 'admin'
    or exists (select 1 from public.users where id = auth.uid() and role = 'admin'),
    false
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- Ensure flag exists for forced password reset.
alter table public.users
add column if not exists must_change_password boolean default false;
alter table public.users
add column if not exists disabled boolean default false;
alter table public.users
add column if not exists permissions jsonb default '[]';
alter table public.users
add column if not exists username text;
alter table public.users
add column if not exists last_login_at timestamptz;

-- Products
alter table public.products enable row level security;
drop policy if exists "products_insert_admin_only" on public.products;
drop policy if exists "products_update_admin_only" on public.products;
drop policy if exists "products_delete_admin_only" on public.products;
create policy "products_select_public" on public.products for select using (true);
create policy "products_insert_admin_only" on public.products for insert with check (is_admin());
create policy "products_update_admin_only" on public.products for update using (is_admin()) with check (is_admin());
create policy "products_delete_admin_only" on public.products for delete using (is_admin());

-- Categories
alter table public.categories enable row level security;
drop policy if exists "categories_admin_ins" on public.categories;
drop policy if exists "categories_admin_upd" on public.categories;
drop policy if exists "categories_admin_del" on public.categories;
create policy "categories_select_public" on public.categories for select using (true);
create policy "categories_admin_ins" on public.categories for insert with check (is_admin());
create policy "categories_admin_upd" on public.categories for update using (is_admin()) with check (is_admin());
create policy "categories_admin_del" on public.categories for delete using (is_admin());

-- Promotions
alter table public.promotions enable row level security;
drop policy if exists "promotions_admin_ins" on public.promotions;
drop policy if exists "promotions_admin_upd" on public.promotions;
drop policy if exists "promotions_admin_del" on public.promotions;
create policy "promotions_select_public" on public.promotions for select using (true);
create policy "promotions_admin_ins" on public.promotions for insert with check (is_admin());
create policy "promotions_admin_upd" on public.promotions for update using (is_admin()) with check (is_admin());
create policy "promotions_admin_del" on public.promotions for delete using (is_admin());

-- Discount codes
alter table public.discount_codes enable row level security;
drop policy if exists "discounts_admin_ins" on public.discount_codes;
drop policy if exists "discounts_admin_upd" on public.discount_codes;
drop policy if exists "discounts_admin_del" on public.discount_codes;
create policy "discounts_select_public" on public.discount_codes for select using (true);
create policy "discounts_admin_ins" on public.discount_codes for insert with check (is_admin());
create policy "discounts_admin_upd" on public.discount_codes for update using (is_admin()) with check (is_admin());
create policy "discounts_admin_del" on public.discount_codes for delete using (is_admin());

-- Product specifications
alter table public.product_specifications enable row level security;
drop policy if exists "specs_admin_ins" on public.product_specifications;
drop policy if exists "specs_admin_upd" on public.product_specifications;
drop policy if exists "specs_admin_del" on public.product_specifications;
create policy "specs_select_public" on public.product_specifications for select using (true);
create policy "specs_admin_ins" on public.product_specifications for insert with check (is_admin());
create policy "specs_admin_upd" on public.product_specifications for update using (is_admin()) with check (is_admin());
create policy "specs_admin_del" on public.product_specifications for delete using (is_admin());

-- Users table (self-manage allowed, admin full control)
alter table public.users enable row level security;
drop policy if exists "users_self_select" on public.users;
drop policy if exists "users_self_update" on public.users;
drop policy if exists "users_admin_all" on public.users;
drop policy if exists "users_admin_insert" on public.users;
drop policy if exists "users_admin_update_delete" on public.users;
create policy "users_self_select" on public.users for select using (auth.uid() = id or is_admin());
create policy "users_self_update" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users_admin_insert" on public.users for insert with check (is_admin());
create policy "users_admin_update" on public.users for update using (is_admin()) with check (is_admin());
create policy "users_admin_delete" on public.users for delete using (is_admin());
create policy "users_admin_disable" on public.users for update using (is_admin()) with check (is_admin());

-- Orders (owners can create/read; admin manages status/cleanup)
alter table public.orders enable row level security;
drop policy if exists "orders_select_owner_or_admin" on public.orders;
drop policy if exists "orders_insert_owner" on public.orders;
drop policy if exists "orders_admin_update_delete" on public.orders;
create policy "orders_select_owner_or_admin" on public.orders for select using (auth.uid() = user_id or is_admin());
create policy "orders_insert_owner" on public.orders for insert with check (auth.uid() = user_id or is_admin());
create policy "orders_admin_update_delete" on public.orders for update using (is_admin()) with check (is_admin());
create policy "orders_admin_delete" on public.orders for delete using (is_admin());

-- Notifications table: admin can insert (broadcasts), users can select their own
alter table public.notifications enable row level security;
drop policy if exists "notifications_select_owner" on public.notifications;
drop policy if exists "notifications_owner_update" on public.notifications;
drop policy if exists "notifications_owner_delete" on public.notifications;
drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_select_owner" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_owner_update" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_owner_delete" on public.notifications for delete using (auth.uid() = user_id);
create policy "notifications_admin_insert" on public.notifications for insert with check (is_admin());
