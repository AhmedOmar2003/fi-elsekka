alter table if exists public.cart_items
  add column if not exists selected_variant_json jsonb null;

alter table if exists public.order_items
  add column if not exists selected_variant_json jsonb null;

create index if not exists idx_cart_items_selected_variant_json
  on public.cart_items using gin (selected_variant_json);

create index if not exists idx_order_items_selected_variant_json
  on public.order_items using gin (selected_variant_json);
