create table if not exists public.app_settings (
  id text primary key,
  site_name text not null default 'في السكة',
  site_tagline text not null default 'بالسكة الصح',
  support_phone text not null default '',
  support_email text not null default '',
  support_whatsapp_1 text not null default '',
  support_whatsapp_2 text not null default '',
  support_whatsapp_3 text not null default '',
  free_shipping_threshold numeric not null default 0,
  default_shipping_cost numeric not null default 20,
  notify_new_orders boolean not null default true,
  notify_new_users boolean not null default true,
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.app_settings (
  id,
  site_name,
  site_tagline,
  support_phone,
  support_email,
  support_whatsapp_1,
  support_whatsapp_2,
  support_whatsapp_3,
  free_shipping_threshold,
  default_shipping_cost,
  notify_new_orders,
  notify_new_users,
  maintenance_mode
)
values (
  'global',
  'في السكة',
  'بالسكة الصح',
  '',
  '',
  '',
  '',
  '',
  0,
  20,
  true,
  true,
  false
)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_public_read" on public.app_settings;
create policy "app_settings_public_read"
on public.app_settings
for select
using (true);
