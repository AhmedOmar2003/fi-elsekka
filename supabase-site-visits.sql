create extension if not exists pgcrypto;

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.site_page_views (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text,
  path text not null,
  previous_path text,
  created_at timestamptz not null default now()
);

alter table public.site_page_views add column if not exists session_id text;
alter table public.site_page_views add column if not exists previous_path text;

create index if not exists idx_site_visits_created_at on public.site_visits(created_at desc);
create index if not exists idx_site_visits_path on public.site_visits(path);
create index if not exists idx_site_visits_visitor_id on public.site_visits(visitor_id);
create index if not exists idx_site_page_views_created_at on public.site_page_views(created_at desc);
create index if not exists idx_site_page_views_path on public.site_page_views(path);
create index if not exists idx_site_page_views_visitor_id on public.site_page_views(visitor_id);

alter table public.site_visits enable row level security;
alter table public.site_page_views enable row level security;

drop policy if exists "site_visits_admin_select" on public.site_visits;
drop policy if exists "site_page_views_admin_select" on public.site_page_views;

create policy "site_visits_admin_select"
on public.site_visits
for select
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.disabled is not true
      and users.role in ('super_admin', 'admin', 'operations_manager', 'catalog_manager', 'support_agent')
  )
);

create policy "site_page_views_admin_select"
on public.site_page_views
for select
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.disabled is not true
      and users.role in ('super_admin', 'admin', 'operations_manager', 'catalog_manager', 'support_agent')
  )
);
