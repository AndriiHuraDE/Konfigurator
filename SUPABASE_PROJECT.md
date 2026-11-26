# Supabase project — pimentaGROUP Web Concierge

## Project

- Project reference: `otfxqesrvpmabxwsblqb`
- Edge Function `verify_jwt`: `false` for `submit-website-request` and `client-onboarding`; each function performs its own origin, publishable-key and request/invitation-token checks.
- Public browser code must use only the Supabase publishable key. Never expose `SUPABASE_SECRET_KEYS`, `SUPABASE_SERVICE_ROLE_KEY`, database passwords, Brevo credentials or n8n webhook secrets.

## Edge Functions

### `submit-website-request`

- Accepts public `POST` multipart form data and validates the request, allowed feature IDs, server-side pricing and initial assets.
- Stores the original request plus normalized `configuration.websiteGenerationRequest` (contract `1.0.0`) in `public.website_requests.configuration`.
- Sets the integer request `schema_version` to `2` for new configurator submissions.
- Keeps the existing `configuration.project.features` array, including price data required by the admin and onboarding upload-policy logic. The AI-specific `websiteGenerationRequest.selectedFeatures` omits pimentaGROUP subscription/setup prices.

### `client-onboarding`

- Accepts token-authorized onboarding actions (`load`, `save`, `prepare_uploads`, `register_uploads`).
- Normalizes the extended JSONB onboarding data: products, FAQs, social links, booking/shop/newsletter provider preferences and legal details.
- Checks the v2 rights confirmation against both `public.website_request_assets` and `public.website_onboarding_assets` before final submission.
- Accepts the new `products` asset category for shop product photos.

## Relevant storage and tables

- `public.website_requests` — requests and JSONB configuration.
- `public.website_request_assets` — files supplied with the original request.
- `public.website_onboarding_profiles` — customer business/onboarding data in JSONB.
- `public.website_onboarding_assets` — customer logo/team/gallery/product images and documents.
- Private Storage buckets: `website-request-assets`, `website-onboarding-assets`.

The admin AI job exporter downloads assets through the authenticated administrator's Supabase session and the existing RLS Storage read policies. It does not export signed URLs, service-role credentials or invitation tokens.

## Migration

Apply `supabase/migrations/20261126000100_website_generation_handoff.sql` before deploying the updated onboarding function. It:

1. Extends the `website_onboarding_assets.category` check constraint with `products`.
2. Replaces `public.save_client_onboarding_by_hash(text, jsonb, boolean)` with the same security-definer behaviour but a 120 KB JSON payload limit (previously 60 KB).
3. Preserves the function's restricted execution grant: only `service_role` may execute it.

Preview and apply migrations from the repository root:

```powershell
npx.cmd supabase db push --dry-run --remote=otfxqesrvpmabxwsblqb
```

```powershell
npx.cmd supabase db push --remote=otfxqesrvpmabxwsblqb
```

## Deploy Edge Functions

```powershell
npx.cmd supabase functions deploy submit-website-request --remote=otfxqesrvpmabxwsblqb --use-api
```

```powershell
npx.cmd supabase functions deploy client-onboarding --remote=otfxqesrvpmabxwsblqb --use-api
```

Check the deployment target and confirm only after reviewing the displayed project reference. Configure the server-only environment keys listed in `supabase/functions/.env.example` in Supabase Function Secrets. Do not put actual values in this repository.
