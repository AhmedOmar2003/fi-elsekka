alter table public.discount_codes
  add column if not exists applicable_product_id uuid references public.products(id) on delete set null;

alter table public.discount_codes
  add column if not exists applicable_category_id uuid references public.categories(id) on delete set null;

create index if not exists discount_codes_applicable_product_id_idx
  on public.discount_codes(applicable_product_id);

create index if not exists discount_codes_applicable_category_id_idx
  on public.discount_codes(applicable_category_id);
