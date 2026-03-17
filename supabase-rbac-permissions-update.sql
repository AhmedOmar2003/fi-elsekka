-- RBAC hardening for staff permissions
-- Run after supabase-admin-rls.sql to ensure columns exist.
-- Safe to re-run; uses CREATE OR REPLACE / DROP IF EXISTS.

-- Helper: read claims once
create or replace function public.has_permission(required_perm text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  perm_list jsonb;
begin
  claims := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
  perm_list := coalesce(claims -> 'app_metadata' -> 'permissions', claims -> 'user_metadata' -> 'permissions', '[]'::jsonb);

  if (claims -> 'app_metadata' ->> 'role') in ('super_admin','admin') then
    return true;
  end if;

  if exists(select 1 from public.users where id = auth.uid() and disabled = false and role in ('super_admin','admin')) then
    return true;
  end if;

  if required_perm is null then
    return false;
  end if;

  -- JWT permissions list
  if perm_list ? required_perm then
    return true;
  end if;

  -- DB-side permissions
  if exists(select 1 from public.users where id = auth.uid() and disabled = false and permissions ? required_perm) then
    return true;
  end if;

  return false;
end;
$$;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.has_any_permission(required_perms text[])
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p text;
begin
  if required_perms is null then return false; end if;
  foreach p in array required_perms loop
    if has_permission(p) then
      return true;
    end if;
  end loop;
  return false;
end;
$$;
grant execute on function public.has_any_permission(text[]) to authenticated;

-- Users table policies (admin/staff management)
alter table public.users enable row level security;
drop policy if exists "users_self_select" on public.users;
drop policy if exists "users_self_update" on public.users;
drop policy if exists "users_admin_insert" on public.users;
drop policy if exists "users_admin_update" on public.users;
drop policy if exists "users_admin_delete" on public.users;
create policy "users_self_select" on public.users for select using (
    auth.uid() = id
    or has_any_permission(array['manage_users','manage_admins'])
    or (has_any_permission(array['view_drivers','assign_driver']) and role = 'driver')
);
create policy "users_self_update" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users_admin_insert" on public.users for insert with check (has_any_permission(array['manage_users','manage_admins']));
create policy "users_admin_update" on public.users for update using (has_any_permission(array['manage_users','manage_admins'])) with check (has_any_permission(array['manage_users','manage_admins']));
create policy "users_admin_delete" on public.users for delete using (has_any_permission(array['manage_users','manage_admins']));

-- Products
alter table public.products enable row level security;
drop policy if exists "products_select_public" on public.products;
drop policy if exists "products_insert_admin_only" on public.products;
drop policy if exists "products_update_admin_only" on public.products;
drop policy if exists "products_delete_admin_only" on public.products;
create policy "products_select_public" on public.products for select using (true);
create policy "products_insert_admin_only" on public.products for insert with check (has_permission('manage_products'));
create policy "products_update_admin_only" on public.products for update using (has_permission('manage_products')) with check (has_permission('manage_products'));
create policy "products_delete_admin_only" on public.products for delete using (has_permission('manage_products'));

-- Categories
alter table public.categories enable row level security;
drop policy if exists "categories_select_public" on public.categories;
drop policy if exists "categories_admin_ins" on public.categories;
drop policy if exists "categories_admin_upd" on public.categories;
drop policy if exists "categories_admin_del" on public.categories;
create policy "categories_select_public" on public.categories for select using (true);
create policy "categories_admin_ins" on public.categories for insert with check (has_permission('manage_categories'));
create policy "categories_admin_upd" on public.categories for update using (has_permission('manage_categories')) with check (has_permission('manage_categories'));
create policy "categories_admin_del" on public.categories for delete using (has_permission('manage_categories'));

-- Promotions
alter table public.promotions enable row level security;
drop policy if exists "promotions_select_public" on public.promotions;
drop policy if exists "promotions_admin_ins" on public.promotions;
drop policy if exists "promotions_admin_upd" on public.promotions;
drop policy if exists "promotions_admin_del" on public.promotions;
create policy "promotions_select_public" on public.promotions for select using (true);
create policy "promotions_admin_ins" on public.promotions for insert with check (has_permission('manage_offers'));
create policy "promotions_admin_upd" on public.promotions for update using (has_permission('manage_offers')) with check (has_permission('manage_offers'));
create policy "promotions_admin_del" on public.promotions for delete using (has_permission('manage_offers'));

-- Discount codes
alter table public.discount_codes enable row level security;
drop policy if exists "discounts_select_public" on public.discount_codes;
drop policy if exists "discounts_admin_ins" on public.discount_codes;
drop policy if exists "discounts_admin_upd" on public.discount_codes;
drop policy if exists "discounts_admin_del" on public.discount_codes;
create policy "discounts_select_public" on public.discount_codes for select using (true);
create policy "discounts_admin_ins" on public.discount_codes for insert with check (has_permission('manage_discounts'));
create policy "discounts_admin_upd" on public.discount_codes for update using (has_permission('manage_discounts')) with check (has_permission('manage_discounts'));
create policy "discounts_admin_del" on public.discount_codes for delete using (has_permission('manage_discounts'));

-- Product specifications
alter table public.product_specifications enable row level security;
drop policy if exists "specs_select_public" on public.product_specifications;
drop policy if exists "specs_admin_ins" on public.product_specifications;
drop policy if exists "specs_admin_upd" on public.product_specifications;
drop policy if exists "specs_admin_del" on public.product_specifications;
create policy "specs_select_public" on public.product_specifications for select using (true);
create policy "specs_admin_ins" on public.product_specifications for insert with check (has_permission('manage_products'));
create policy "specs_admin_upd" on public.product_specifications for update using (has_permission('manage_products')) with check (has_permission('manage_products'));
create policy "specs_admin_del" on public.product_specifications for delete using (has_permission('manage_products'));

-- Orders
alter table public.orders enable row level security;
drop policy if exists "orders_select_owner_or_admin" on public.orders;
drop policy if exists "orders_select_owner_or_staff" on public.orders;
drop policy if exists "orders_insert_owner" on public.orders;
drop policy if exists "orders_admin_update_delete" on public.orders;
drop policy if exists "orders_update_staff" on public.orders;
drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_select_owner_or_staff" on public.orders for select using (auth.uid() = user_id or has_permission('view_orders'));
create policy "orders_insert_owner" on public.orders for insert with check (auth.uid() = user_id or has_permission('view_orders'));
create policy "orders_update_staff" on public.orders for update using (has_any_permission(array['update_order_status','assign_driver'])) with check (has_any_permission(array['update_order_status','assign_driver']));
create policy "orders_admin_delete" on public.orders for delete using (has_permission('manage_admins'));

-- Notifications table
alter table public.notifications enable row level security;
drop policy if exists "notifications_select_owner" on public.notifications;
drop policy if exists "notifications_owner_update" on public.notifications;
drop policy if exists "notifications_owner_delete" on public.notifications;
drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_select_owner" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_owner_update" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_owner_delete" on public.notifications for delete using (auth.uid() = user_id);
create policy "notifications_admin_insert" on public.notifications for insert with check (has_permission('manage_admins') or has_permission('manage_offers'));

-- Ensure key columns exist (idempotent)
alter table public.users
  add column if not exists permissions jsonb default '[]',
  add column if not exists disabled boolean default false,
  add column if not exists must_change_password boolean default false,
  add column if not exists username text,
  add column if not exists last_login_at timestamptz;
