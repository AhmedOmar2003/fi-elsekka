create index if not exists idx_products_category_created_at
on public.products (category_id, created_at desc);

create index if not exists idx_products_best_seller_created_at
on public.products (is_best_seller, created_at desc);

create index if not exists idx_products_offers_created_at
on public.products (show_in_offers, created_at desc);

create index if not exists idx_products_created_at
on public.products (created_at desc);

create index if not exists idx_product_specifications_product_id
on public.product_specifications (product_id);

create index if not exists idx_cart_items_user_created_at
on public.cart_items (user_id, created_at asc);

create index if not exists idx_favorites_user_product
on public.favorites (user_id, product_id);

create index if not exists idx_orders_status_created_at
on public.orders (status, created_at desc);

create index if not exists idx_orders_user_created_at
on public.orders (user_id, created_at desc);

create index if not exists idx_order_items_product_id
on public.order_items (product_id);

create index if not exists idx_order_items_order_id
on public.order_items (order_id);

create index if not exists idx_notifications_user_created_at
on public.notifications (user_id, created_at desc);

create index if not exists idx_users_role_disabled_created_at
on public.users (role, disabled, created_at desc);

create index if not exists idx_users_last_login_at
on public.users (last_login_at desc);

create index if not exists idx_categories_parent_name
on public.categories (parent_id, name);
