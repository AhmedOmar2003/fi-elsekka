create extension if not exists pgcrypto;

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  actor_email text,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_actor_user_id_idx on public.admin_audit_logs (actor_user_id);
create index if not exists admin_audit_logs_entity_idx on public.admin_audit_logs (entity_type, entity_id);
create index if not exists admin_audit_logs_action_idx on public.admin_audit_logs (action);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
on public.admin_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and coalesce(u.disabled, false) = false
      and (
        u.role in ('super_admin', 'admin')
        or coalesce(u.permissions, '[]'::jsonb) ? 'manage_admins'
        or coalesce(u.permissions, '[]'::jsonb) ? 'view_reports'
      )
  )
);

drop policy if exists "Admins can insert own audit logs" on public.admin_audit_logs;
create policy "Admins can insert own audit logs"
on public.admin_audit_logs
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and coalesce(u.disabled, false) = false
      and (
        u.role in ('super_admin', 'admin')
        or coalesce(u.permissions, '[]'::jsonb) ? 'manage_admins'
        or coalesce(u.permissions, '[]'::jsonb) ? 'view_reports'
        or coalesce(u.permissions, '[]'::jsonb) ? 'manage_products'
        or coalesce(u.permissions, '[]'::jsonb) ? 'manage_categories'
        or coalesce(u.permissions, '[]'::jsonb) ? 'manage_users'
        or coalesce(u.permissions, '[]'::jsonb) ? 'manage_offers'
        or coalesce(u.permissions, '[]'::jsonb) ? 'manage_discounts'
        or coalesce(u.permissions, '[]'::jsonb) ? 'update_order_status'
        or coalesce(u.permissions, '[]'::jsonb) ? 'assign_driver'
      )
  )
);
