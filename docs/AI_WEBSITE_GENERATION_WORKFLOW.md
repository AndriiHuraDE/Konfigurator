# pimentaGROUP — Website generation handoff

## Intended customer flow

1. The customer selects website options in the configurator.
2. `submit-website-request` validates the selected feature IDs and server-side prices, then stores the canonical `websiteGenerationRequest` inside `website_requests.configuration`.
3. pimentaGROUP creates an onboarding invitation. The customer completes business, service, team, product, FAQ, social, integration and legal details and uploads materials.
4. The customer submits onboarding and confirms rights for all materials uploaded with the original request and during onboarding.
5. A pimentaGROUP administrator opens the request in `/admin/` and downloads the AI job package.
6. The admin attaches the Reference Kit ZIP and the customer job ZIP (or two job ZIP parts) to a separate ChatGPT conversation for that customer.
7. ChatGPT produces a website draft. pimentaGROUP reviews the code, copy, assets, legal pages and real integrations before publication.

## Canonical contracts

- Configurator intake: payload `schemaVersion: 2`.
- Stored request configuration: `configuration.schemaVersion: 2`.
- `configuration.websiteGenerationRequest`: contract `pimentaGROUP.website-generation-request`, version `1.0.0`, validated against `schemas/WebsiteGenerationRequest.schema.json`.
- Final AI handoff: `schemas/WebsiteGenerationSpec.schema.json`, contract `pimentaGROUP.WebsiteGenerationSpec`, version `1.0.0`.
- Reference kit: `pimentaGROUP-ai-reference-kit`, version `2.0.0`.
- Migration `20261126000100_website_generation_handoff.sql`: adds the `products` asset category and raises the onboarding JSON payload limit from 60 KB to 120 KB. Apply it before using the new product-photo category and expanded onboarding data.

The request Edge Function constructs the stored generation request from validated server-side feature IDs and price catalog data. It does not trust a client-supplied feature description or price as the authoritative source.

## Data treatment

The generated customer package contains:

- selected feature IDs and server-normalized labels/categories;
- page and section requirements derived from selected options;
- business/public contact data supplied in onboarding;
- brand choices and target languages;
- service, staff, product and FAQ lines, both parsed fields and original source lines;
- integration preferences supplied by the customer;
- customer assets and paths inside the ZIP package;
- explicit readiness and missing-information warnings.

It excludes the requester's private contact email/phone, internal admin notes, billing details, service-role/API keys, invitation bearer tokens and temporary signed Storage URLs.

If uploaded assets exceed the 470 MiB manual-chat handoff budget, the admin exporter prioritizes logo, documents, team, original-request assets and products before gallery/other. Omitted assets are explicitly listed in `assetsExcluded`; the AI must not pretend it can access them.

Uploaded files are not exported to the AI package until the customer has explicitly confirmed the updated rights statement (`assetRightsConfirmationVersion: v2`) for all files, including images attached to the original request. Existing confirmations from the earlier onboarding wording are not reused; the customer must confirm again. The confirmation is not a substitute for pimentaGROUP's review of whether the relevant licence/consent is sufficient for the intended use.

## Manual ChatGPT Free limits

The admin exporter creates at most two ZIP job parts, each targeted below 400 MiB, with a combined customer-package source size capped at 470 MiB to leave room for the Reference Kit within Free-plan storage limits. The Reference Kit plus two job parts use up to three file uploads in one day. Current ChatGPT Free file upload limits are account- and time-sensitive; check the product message if uploads are restricted. If the customer package cannot be created within the supported size, reduce or curate the asset selection rather than silently omit files.

## Production boundary

This manual ChatGPT workflow does not automatically process requests, call Supabase or n8n, provision hosting, or publish sites. A later production generator will require a secure server-side API workflow, controlled code execution, isolated per-customer workspaces, automated tests and human approval.
