alter table public.driver_subscriptions
  add column if not exists endpoint text;

update public.driver_subscriptions
set endpoint = subscription->>'endpoint'
where endpoint is null
  and subscription ? 'endpoint';

create unique index if not exists driver_subscriptions_endpoint_key
  on public.driver_subscriptions (endpoint)
  where endpoint is not null;

create index if not exists driver_subscriptions_driver_id_idx
  on public.driver_subscriptions (driver_id);
