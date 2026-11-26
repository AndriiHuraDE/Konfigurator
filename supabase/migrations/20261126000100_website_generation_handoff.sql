-- Allow shop product images to be categorized separately from portfolio/gallery photos.
alter table public.website_onboarding_assets
  drop constraint if exists website_onboarding_assets_category_check;

alter table public.website_onboarding_assets
  add constraint website_onboarding_assets_category_check
  check (category in ('logo', 'team', 'gallery', 'products', 'documents', 'other'));

-- The expanded onboarding form stores structured product, FAQ, social, integration
-- and legal source data in the existing JSONB column. Increase its safe payload cap.
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
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 120000 then
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
