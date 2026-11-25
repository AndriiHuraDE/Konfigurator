-- pimentaGROUP Web Concierge — secure customer onboarding portal
-- Apply with: npx.cmd supabase db push --remote=otfxqesrvpmabxwsblqb

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- A customer receives a high-entropy bearer link. Only its SHA-256 hash is stored.
create table if not exists private.website_onboarding_invites (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.website_requests(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists website_onboarding_invites_request_idx
  on private.website_onboarding_invites (request_id, created_at desc);
alter table private.website_onboarding_invites enable row level security;
revoke all on table private.website_onboarding_invites from public, anon, authenticated;

-- The onboarding form stores structured business/content/design data separately
-- from the original sales request. Only allow-listed staff can read it.
create table if not exists public.website_onboarding_profiles (
  request_id uuid primary key references public.website_requests(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','submitted')),
  data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint website_onboarding_data_object check (jsonb_typeof(data) = 'object')
);
create index if not exists website_onboarding_profiles_status_idx
  on public.website_onboarding_profiles (status, updated_at desc);
alter table public.website_onboarding_profiles enable row level security;
revoke all on public.website_onboarding_profiles from public, anon, authenticated;
grant select on public.website_onboarding_profiles to authenticated;
drop policy if exists "Web Concierge admins can read onboarding profiles" on public.website_onboarding_profiles;
create policy "Web Concierge admins can read onboarding profiles"
  on public.website_onboarding_profiles
  for select to authenticated
  using (public.is_webconcierge_admin());

create table if not exists public.website_onboarding_assets (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.website_requests(id) on delete cascade,
  category text not null check (category in ('logo','team','gallery','documents','other')),
  original_filename text not null,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);
create index if not exists website_onboarding_assets_request_idx
  on public.website_onboarding_assets (request_id, created_at asc);
alter table public.website_onboarding_assets enable row level security;
revoke all on public.website_onboarding_assets from public, anon, authenticated;
grant all on public.website_onboarding_assets to service_role;
grant select on public.website_onboarding_assets to authenticated;
drop policy if exists "Web Concierge admins can read onboarding assets" on public.website_onboarding_assets;
create policy "Web Concierge admins can read onboarding assets"
  on public.website_onboarding_assets
  for select to authenticated
  using (public.is_webconcierge_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'website-onboarding-assets',
  'website-onboarding-assets',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

drop policy if exists "Web Concierge admins can read onboarding files" on storage.objects;
create policy "Web Concierge admins can read onboarding files"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'website-onboarding-assets'
    and public.is_webconcierge_admin()
  );

-- Admin-only RPC: create a new single-purpose invite and revoke previous active links.
create or replace function public.create_website_onboarding_invite(
  p_request_id uuid,
  p_token_hash text,
  p_valid_days integer default 30
) returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expires_at timestamptz;
begin
  if not public.is_webconcierge_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  if p_valid_days < 1 or p_valid_days > 90 then
    raise exception 'Invite validity must be between 1 and 90 days.' using errcode = '22023';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid onboarding token hash.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.website_requests where id = p_request_id) then
    raise exception 'Request not found.' using errcode = 'P0002';
  end if;

  update private.website_onboarding_invites
     set revoked_at = pg_catalog.now()
   where request_id = p_request_id
     and revoked_at is null
     and expires_at > now();

  v_expires_at := pg_catalog.now() + pg_catalog.make_interval(days => p_valid_days);
  insert into private.website_onboarding_invites (request_id, token_hash, expires_at, created_by)
  values (p_request_id, lower(p_token_hash), v_expires_at, auth.uid());
  return v_expires_at;
end;
$$;
revoke all on function public.create_website_onboarding_invite(uuid, text, integer) from public, anon;
grant execute on function public.create_website_onboarding_invite(uuid, text, integer) to authenticated;

-- Service-role-only RPCs used by the public onboarding Edge Function.
create or replace function public.get_client_onboarding_by_hash(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite private.website_onboarding_invites%rowtype;
  v_request record;
  v_profile public.website_onboarding_profiles%rowtype;
begin
  select * into v_invite
  from private.website_onboarding_invites
  where token_hash = p_token_hash
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if not found then return null; end if;

  update private.website_onboarding_invites set last_used_at = pg_catalog.now() where id = v_invite.id;

  select id, reference_code, business_name, contact_name, industry, website_status
    into v_request
  from public.website_requests
  where id = v_invite.request_id;

  select * into v_profile from public.website_onboarding_profiles where request_id = v_invite.request_id;

  return jsonb_build_object(
    'requestId', v_request.id,
    'referenceCode', v_request.reference_code,
    'businessName', v_request.business_name,
    'contactName', v_request.contact_name,
    'industry', v_request.industry,
    'websiteStatus', v_request.website_status,
    'status', coalesce(v_profile.status, 'draft'),
    'data', coalesce(v_profile.data, '{}'::jsonb),
    'submittedAt', v_profile.submitted_at,
    'expiresAt', v_invite.expires_at
  );
end;
$$;
revoke all on function public.get_client_onboarding_by_hash(text) from public, anon, authenticated;
grant execute on function public.get_client_onboarding_by_hash(text) to service_role;

create or replace function public.save_client_onboarding_by_hash(
  p_token_hash text,
  p_data jsonb,
  p_submit boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite private.website_onboarding_invites%rowtype;
  v_profile public.website_onboarding_profiles%rowtype;
begin
  select * into v_invite
  from private.website_onboarding_invites
  where token_hash = p_token_hash
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'This onboarding link is invalid or has expired.' using errcode = '28000';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 60000 then
    raise exception 'Invalid or oversized onboarding data.' using errcode = '22023';
  end if;

  insert into public.website_onboarding_profiles (request_id, status, data, submitted_at, updated_at)
  values (
    v_invite.request_id,
    case when p_submit then 'submitted' else 'draft' end,
    p_data,
    case when p_submit then now() else null end,
    pg_catalog.now()
  )
  on conflict (request_id) do update set
    status = case when p_submit then 'submitted' else 'draft' end,
    data = excluded.data,
    submitted_at = case when p_submit then now() else public.website_onboarding_profiles.submitted_at end,
    updated_at = now()
  returning * into v_profile;

  update private.website_onboarding_invites set last_used_at = pg_catalog.now() where id = v_invite.id;

  return jsonb_build_object(
    'ok', true,
    'requestId', v_invite.request_id,
    'status', v_profile.status,
    'updatedAt', v_profile.updated_at,
    'submittedAt', v_profile.submitted_at
  );
end;
$$;
revoke all on function public.save_client_onboarding_by_hash(text, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.save_client_onboarding_by_hash(text, jsonb, boolean) to service_role;

commit;
