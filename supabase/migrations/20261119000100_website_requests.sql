-- pimentaGROUP Web Concierge — first-mode request intake
-- Apply this migration in the Supabase SQL editor or through Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists public.website_requests (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  reference_code text not null unique,
  source text not null default 'pimentaGROUP Website-Konfigurator',
  schema_version integer not null default 1,
  creation_mode text not null check (creation_mode in ('simple')),
  status text not null default 'new' check (status in (
    'new', 'in_review', 'waiting_for_materials', 'in_production',
    'internal_review', 'customer_review', 'changes_requested', 'approved', 'published', 'closed'
  )),
  industry text not null,
  project_type text,
  website_status text,
  contact_name text not null,
  business_name text,
  email text not null,
  phone text,
  current_website text,
  message text,
  contact_consent boolean not null default false,
  consent_at timestamptz,
  billing_start text not null check (billing_start in ('trial', 'immediate')),
  free_trial_months integer not null check (free_trial_months in (0, 2)),
  monthly_total numeric(10,2) not null check (monthly_total >= 0),
  one_time_total numeric(10,2) not null check (one_time_total >= 0),
  currency char(3) not null default 'EUR',
  pricing_snapshot jsonb not null default '{}'::jsonb,
  configuration jsonb not null default '{}'::jsonb,
  admin_email_status text not null default 'not_configured' check (admin_email_status in ('not_configured','sent','failed')),
  customer_email_status text not null default 'not_configured' check (customer_email_status in ('not_configured','sent','failed')),
  automation_status text not null default 'pending' check (automation_status in ('pending','sent','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_requests_created_at_idx on public.website_requests (created_at desc);
create index if not exists website_requests_status_idx on public.website_requests (status, created_at desc);
create index if not exists website_requests_email_idx on public.website_requests (lower(email));

create table if not exists public.website_request_assets (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.website_requests(id) on delete cascade,
  original_filename text not null,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);

create index if not exists website_request_assets_request_idx on public.website_request_assets (request_id);

create table if not exists public.website_automation_outbox (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.website_requests(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','delivered','failed')),
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (request_id, event_type)
);

create index if not exists website_automation_outbox_pending_idx
  on public.website_automation_outbox (created_at) where status in ('pending','failed');

create or replace function public.enqueue_website_request_created() returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.website_automation_outbox (request_id, event_type, payload)
  values (new.id, 'website_request.created', jsonb_build_object(
    'requestId', new.id,
    'referenceCode', new.reference_code,
    'creationMode', new.creation_mode,
    'industry', new.industry
  ));
  return new;
end;
$$;

revoke all on function public.enqueue_website_request_created() from public, anon, authenticated;
grant execute on function public.enqueue_website_request_created() to service_role;

drop trigger if exists website_request_created_outbox on public.website_requests;
create trigger website_request_created_outbox
after insert on public.website_requests
for each row execute function public.enqueue_website_request_created();

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.website_request_rate_limits (
  fingerprint_hash text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0
);
revoke all on table private.website_request_rate_limits from public, anon, authenticated;

create or replace function public.consume_website_request_rate_limit(
  p_fingerprint_hash text,
  p_max_attempts integer default 5,
  p_window_minutes integer default 60
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_attempts integer;
begin
  insert into private.website_request_rate_limits as existing_limit (fingerprint_hash, window_started_at, attempts)
  values (p_fingerprint_hash, now(), 1)
  on conflict (fingerprint_hash) do update
    set window_started_at = case
          when existing_limit.window_started_at < now() - make_interval(mins => p_window_minutes)
            then now()
          else existing_limit.window_started_at
        end,
        attempts = case
          when existing_limit.window_started_at < now() - make_interval(mins => p_window_minutes)
            then 1
          else existing_limit.attempts + 1
        end
  returning attempts into v_attempts;

  return v_attempts <= p_max_attempts;
end;
$$;

revoke all on function public.consume_website_request_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_website_request_rate_limit(text, integer, integer) to service_role;

alter table public.website_requests enable row level security;
alter table public.website_request_assets enable row level security;
alter table public.website_automation_outbox enable row level security;
revoke all on public.website_requests from anon, authenticated;
revoke all on public.website_request_assets from anon, authenticated;
revoke all on public.website_automation_outbox from anon, authenticated;
grant all on public.website_requests to service_role;
grant all on public.website_request_assets to service_role;
grant all on public.website_automation_outbox to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'website-request-assets',
  'website-request-assets',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];
