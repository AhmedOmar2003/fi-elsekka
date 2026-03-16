-- Idempotent seed for a limited operations staff user.
-- Run AFTER applying supabase-admin-rls.sql (it creates permissions/disabled columns).
-- Edit target_email and temp_pass before running.

do $$
declare
  temp_pass text := 'Ops!Temp#2024'; -- change
  target_email text := 'ops@example.com'; -- change
  existing_auth uuid;
begin
  -- ensure columns exist (no error if already there)
  alter table public.users
    add column if not exists permissions jsonb default '[]',
    add column if not exists disabled boolean default false,
    add column if not exists must_change_password boolean default false;

  select id into existing_auth from auth.users where email = target_email limit 1;

  if existing_auth is null then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      target_email,
      crypt(temp_pass, gen_salt('bf')),
      now(),
      jsonb_build_object('role','operations_manager','permissions',jsonb_build_array('view_orders','update_order_status','assign_driver','view_drivers'))
    )
    returning id into existing_auth;
  else
    update auth.users
      set encrypted_password = crypt(temp_pass, gen_salt('bf')),
          raw_user_meta_data = jsonb_build_object('role','operations_manager','permissions',jsonb_build_array('view_orders','update_order_status','assign_driver','view_drivers'))
    where id = existing_auth;
  end if;

  insert into public.users (id, email, full_name, role, permissions, disabled, must_change_password)
  values (existing_auth, target_email, 'Operations Staff', 'operations_manager',
          jsonb_build_array('view_orders','update_order_status','assign_driver','view_drivers'), false, true)
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        permissions = excluded.permissions,
        disabled = excluded.disabled,
        must_change_password = true;
end $$;
