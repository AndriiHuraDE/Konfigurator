# pimentaGROUP Web Concierge — v37

## Purpose

This repository contains the pimentaGROUP Web Concierge configurator, the internal request admin panel, the customer onboarding portal and the Supabase Edge Functions behind them. It is the intake and customer-data side of the future AI website-generation workflow. The public salon Demo Website is a separate project and is not part of this repository.

## Customer workflow

1. A customer selects the website options in the configurator and submits a request.
2. The request is validated server-side. The server recalculates the pimentaGROUP feature prices and stores the selected feature groups plus a normalized `websiteGenerationRequest` in `website_requests.configuration`.
3. An administrator opens the request in `/admin/` and creates an onboarding invitation.
4. The customer completes business details, brand preferences, services, team, products, FAQs, social profile URLs, integration preferences and legal information. The customer can upload a logo, team photos, gallery images, product photos and documents.
5. Before customer assets can be exported for AI use, the customer must explicitly confirm the updated v2 usage-rights statement. This statement covers both files attached to the original request and later onboarding uploads.
6. The administrator downloads the AI job ZIP package from the request details.
7. For the current manual ChatGPT Free workflow, the administrator attaches the AI Reference Kit v2 ZIP and the client job ZIP (or both client-job parts) to a separate ChatGPT conversation for that customer. ChatGPT creates a draft; pimentaGROUP reviews it before publication.

## AI data contracts

- Configurator request payload: `schemaVersion: 2`.
- Stored request configuration: `configuration.schemaVersion: 2`.
- Request-stage contract: `configuration.websiteGenerationRequest`, validated by `schemas/WebsiteGenerationRequest.schema.json`, version `1.0.0`.
- Complete post-onboarding handoff: `schemas/WebsiteGenerationSpec.schema.json`, version `1.0.0`.
- Reference kit identifier/version: `pimentaGROUP-ai-reference-kit`, version `2.0.0`.

The final `WebsiteGenerationSpec` combines the server-normalized feature selection with onboarding business data and customer assets. It excludes the requester's private contact email/phone, internal admin notes, billing details, Supabase secrets, invitation tokens and temporary signed URLs. pimentaGROUP subscription/setup prices are stripped from the AI-facing feature list so the model does not confuse them with the customer's service/product prices.

## Onboarding information

The onboarding form accepts:

- Business name, address, public email/phone/website and opening hours.
- Business description, specialties and target audience.
- Services: one per line, `Name | price | duration | optional description`.
- Team: one per line, `Name | role | specialities | optional photo filename`.
- Products: one per line, `Name | price | description | optional SKU/variant | optional image filename`.
- FAQs: one per line, `Question | answer`.
- Website languages, requested visual style and optional primary/secondary colors.
- Social profile URLs: one per line, `Platform | public URL`.
- Booking provider/URL, review profile URL, shop payment provider and newsletter service.
- Legal company name, legal form, representative, register details, VAT ID and responsible person.
- Additional notes.

Structured lines are parsed into fields while the original source lines are retained for review. Lines that cannot be parsed reliably are marked `needs_review` in the AI spec; the model must not guess missing values.

## Asset upload and export limits

- Without the `shop` feature: up to 50 image files.
- With the `shop` feature: up to 500 image files.
- PDF documents: up to 15 per project.
- Maximum individual onboarding file size: 10 MB.
- Aggregate onboarding material budget: 200 MB without shop or 750 MB with shop.
- Upload batches: up to 20 files.
- Accepted formats: JPEG, PNG, WebP and PDF. The separate product-image category accepts images only.

The new migration `supabase/migrations/20261126000100_website_generation_handoff.sql` adds the `products` asset category and raises the onboarding JSON payload limit from 60 KB to 120 KB. Apply the migration before using the expanded form and product-image category.

For ChatGPT Free, the admin exporter targets a combined job-asset budget of 470 MiB and at most two ZIP parts, each below 400 MiB. If the customer uploaded more than the manual package budget, the exporter prioritizes logo, documents, team photos, original-request files and product images before gallery/other images. Omitted files are listed in `assetsExcluded`; the AI must not pretend those files are available. This is a manual pilot limit, not a limit on the long-term generator design.

## AI package export

Open a request in `/admin/` and choose **AI-Website-Paket herunterladen (ZIP)**. The browser downloads the private assets using the authenticated administrator session and builds the package locally. The package includes:

- `WebsiteGenerationSpec.json`;
- `ASSET_MANIFEST.json` and `CHATGPT_TASK.txt`;
- approved customer files under `assets/`;
- an explicit `assetsExcluded` list when some assets are omitted due to the Free-plan package budget.

For two-part packages, part 01 contains the spec and the first assets; part 02 contains the remaining included assets and its manifest. The customer must have confirmed asset rights version `v2`. Existing confirmations saved under the earlier wording are intentionally not reused: the customer must actively confirm again.

The exporter uses JSZip 3.10.1 from a pinned CDN URL. It does not send customer data to ChatGPT or any OpenAI API. The administrator must upload the Reference Kit and job ZIP(s) manually in a separate ChatGPT conversation. ChatGPT Free limits and ZIP/Data Analysis availability can change; check the current ChatGPT UI/help limits.

## Supabase deployment

The request/onboarding data extensions use the existing JSONB columns; the only schema change is the migration described above. From the project root, preview and then apply pending migrations:

```powershell
npx.cmd supabase db push --dry-run --remote=otfxqesrvpmabxwsblqb
```

```powershell
npx.cmd supabase db push --remote=otfxqesrvpmabxwsblqb
```

Then deploy both updated Edge Functions:

```powershell
npx.cmd supabase functions deploy submit-website-request --remote=otfxqesrvpmabxwsblqb --use-api
```

```powershell
npx.cmd supabase functions deploy client-onboarding --remote=otfxqesrvpmabxwsblqb --use-api
```

Review the target project and migration list in the CLI before confirming. Do not bypass confirmation.

Required Edge Function secrets are described in `supabase/functions/.env.example`. Do not commit a real `.env` file, service-role key, Brevo API key, n8n secret or database password.

## Local development

From the project root:

```powershell
python -m http.server 8000
```

- Configurator: `http://localhost:8000/`
- Admin: `http://localhost:8000/admin/`
- Customer onboarding: `http://localhost:8000/onboarding/`

The public frontend uses the Supabase publishable key. All privileged operations and private Storage downloads are performed through Edge Functions or authenticated admin access with RLS.

## Production boundary

The manual ChatGPT Free workflow is not an unattended production generator. It does not automatically receive requests, process Supabase events, call n8n, provision hosting or publish sites. Generated websites remain drafts until pimentaGROUP reviews factual content, assets/rights, legal pages, security and real production integrations. Demo booking, checkout, newsletter, social, reviews and chat behaviour must never be represented as real production integrations unless a real provider/backend has been configured and tested.
