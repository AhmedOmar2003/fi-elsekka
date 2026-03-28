alter table public.app_settings
  add column if not exists support_whatsapp_1 text not null default '',
  add column if not exists support_whatsapp_2 text not null default '',
  add column if not exists support_whatsapp_3 text not null default '';
