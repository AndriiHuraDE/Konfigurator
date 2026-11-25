# pimentaGROUP Web Concierge — Admin Panel and Client Onboarding

The internal admin panel is available at `/admin/`. The customer material portal is available at `/onboarding/` with an individual invitation token.

## 1. Apply database migrations

From the project root in PowerShell:

```powershell
npx.cmd supabase db push --remote=otfxqesrvpmabxwsblqb
```

The v33 admin migration and v34 onboarding migration must both be applied. The database CLI applies only migrations not already recorded, so previously applied migrations are not recreated.

## 2. Create the first staff login

1. Supabase Dashboard → Authentication → Users → Add user.
2. Create the staff account with a strong password.
3. Copy its User UID.
4. Run this in Supabase SQL Editor, replacing the UID and email:

```sql
insert into private.webconcierge_admins (user_id, email, role, is_active)
values ('PASTE-AUTH-USER-UUID-HERE', 'staff@pimenta.group', 'owner', true)
on conflict (user_id) do update
set email = excluded.email, role = excluded.role, is_active = true;
```

## 3. Deploy the Edge Function

```powershell
npx.cmd supabase functions deploy client-onboarding --use-api --remote=otfxqesrvpmabxwsblqb
```

The existing `submit-website-request` function remains deployed and does not need redeployment for this onboarding change.

## 4. Run locally

Run the static server from the project root (the same folder that contains `index.html`, `admin/`, `onboarding/`, `js/` and `supabase/`):

```powershell
python -m http.server 8000
```

- Configurator: `http://localhost:8000/`
- Admin panel: `http://localhost:8000/admin/`
- Customer portal: `http://localhost:8000/onboarding/` (requires a valid token)

## 5. Create a customer onboarding invite

1. Sign in at `/admin/`.
2. Select a request.
3. In **Kunden-Onboarding**, click **Onboarding-Link erstellen (30 Tage)**.
4. Copy the generated URL and share it privately with the customer.

The admin panel creates a cryptographically random 256-bit token in the browser and sends only its SHA-256 hash to the admin-only SQL RPC. Only the hash is stored in `private.website_onboarding_invites`. The raw token appears in the link once. Creating a new link revokes earlier active links for that request.

## 6. Customer portal behaviour

The customer can:
- Save a draft and continue later using the same link.
- Submit core business, contact, services, team and brand information.
- Upload JPG, PNG, WebP and PDF assets to a private bucket.
- Reopen the link and update details until it expires or is revoked.

The form requires business name, city and a valid public contact email before final submission. If files are selected, the customer must confirm they have the rights and permissions required to use the materials.

## Security

- `private.website_onboarding_invites` is not accessible to browser roles.
- The customer portal does not directly read/write database tables.
- `client-onboarding` validates invitation tokens and expiry on the server.
- `website_onboarding_profiles` and `website_onboarding_assets` can be read only by authenticated allow-listed admins via RLS.
- `website-onboarding-assets` is private; admins receive short-lived signed links.
- Do not put a Supabase secret/service-role key in browser code.
- Treat onboarding links as passwords: share privately, and generate a new link if one is compromised.

## Production origin

Before public deployment, configure the `ALLOWED_ORIGINS` Supabase Edge Function secret to the exact deployed site origin(s), e.g. `https://www.pimenta.group`. The invitation link is generated relative to the admin page origin, so the admin and onboarding portal should be hosted on the same origin.
