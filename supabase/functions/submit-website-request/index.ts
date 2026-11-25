import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'website-request-assets';
const MAX_FILE_COUNT = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const FEATURE_CATALOG: Record<string, { name: string; monthly: number; mandatory?: boolean }> = {
  baseService: { name: 'Website, Hosting & Basis-Support', monthly: 35, mandatory: true },
  booking: { name: 'Online-Terminbuchung', monthly: 19 },
  employeeManagement: { name: 'Mitarbeiter- & Terminverwaltung', monthly: 15 },
  whatsapp: { name: 'WhatsApp-Kontakt', monthly: 0 },
  contactPlus: { name: 'Erweitertes Kontaktformular', monthly: 2 },
  gallery: { name: 'Galerie & Portfolio', monthly: 3 },
  instagramFeed: { name: 'Instagram-Integration', monthly: 4 },
  reviews: { name: 'Google-Bewertungen', monthly: 3 },
  maps: { name: 'Karte & Öffnungszeiten', monthly: 0 },
  faq: { name: 'FAQ-Bereich', monthly: 0 },
  blog: { name: 'Blog & Neuigkeiten', monthly: 5 },
  shop: { name: 'Produktverkauf / Mini-Shop', monthly: 25 },
  newsletter: { name: 'Newsletter-Anmeldung', monthly: 4 },
  mobileOptimization: { name: 'Mobile Website-Ansicht', monthly: 0, mandatory: true },
  whatsappBot: { name: 'WhatsApp-Chatbot', monthly: 19 },
  chatbot: { name: 'KI-Website-Chatbot', monthly: 19 },
  leadAssistant: { name: 'KI-Anfrage-Assistent', monthly: 12 },
  emailAssistant: { name: 'KI-E-Mail-Assistent', monthly: 9 },
  crm: { name: 'CRM-Verknüpfung', monthly: 15 },
  voice: { name: 'KI-Telefonassistent', monthly: 29 },
  automation: { name: 'Prozess-Automatisierung', monthly: 12 },
  localSEO: { name: 'Lokale SEO-Grundlagen', monthly: 9 },
  multilingual: { name: 'Mehrsprachigkeit', monthly: 12 },
};

const SOCIAL_CATALOG: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
};

const INDUSTRIES = new Set([
  'Friseursalon / Barbershop',
  'Nagelstudio',
  'Massage / Wellness',
  'Sonstiges',
]);
const WEBSITE_STATES = new Set([
  'Keine Website',
  'Veraltet / nicht mobiloptimiert',
  'Vorhanden und aktuell',
]);

function parseJsonObject(value: string | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getServiceKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const keys = parseJsonObject(Deno.env.get('SUPABASE_SECRET_KEYS'));
  return keys.default || Object.values(keys)[0] || '';
}

function getPublishableKeys(): string[] {
  const keys = parseJsonObject(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'));
  const values = Object.values(keys).filter(Boolean);
  const legacy = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacy) values.push(legacy);
  return [...new Set(values)];
}

