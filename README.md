# pimentaGROUP Web Concierge — v36

Version 36 refreshes the configurator JavaScript asset URL to prevent browsers from reusing a stale cached script. The package is based on the clean v35 project and preserves its onboarding upload limits, request, onboarding and admin workflows.

## Customer journey

1. A prospect chooses salon type and website functions in the simple configurator.
2. The prospect selects the done-for-you design route and sends a non-binding enquiry.
3. The enquiry and initial images are saved in Supabase.
4. A pimentaGROUP administrator opens the request in `/admin/` and creates a personal onboarding link.
5. The customer opens `/onboarding/#token=...` and provides business details, opening hours, service/price information, team details, brand preferences and additional notes.
6. The customer can save a draft and continue later using the same link, or submit the material package.
7. Additional customer files are uploaded directly to a private Storage bucket using short-lived signed upload tokens. The service validates the uploaded file type/signature before registering metadata.
8. The administrator sees the submitted onboarding profile and additional files inside the request detail view.

## Security design

- The onboarding link contains a 256-bit random bearer token in the URL fragment (after `#`), so the browser does not send it in the initial HTTP request or normal referrer header. The database stores only its SHA-256 hash.
- The link expires after 30 days by default. The onboarding page also sends a `no-referrer` policy and removes the token fragment from the address bar after opening. Creating a new link revokes earlier active links for that request.
- The raw token is shown once to the administrator. Copy it and send it to the customer through a suitable channel. The raw token is not stored in the database.
- The customer portal has no general public database access. It calls the `client-onboarding` Edge Function, which validates the token server-side.
- Customer uploads use server-created signed Storage upload tokens and go into the private `website-onboarding-assets` bucket.
- Public/anonymous users cannot read onboarding tables or bucket files. Only approved pimentaGROUP administrators can read them through RLS.
- No Supabase secret/service-role key is in browser code.
- The portal can save drafts and resubmit changes until the invite expires or is revoked.

## Apply the database migration

Open PowerShell in the project root (the folder containing `index.html` and `supabase/`) and run:

```powershell
npx.cmd supabase db push --remote=otfxqesrvpmabxwsblqb
```

This applies `supabase/migrations/20261124000200_client_onboarding.sql`. It adds:

- Private hashed onboarding invites.
- `public.website_onboarding_profiles`.
- `public.website_onboarding_assets`.
- The private `website-onboarding-assets` Storage bucket (10 MB per file; JPG, PNG, WebP and PDF).
- Admin-only RLS policies for reading onboarding data and files.
- An admin-only invite-generation RPC and service-role-only RPCs for token validation and saving onboarding data.

The migration does not modify the original request tables or delete existing requests/assets.

## Deploy the onboarding Edge Function

From the project root:

```powershell
npx.cmd supabase functions deploy client-onboarding --use-api --remote=otfxqesrvpmabxwsblqb
```

The function is configured with `verify_jwt = false` because customer access uses a separate high-entropy invitation token rather than a Supabase Auth account. The function validates the public publishable key, request origin, invitation hash and expiry on every action. It uses server-side Supabase credentials only inside the Edge Function.

For local tests, the default allowed origins include `http://localhost:8000` and `http://127.0.0.1:8000`. Before production, set the `ALLOWED_ORIGINS` Edge Function secret to the exact deployed origin(s), for example `https://www.pimenta.group`, without a path or trailing slash. If multiple origins are required, separate them with commas.

No new secrets are required for the onboarding portal. It uses the Supabase server credentials already provisioned to Edge Functions. Brevo is still not required to generate/copy onboarding links; the admin can share the link manually until email is configured.

## Create and send an onboarding link

1. Run the project locally or open the deployed admin URL.
2. Sign in at `/admin/` with an active account in `private.webconcierge_admins`.
3. Open a request.
4. Find **Kunden-Onboarding** and click **Onboarding-Link erstellen (30 Tage)**.
5. Copy the generated link and send it to that customer. Do not post it publicly; anyone with the link can edit that customer's onboarding data until it expires or is revoked.
6. Creating another invite for the same request revokes the previous active invite.

The generated link points to `/onboarding/#token=...` on the same origin. The bearer token is stored in the URL fragment, then removed from the visible address after the portal opens. For local development, run the static server from this project root:

```powershell
python -m http.server 8000
```

Admin: `http://localhost:8000/admin/`

Customer onboarding route: `http://localhost:8000/onboarding/` (the invite token is appended by the admin panel).

## Onboarding fields

- Company name, street, postal code, city and country.
- Public contact email, phone, website and opening hours.
- About the salon, specialties and target audience.
- Services/prices/duration (one service per line) and team information (one person per line).
- Desired style, languages and optional brand colors.
- Additional notes.
- Logo/brand files, team photos, work/gallery photos and PDF documents.

Text limits are enforced by the Edge Function. Upload limits are calculated from the original request configuration: up to 50 image files without the shop feature or 500 image files when the shop feature is selected; up to 15 PDF documents in either case; 10 MB per file; 200 MB total without shop or 750 MB total with shop. JPG, PNG, WebP and PDF are accepted. The server checks project-wide counts and sizes before issuing upload links and verifies each uploaded file signature before registering its metadata.

The per-project size budgets are not the same as the Supabase organization's total quota. Supabase Free currently includes 1 GB Storage for the entire organization; several customers can use that shared quota together. Check Storage usage and upgrade the plan before production if many salons will upload large image libraries.

## Current limitations

- Email invitations are not automated yet because Brevo sender-domain setup is pending. Copy and send the generated link manually.
- This is an information and material collection portal, not yet a visual website editor.
- Submitted details are stored in structured JSON for the future website generator; the generator itself is a later milestone.
- The onboarding link is a bearer credential. Share it privately and create a new one if it is forwarded to the wrong person.

## Existing systems preserved

- Existing configurator and request intake endpoint `submit-website-request` remain unchanged.
- Existing request table, price snapshot and automation outbox remain unchanged.
- Existing admin authentication, allow-list and request status workflow remain in place.
- Existing team photographs, stock-photo licence register and `.git` directory are preserved.


## Onboarding upload limits (v35)

The client onboarding portal calculates upload limits from the features saved in the original website request:

- With the `shop` feature: up to 500 image files.
- Without the `shop` feature: up to 50 image files.
- PDF documents: up to 15 per project (separate from the photo count).
- Maximum individual file size: 10 MB.
- Aggregate material budget: 750 MB with shop; 200 MB without shop.
- Uploads are prepared and registered in batches of up to 20 files, with up to four parallel file transfers.

Limits are enforced in the Edge Function as well as in the browser. The feature entitlement is read from `website_requests.configuration`, so the client cannot choose a larger quota by changing browser-side values.

To activate v35 on the existing Supabase project, deploy the updated function from the project root:

```powershell
npx.cmd supabase functions deploy client-onboarding --use-api --remote=otfxqesrvpmabxwsblqb
```

No database migration is required for this upload-limit change.
