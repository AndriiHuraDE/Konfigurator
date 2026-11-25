-- pimentaGROUP Web Concierge — secure internal admin panel
-- Apply with: npx.cmd supabase db push --remote=otfxqesrvpmabxwsblqb

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Admin membership is deliberately kept outside the public API schema.
create table if not exists private.webconcierge_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('owner', 'admin', 'operator')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table private.webconcierge_admins enable row level security;
revoke all on table private.webconcierge_admins from public, anon, authenticated;

create or replace function public.is_webconcierge_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private, auth
as $$
  select exists (
    select 1
    from private.webconcierge_admins a
    where a.user_id = auth.uid()
      and a.is_active = true
  );
$$;
revoke all on function public.is_webconcierge_admin() from public, anon;
grant execute on function public.is_webconcierge_admin() to authenticated;

alter table public.website_requests
  add column if not exists admin_notes text not null default '',
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high'));

create table if not exists public.website_request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.website_requests(id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_by_email text not null default 'System',
  changed_at timestamptz not null default now()
);
create index if not exists website_request_status_history_request_idx
  on public.website_request_status_history (request_id, changed_at desc);

alter table public.website_request_status_history enable row level security;
revoke all on public.website_request_status_history from anon, authenticated;
grant select on public.website_request_status_history to authenticated;
drop policy if exists "Web Concierge admins can read status history" on public.website_request_status_history;
create policy "Web Concierge admins can read status history"
  on public.website_request_status_history
  for select to authenticated
  using (public.is_webconcierge_admin());

create or replace function public.log_website_request_status_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  insert into public.website_request_status_history (
    request_id, previous_status, new_status, changed_by, changed_by_email, changed_at
  ) values (
    new.id, null, new.status, auth.uid(), coalesce(auth.jwt() ->> 'email', 'System'), coalesce(new.created_at, now())
  );
  return new;
end;
$$;
revoke all on function public.log_website_request_status_insert() from public, anon, authenticated;

drop trigger if exists website_request_status_insert_history on public.website_requests;
create trigger website_request_status_insert_history
  after insert on public.website_requests
  for each row execute function public.log_website_request_status_insert();

create or replace function public.log_website_request_status_update()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if new.status is distinct from old.status then
    insert into public.website_request_status_history (
      request_id, previous_status, new_status, changed_by, changed_by_email
    ) values (
      new.id, old.status, new.status, auth.uid(), coalesce(auth.jwt() ->> 'email', 'System')
    );
  end if;
  return new;
end;
$$;
revoke all on function public.log_website_request_status_update() from public, anon, authenticated;

drop trigger if exists website_request_status_update_history on public.website_requests;
create trigger website_request_status_update_history
  after update of status on public.website_requests
  for each row execute function public.log_website_request_status_update();

create or replace function public.touch_website_request_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_website_request_updated_at() from public, anon, authenticated;
drop trigger if exists website_request_touch_updated_at on public.website_requests;
create trigger website_request_touch_updated_at
  before update on public.website_requests
  for each row execute function public.touch_website_request_updated_at();

-- Seed a baseline history row for requests created before this migration.
insert into public.website_request_status_history (request_id, previous_status, new_status, changed_by, changed_by_email, changed_at)
select r.id, null, r.status, null, 'System', r.created_at
from public.website_requests r
where not exists (
  select 1 from public.website_request_status_history h where h.request_id = r.id
);

-- Admin-only access. Browser clients still use the publishable key; RLS is the boundary.
grant select on public.website_requests to authenticated;
grant update (status, admin_notes, priority) on public.website_requests to authenticated;
drop policy if exists "Web Concierge admins can read requests" on public.website_requests;
create policy "Web Concierge admins can read requests"
  on public.website_requests
  for select to authenticated
  using (public.is_webconcierge_admin());
drop policy if exists "Web Concierge admins can update requests" on public.website_requests;
create policy "Web Concierge admins can update requests"
  on public.website_requests
  for update to authenticated
  using (public.is_webconcierge_admin())
  with check (public.is_webconcierge_admin());

 grant select on public.website_request_assets to authenticated;
drop policy if exists "Web Concierge admins can read request assets" on public.website_request_assets;
create policy "Web Concierge admins can read request assets"
  on public.website_request_assets
  for select to authenticated
  using (public.is_webconcierge_admin());

grant select on public.website_automation_outbox to authenticated;
drop policy if exists "Web Concierge admins can read automation outbox" on public.website_automation_outbox;
create policy "Web Concierge admins can read automation outbox"
  on public.website_automation_outbox
  for select to authenticated
  using (public.is_webconcierge_admin());

-- The bucket remains private. Only approved admins can create signed download URLs.
drop policy if exists "Web Concierge admins can read private request files" on storage.objects;
create policy "Web Concierge admins can read private request files"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'website-request-assets'
    and public.is_webconcierge_admin()
  );

commit;