function allowedOrigins(): Set<string> {
  const configured = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',').map(value => value.trim()).filter(Boolean);
  const defaults = [
    'http://localhost:8000', 'http://127.0.0.1:8000',
    'http://localhost:5500', 'http://127.0.0.1:5500',
  ];
  return new Set(configured.length ? configured : defaults);
}

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
  if (origin && allowedOrigins().has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function jsonResponse(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function makeReferenceCode(): string {
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const suffix = [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
  return `PG-${date}-${suffix}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function hasValidImageSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value);
  if (mime === 'image/webp') {
    return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  return false;
}

function safeFilename(value: string): string {
  const base = value.split(/[\\/]/).pop() || 'image';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'image';
}

async function sendBrevoEmail(args: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<'sent' | 'not_configured' | 'failed'> {
  const apiKey = Deno.env.get('BREVO_API_KEY');
  const from = Deno.env.get('FROM_EMAIL');
  const fromName = Deno.env.get('FROM_NAME') || 'pimentaGROUP';
  if (!apiKey || !from) return 'not_configured';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) {
    console.error('Brevo sender address is not a valid email address.');
    return 'failed';
  }
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: from, name: fromName },
        to: [{ email: args.to }],
        subject: args.subject,
        textContent: args.text,
        ...(args.replyTo ? { replyTo: { email: args.replyTo } } : {}),
        tags: ['pimenta-website-request'],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      // Do not log message bodies or recipient data; retain only provider status.
      console.error('Brevo request failed with HTTP status:', response.status);
      return 'failed';
    }
    const result = await response.json().catch(() => ({}));
    if (!result || typeof result.messageId !== 'string' || !result.messageId) {
      console.error('Brevo accepted no message identifier for the email request.');
      return 'failed';
    }
    return 'sent';
  } catch (error) {
    console.error('Brevo transport error:', error instanceof Error ? error.name : 'Unknown error');
    return 'failed';
  }
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, origin);

  try {
    if (origin && !allowedOrigins().has(origin)) {
      return jsonResponse({ ok: false, error: 'This website is not allowed to send requests.' }, 403, origin);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = getServiceKey();
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase URL or server secret key.');
      return jsonResponse({ ok: false, error: 'Der Anfrage-Service ist derzeit nicht verfügbar.' }, 503, origin);
    }

    const suppliedPublicKey = request.headers.get('apikey') || '';
    const validPublicKeys = getPublishableKeys();
    if (!suppliedPublicKey || !validPublicKeys.includes(suppliedPublicKey)) {
      return jsonResponse({ ok: false, error: 'Invalid project key.' }, 401, origin);
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 22 * 1024 * 1024) {
      return jsonResponse({ ok: false, error: 'Die Anfrage ist zu groß. Bitte reduzieren Sie die Anzahl oder Größe der Bilder.' }, 413, origin);
    }

    const form = await request.formData();
    const payloadText = form.get('payload');
    if (typeof payloadText !== 'string' || payloadText.length > 256 * 1024) {
      return jsonResponse({ ok: false, error: 'Die Konfigurationsdaten fehlen oder sind zu groß.' }, 400, origin);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      return jsonResponse({ ok: false, error: 'Die Konfiguration konnte nicht gelesen werden.' }, 400, origin);
    }

    const honeypot = cleanText(payload.website, 200);
    if (honeypot) {
      // Return a generic success to automated spam; do not store it.
      return jsonResponse({ ok: true, referenceCode: '', assetsUploaded: 0, assetsFailed: 0,
        notifications: { admin: 'not_configured', customer: 'not_configured' }, automation: 'not_configured' }, 200, origin);
    }

    if (payload.creationMode !== 'simple' || !payload.project || typeof payload.project !== 'object') {
      return jsonResponse({ ok: false, error: 'Nicht unterstützter Konfigurationstyp.' }, 400, origin);
    }

    const project = payload.project as Record<string, unknown>;
    const contact = payload.contact && typeof payload.contact === 'object'
      ? payload.contact as Record<string, unknown> : {};
    const name = cleanText(contact.name, 120);
    const email = cleanText(contact.email, 160).toLowerCase();
    const businessName = cleanText(contact.company || project.businessName, 120);
    const phone = cleanText(contact.phone, 40);
    const currentWebsite = cleanText(contact.currentWebsite, 300);
    const message = cleanText(contact.message, 1500);
    const consent = contact.consent === true;
    const consentAtRaw = cleanText(contact.consentAt, 60);
    const consentAt = consentAtRaw && !Number.isNaN(Date.parse(consentAtRaw)) ? new Date(consentAtRaw).toISOString() : null;
    const industry = cleanText(project.industry, 80);
    const websiteStatus = cleanText(project.websiteStatus, 80);
    const billingStart = project.pricing && typeof project.pricing === 'object' &&
      (project.pricing as Record<string, unknown>).billingStart === 'immediate' ? 'immediate' : 'trial';

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !consent || !consentAt) {
      return jsonResponse({ ok: false, error: 'Bitte prüfen Sie Name, E-Mail-Adresse und Ihre Zustimmung zur Kontaktaufnahme.' }, 400, origin);
    }
    if (!INDUSTRIES.has(industry) || !WEBSITE_STATES.has(websiteStatus)) {
      return jsonResponse({ ok: false, error: 'Bitte wählen Sie eine gültige Branche und Website-Situation.' }, 400, origin);
    }
    if (currentWebsite) {
      try {
        const url = new URL(currentWebsite);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch {
        return jsonResponse({ ok: false, error: 'Die Website-Adresse ist ungültig.' }, 400, origin);
      }
    }

    const submissionId = isUuid(payload.submissionId) ? payload.submissionId : '';
    if (!submissionId) return jsonResponse({ ok: false, error: 'Die Anfrage-ID ist ungültig. Bitte laden Sie die Seite neu.' }, 400, origin);

    const submittedFeatures = Array.isArray(project.selectedFeatures) ? project.selectedFeatures : [];
    const featureIds = [...new Set(submittedFeatures.map((item: unknown) =>
      item && typeof item === 'object' ? cleanText((item as Record<string, unknown>).id, 64) : ''
    ).filter(Boolean))];
    if (!featureIds.includes('baseService') || !featureIds.includes('mobileOptimization') ||
        featureIds.some(id => !FEATURE_CATALOG[id])) {
      return jsonResponse({ ok: false, error: 'Die Funktionsauswahl ist ungültig. Bitte aktualisieren Sie die Seite.' }, 400, origin);
    }

    const socialSubmitted = Array.isArray(project.socialProfiles) ? project.socialProfiles : [];
    const socialIds = [...new Set(socialSubmitted.map((item: unknown) =>
      item && typeof item === 'object' ? cleanText((item as Record<string, unknown>).id, 32) : ''
    ).filter(Boolean))];
    if (socialIds.some(id => !SOCIAL_CATALOG[id])) {
      return jsonResponse({ ok: false, error: 'Die Social-Media-Auswahl ist ungültig.' }, 400, origin);
    }

    const normalizedFeatures = featureIds.map(id => ({
      id,
      name: FEATURE_CATALOG[id].name,
      monthlyPrice: FEATURE_CATALOG[id].monthly,
    }));
    const normalizedSocial = socialIds.map(id => ({ id, name: SOCIAL_CATALOG[id], setupPrice: 5 }));
    const monthlyTotal = normalizedFeatures.reduce((sum, feature) => sum + feature.monthlyPrice, 0);
    const oneTimeTotal = normalizedSocial.length * 5;
    const freeTrialMonths = billingStart === 'trial' ? 2 : 0;
    const submittedAt = cleanText(payload.submittedAt, 60);

    const normalizedConfiguration = {
      schemaVersion: 1,
      source: 'pimentaGROUP Website-Konfigurator',
      creationMode: 'simple',
      project: {
        type: cleanText(project.type, 80),
        projectKey: cleanText(project.projectKey, 40),
        industry,
        businessName,
        websiteStatus,
        features: normalizedFeatures,
        socialProfiles: normalizedSocial,
        editorMode: 'simple',
      },
      billingPreference: { start: billingStart, freeTrialMonths },
      submittedAt: submittedAt && !Number.isNaN(Date.parse(submittedAt)) ? new Date(submittedAt).toISOString() : null,
    };
    const pricingSnapshot = {
      currency: 'EUR',
      monthlyTotal,
      oneTimeTotal,
      baseMonthly: FEATURE_CATALOG.baseService.monthly,
      freeTrialMonths,
      billingStart,
      calculationVersion: 1,
      priceStatus: 'Vorläufige Preisorientierung; verbindlich erst nach individuellem Angebot.',
    };

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Idempotency check first: a retry after a network timeout must not create a second lead.
    const { data: existing, error: existingError } = await supabase
      .from('website_requests')
      .select('id, reference_code, admin_email_status, customer_email_status, automation_status')
      .eq('submission_id', submissionId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return jsonResponse({
        ok: true,
        idempotent: true,
        requestId: existing.id,
        referenceCode: existing.reference_code,
        assetsUploaded: 0,
        assetsFailed: 0,
        notifications: { admin: existing.admin_email_status, customer: existing.customer_email_status },
        automation: existing.automation_status,
      }, 200, origin);
    }

    const ip = request.headers.get('cf-connecting-ip') ||
      (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const rateFingerprint = await sha256(`${ip}|${email}`);
    const { data: allowed, error: rateError } = await supabase.rpc('consume_website_request_rate_limit', {
      p_fingerprint_hash: rateFingerprint,
      p_max_attempts: 5,
      p_window_minutes: 60,
    });
    if (rateError) throw rateError;
    if (allowed !== true) {
      return jsonResponse({ ok: false, error: 'Zu viele Anfragen. Bitte versuchen Sie es in einer Stunde erneut.' }, 429, origin);
    }

    const files = form.getAll('assets').filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length > MAX_FILE_COUNT) {
      return jsonResponse({ ok: false, error: `Bitte laden Sie höchstens ${MAX_FILE_COUNT} Bilder hoch.` }, 400, origin);
    }
    let totalBytes = 0;
    const inspectedFiles: Array<{ file: File; bytes: Uint8Array; extension: string }> = [];
    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return jsonResponse({ ok: false, error: 'Erlaubt sind ausschließlich JPG-, PNG- und WebP-Bilder.' }, 400, origin);
      }
      if (file.size > MAX_FILE_SIZE) {
        return jsonResponse({ ok: false, error: `Die Datei „${safeFilename(file.name)}“ ist größer als 5 MB.` }, 400, origin);
      }
      totalBytes += file.size;
      if (totalBytes > MAX_TOTAL_FILE_SIZE) {
        return jsonResponse({ ok: false, error: 'Die Bilder dürfen zusammen höchstens 20 MB groß sein.' }, 400, origin);
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!hasValidImageSignature(bytes, file.type)) {
        return jsonResponse({ ok: false, error: `Die Datei „${safeFilename(file.name)}“ ist kein gültiges Bild des angegebenen Formats.` }, 400, origin);
      }
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
      inspectedFiles.push({ file, bytes, extension });
    }

    const referenceCode = makeReferenceCode();
    const requestRow = {
      submission_id: submissionId,
      reference_code: referenceCode,
      source: 'pimentaGROUP Website-Konfigurator',
      schema_version: 1,
      creation_mode: 'simple',
      status: 'new',
      industry,
      project_type: cleanText(project.type, 80),
      website_status: websiteStatus,
      contact_name: name,
      business_name: businessName || null,
      email,
      phone: phone || null,
      current_website: currentWebsite || null,
      message: message || null,
      contact_consent: true,
      consent_at: consentAt,
      billing_start: billingStart,
      free_trial_months: freeTrialMonths,
      monthly_total: monthlyTotal,
      one_time_total: oneTimeTotal,
      currency: 'EUR',
      pricing_snapshot: pricingSnapshot,
      configuration: normalizedConfiguration,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('website_requests')
      .insert(requestRow)
      .select('id, reference_code')
      .single();
    if (insertError) throw insertError;

    let assetsUploaded = 0;
    let assetsFailed = 0;
    for (const inspected of inspectedFiles) {
      const storagePath = `requests/${inserted.id}/${crypto.randomUUID()}.${inspected.extension}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, inspected.bytes, {
        contentType: inspected.file.type,
        upsert: false,
      });
      if (uploadError) {
        console.error('Asset upload failed:', uploadError);
        assetsFailed++;
        continue;
      }
      const { error: assetRowError } = await supabase.from('website_request_assets').insert({
        request_id: inserted.id,
        original_filename: safeFilename(inspected.file.name),
        storage_path: storagePath,
        mime_type: inspected.file.type,
        size_bytes: inspected.file.size,
      });
      if (assetRowError) {
        console.error('Asset metadata insert failed:', assetRowError);
        await supabase.storage.from(BUCKET).remove([storagePath]);
        assetsFailed++;
        continue;
      }
      assetsUploaded++;
    }

    const featureLines = normalizedFeatures.map(feature => `- ${feature.name}: ${feature.monthlyPrice.toFixed(2)} EUR / Monat`).join('\n');
    const socialLines = normalizedSocial.map(item => `- ${item.name}: 5.00 EUR einmalig`).join('\n');
    const timing = billingStart === 'trial' ? '2 Monate kostenlos; danach monatlich' : 'Monatliche Zahlung ab sofort gewünscht';
    const internalEmail = Deno.env.get('NOTIFICATION_EMAIL') || '';
    const adminStatus = internalEmail ? await sendBrevoEmail({
      to: internalEmail,
      replyTo: email,
      subject: `Neue Website-Anfrage ${referenceCode} · ${businessName || name}`,
      text: [
        `Neue Anfrage: ${referenceCode}`,
        `Kontakt: ${name}`,
        `Unternehmen: ${businessName || 'Nicht angegeben'}`,
        `E-Mail: ${email}`,
        `Telefon: ${phone || 'Nicht angegeben'}`,
        `Branche: ${industry}`,
        `Website-Situation: ${websiteStatus}`,
        `Zahlungsbeginn: ${timing}`,
        `Monatlicher Richtwert: ${monthlyTotal.toFixed(2)} EUR`,
        `Einmalige Einrichtung: ${oneTimeTotal.toFixed(2)} EUR`,
        '', 'Ausgewählte Funktionen:', featureLines,
        '', 'Social-Media-Profile:', socialLines || 'Keine',
        '', 'Nachricht:', message || 'Keine',
        '', `Interne Request-ID: ${inserted.id}`,
      ].join('\n'),
    }) : 'not_configured';

    const customerReplyTo = Deno.env.get('CUSTOMER_REPLY_TO_EMAIL') || internalEmail;
    const customerStatus = await sendBrevoEmail({
      to: email,
      replyTo: customerReplyTo || undefined,
      subject: `Ihre Anfrage bei pimentaGROUP · ${referenceCode}`,
      text: [
        `Guten Tag ${name},`,
        '',
        'vielen Dank für Ihre Anfrage und Ihr Interesse an einer Website von pimentaGROUP.',
        `Ihre Anfrage wurde unter der Referenz ${referenceCode} gespeichert.`,
        'Wir prüfen Ihre Auswahl und melden uns persönlich mit den nächsten Schritten.',
        '',
        `Gewünschter Zahlungsbeginn: ${timing}.`,
        `Vorläufiger monatlicher Richtwert: ${monthlyTotal.toFixed(2)} EUR.`,
        `Einmalige Profileinrichtung: ${oneTimeTotal.toFixed(2)} EUR.`,
        '',
        'Dies ist noch keine Bestellung und kein Vertrag. Eine kostenpflichtige Leistung beginnt erst nach einem individuellen Angebot und Ihrer ausdrücklichen Zustimmung.',
        '',
        'Freundliche Grüße',
        'Ihr pimentaGROUP Team',
      ].join('\n'),
    });

    let automationStatus: 'sent' | 'pending' | 'failed' = 'pending';
    const n8nUrl = Deno.env.get('N8N_REQUEST_WEBHOOK_URL');
    const n8nSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    if (n8nUrl && n8nSecret) {
      try {
        const webhookResponse = await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${n8nSecret}` },
          body: JSON.stringify({ event: 'website_request.created', requestId: inserted.id, referenceCode }),
          signal: AbortSignal.timeout(10000),
        });
        automationStatus = webhookResponse.ok ? 'sent' : 'failed';
        if (webhookResponse.ok) {
          await supabase.from('website_automation_outbox').update({ status: 'delivered', delivered_at: new Date().toISOString(), attempt_count: 1 })
            .eq('request_id', inserted.id).eq('event_type', 'website_request.created');
        } else {
          const webhookError = (await webhookResponse.text()).slice(0, 500);
          console.error('n8n webhook failed:', webhookResponse.status, webhookError);
          await supabase.from('website_automation_outbox').update({ status: 'failed', attempt_count: 1, last_error: `HTTP ${webhookResponse.status}: ${webhookError}` })
            .eq('request_id', inserted.id).eq('event_type', 'website_request.created');
        }
      } catch (error) {
        console.error('n8n webhook error:', error);
        automationStatus = 'failed';
        await supabase.from('website_automation_outbox').update({ status: 'failed', attempt_count: 1, last_error: String(error).slice(0, 500) })
          .eq('request_id', inserted.id).eq('event_type', 'website_request.created');
      }
    }

    const { error: updateError } = await supabase.from('website_requests').update({
      admin_email_status: adminStatus,
      customer_email_status: customerStatus,
      automation_status: automationStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', inserted.id);
    if (updateError) console.error('Could not update notification status:', updateError);

    return jsonResponse({
      ok: true,
      requestId: inserted.id,
      referenceCode,
      assetsUploaded,
      assetsFailed,
      notifications: { admin: adminStatus, customer: customerStatus },
      automation: automationStatus,
    }, 200, origin);
  } catch (error) {
    console.error('submit-website-request failed:', error);
    return jsonResponse({
      ok: false,
      error: 'Die Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut oder speichern Sie Ihre Konfiguration lokal.',
    }, 500, origin);
  }
});
