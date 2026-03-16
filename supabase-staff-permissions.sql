-- Seed roles/permissions defaults (run once)
-- Adds a minimal staff account with limited order permissions

-- Ensure columns exist (safe if already migrated)
alter table public.users
  add column if not exists disabled boolean default false,
  add column if not exists permissions jsonb default '[]';

-- Create a limited operations staff user (replace password as needed)
-- NOTE: update email/password before running in production
do $$
declare
  temp_pass text := 'Ops!Temp#2024';
  new_user uuid;
begin
  -- Create auth user
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'ops@example.com',
    crypt(temp_pass, gen_salt('bf')),
    now(),
    jsonb_build_object('role','operations_manager','permissions',jsonb_build_array('view_orders','update_order_status','assign_driver','view_drivers'))
  )
  returning id into new_user;

  -- Public profile
  insert into public.users (id, email, full_name, role, permissions, disabled, must_change_password)
  values (new_user, 'ops@example.com', 'Operations Staff', 'operations_manager',
          jsonb_build_array('view_orders','update_order_status','assign_driver','view_drivers'), false, true);
end $$;
