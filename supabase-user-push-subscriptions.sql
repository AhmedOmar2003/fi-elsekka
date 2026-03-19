create table if not exists public.user_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_user_id_idx
  on public.user_subscriptions (user_id);

alter table public.user_subscriptions enable row level security;

drop policy if exists "user_subscriptions_select_own" on public.user_subscriptions;
drop policy if exists "user_subscriptions_insert_own" on public.user_subscriptions;
drop policy if exists "user_subscriptions_update_own" on public.user_subscriptions;
drop policy if exists "user_subscriptions_delete_own" on public.user_subscriptions;

create policy "user_subscriptions_select_own"
on public.user_subscriptions
for select
using (auth.uid() = user_id);

create policy "user_subscriptions_insert_own"
on public.user_subscriptions
for insert
with check (auth.uid() = user_id);

create policy "user_subscriptions_update_own"
on public.user_subscriptions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_subscriptions_delete_own"
on public.user_subscriptions
for delete
using (auth.uid() = user_id);
