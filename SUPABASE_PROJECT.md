# Supabase project connection

- Project name: `pimenta-webconcierge-dev`
- Project reference: `otfxqesrvpmabxwsblqb`
- Project URL: `https://otfxqesrvpmabxwsblqb.supabase.co`
- Frontend publishable key: configured in `js/backend-config.js`

## Deployed / verified before v35

- `20261119000100_website_requests.sql` — deployed and tested with real request submissions and initial image uploads.
- `submit-website-request` — deployed and tested with real submissions and private Storage uploads.
- `20261124000100_webconcierge_admin.sql` — applied; admin login, request list/detail, statuses, notes and initial assets were verified in the dashboard by the project owner.

## Added in v34 — already activated

- `20261124000200_client_onboarding.sql` — adds hashed expiring customer invites, onboarding profile/assets tables, private Storage bucket and access policies.
- `client-onboarding` Edge Function — validates the invite token, saves drafts/submissions, enforces project-wide file quotas and issues signed upload URLs.

The database migration and Edge Function were deployed and verified by the project owner from the v34 project root:

```powershell
npx.cmd supabase db push --remote=otfxqesrvpmabxwsblqb
npx.cmd supabase functions deploy client-onboarding --use-api --remote=otfxqesrvpmabxwsblqb
```

The existing request submission function and browser publishable key are unchanged. No service-role key, database password, Brevo API key or n8n secret is stored in this repository.

## Added in v35 — upload limits

- No shop feature: up to 50 photos, 15 PDFs, 10 MB per file, 200 MB combined per onboarding project.
- Shop feature selected: up to 500 photos, 15 PDFs, 10 MB per file, 750 MB combined per onboarding project.
- The `client-onboarding` Edge Function derives the shop entitlement from `website_requests.configuration` and enforces limits server-side. Files are uploaded in batches of 20, with up to four browser transfers in parallel.
- No database migration is needed for v35. Deploy the updated Edge Function from the v35 project root:

```powershell
npx.cmd supabase functions deploy client-onboarding --use-api --remote=otfxqesrvpmabxwsblqb
```

## Origin configuration

The onboarding function allows local origins `http://localhost:8000` and `http://127.0.0.1:8000` by default. Set the `ALLOWED_ORIGINS` Edge Function secret to the exact production origin(s) before hosting publicly. Do not add wildcard origins.

## Email and automation

Brevo sender-domain verification and API secrets are still pending; onboarding invites must be copied from the admin panel and shared manually for now. n8n is not connected; existing request-created events remain pending in `website_automation_outbox` until a workflow is connected.
