import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'website-onboarding-assets';
const MAX_UPLOAD_BATCH = 20;
const MAX_PHOTOS_WITHOUT_SHOP = 50;
const MAX_PHOTOS_WITH_SHOP = 500;
const MAX_DOCUMENTS = 15;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Per-project budgets. Supabase Free currently includes 1 GB Storage for the entire organization.
const MAX_TOTAL_SIZE_WITHOUT_SHOP = 200 * 1024 * 1024;
const MAX_TOTAL_SIZE_WITH_SHOP = 750 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_CATEGORIES = new Set(['logo', 'team', 'gallery', 'products', 'documents', 'other']);

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
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function safeFilename(value: string): string {
  const base = value.split(/[\\/]/).pop() || 'file';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeOnboardingData(input: unknown): Record<string, string> {
  const raw = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown> : {};
  return {
    businessName: cleanText(raw.businessName, 160),
    street: cleanText(raw.street, 160),
    postalCode: cleanText(raw.postalCode, 24),
    city: cleanText(raw.city, 100),
    country: cleanText(raw.country, 80),
    publicEmail: cleanText(raw.publicEmail, 160).toLowerCase(),
    publicPhone: cleanText(raw.publicPhone, 50),
    publicWebsite: normalizePublicWebsite(cleanText(raw.publicWebsite, 300)),
    openingHours: cleanText(raw.openingHours, 3000),
    aboutBusiness: cleanText(raw.aboutBusiness, 5000),
    specialties: cleanText(raw.specialties, 2500),
    targetAudience: cleanText(raw.targetAudience, 1500),
    brandStyle: cleanText(raw.brandStyle, 80),
    primaryColor: normalizeHexColor(cleanText(raw.primaryColor, 20)),
    secondaryColor: normalizeHexColor(cleanText(raw.secondaryColor, 20)),
    languages: cleanText(raw.languages, 120),
    services: cleanText(raw.services, 7000),
    team: cleanText(raw.team, 7000),
    products: cleanText(raw.products, 12000),
    faqs: cleanText(raw.faqs, 7000),
    socialLinks: cleanText(raw.socialLinks, 2500),
    bookingProvider: cleanText(raw.bookingProvider, 120),
    bookingUrl: normalizePublicWebsite(cleanText(raw.bookingUrl, 300)),
    reviewProfileUrl: normalizePublicWebsite(cleanText(raw.reviewProfileUrl, 300)),
    shopPaymentProvider: cleanText(raw.shopPaymentProvider, 120),
    newsletterProvider: cleanText(raw.newsletterProvider, 120),
    legalName: cleanText(raw.legalName, 180),
    legalForm: cleanText(raw.legalForm, 100),
    legalRepresentative: cleanText(raw.legalRepresentative, 180),
    registerCourt: cleanText(raw.registerCourt, 160),
    registerNumber: cleanText(raw.registerNumber, 100),
    vatId: cleanText(raw.vatId, 40),
    responsiblePerson: cleanText(raw.responsiblePerson, 180),
    notes: cleanText(raw.notes, 3000),
    assetRightsConfirmed: raw.assetRightsConfirmed === 'true' ? 'true' : 'false',
    assetRightsConfirmationVersion: raw.assetRightsConfirmed === 'true' ? 'v2' : '',
    assetRightsConfirmedAt: raw.assetRightsConfirmed === 'true' ? new Date().toISOString() : '',
  };
}

function normalizePublicWebsite(value: string): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString().slice(0, 300) : '';
  } catch {
    return '';
  }
}

function normalizeHexColor(value: string): string {
  return !value || /^#[0-9a-f]{6}$/i.test(value) ? value : '';
}

async function getUploadPolicy(supabase: any, requestId: string) {
  const [{ data: requestRow, error: requestError }, { data: assets, error: assetsError }] = await Promise.all([
    supabase.from('website_requests').select('configuration').eq('id', requestId).maybeSingle(),
    supabase.from('website_onboarding_assets').select('mime_type,size_bytes').eq('request_id', requestId),
  ]);
  if (requestError) throw requestError;
  if (assetsError) throw assetsError;
  if (!requestRow) throw new Error('Website request not found for onboarding upload policy.');

  const configuration = requestRow.configuration && typeof requestRow.configuration === 'object'
    ? requestRow.configuration as Record<string, unknown> : {};
  const project = configuration.project && typeof configuration.project === 'object'
    ? configuration.project as Record<string, unknown> : {};
  const features = Array.isArray(project.features) ? project.features : [];
  const hasShop = features.some((feature: unknown) =>
    feature && typeof feature === 'object' && (feature as Record<string, unknown>).id === 'shop'
  );
  const photoLimit = hasShop ? MAX_PHOTOS_WITH_SHOP : MAX_PHOTOS_WITHOUT_SHOP;
  const photoCount = (assets || []).filter((asset: Record<string, unknown>) => IMAGE_MIME.has(String(asset.mime_type))).length;
  const documentCount = (assets || []).filter((asset: Record<string, unknown>) => asset.mime_type === 'application/pdf').length;
  const totalBytes = (assets || []).reduce((sum: number, asset: Record<string, unknown>) => sum + Number(asset.size_bytes || 0), 0);

  return {
    hasShop,
    photoLimit,
    photoCount,
    documentLimit: MAX_DOCUMENTS,
    documentCount,
    maxFileBytes: MAX_FILE_SIZE,
    maxTotalBytes: hasShop ? MAX_TOTAL_SIZE_WITH_SHOP : MAX_TOTAL_SIZE_WITHOUT_SHOP,
    totalBytes,
  };
}

function isValidToken(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

function validFileSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value);
  if (mime === 'image/webp') return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (mime === 'application/pdf') return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  return false;
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, origin);

  try {
    if (origin && !allowedOrigins().has(origin)) {
      return jsonResponse({ ok: false, error: 'Diese Website ist für das Onboarding nicht freigegeben.' }, 403, origin);
    }

    const suppliedPublicKey = request.headers.get('apikey') || '';
    if (!suppliedPublicKey || !getPublishableKeys().includes(suppliedPublicKey)) {
      return jsonResponse({ ok: false, error: 'Ungültiger Projekt-Schlüssel.' }, 401, origin);
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 256 * 1024) {
      return jsonResponse({ ok: false, error: 'Die Anfrage ist zu groß.' }, 413, origin);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = getServiceKey();
    if (!supabaseUrl || !serviceKey) {
      console.error('Onboarding function is missing server-side Supabase credentials.');
      return jsonResponse({ ok: false, error: 'Der Onboarding-Service ist derzeit nicht verfügbar.' }, 503, origin);
    }

    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return jsonResponse({ ok: false, error: 'Ungültige Anfrage.' }, 400, origin);
    }
    const action = cleanText(payload.action, 40);
    const token = cleanText(payload.token, 100);
    if (!isValidToken(token)) return jsonResponse({ ok: false, error: 'Dieser Onboarding-Link ist ungültig oder unvollständig.' }, 401, origin);
    const tokenHash = await sha256(token);

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: context, error: contextError } = await supabase.rpc('get_client_onboarding_by_hash', {
      p_token_hash: tokenHash,
    });
    if (contextError) throw contextError;
    if (!context || typeof context !== 'object' || !context.requestId) {
      return jsonResponse({ ok: false, error: 'Dieser Onboarding-Link ist abgelaufen oder wurde deaktiviert. Bitte kontaktieren Sie pimentaGROUP.' }, 410, origin);
    }

    if (action === 'load') {
      const { data: assets, error: assetsError } = await supabase
        .from('website_onboarding_assets')
        .select('id,category,original_filename,mime_type,size_bytes,created_at')
        .eq('request_id', context.requestId)
        .order('created_at', { ascending: true });
      if (assetsError) throw assetsError;
      const uploadPolicy = await getUploadPolicy(supabase, String(context.requestId));
      return jsonResponse({ ok: true, profile: context, assets: assets || [], uploadPolicy }, 200, origin);
    }

    if (action === 'save') {
      const rawData = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? payload.data as Record<string, unknown> : {};
      const data = normalizeOnboardingData(rawData);
      if (cleanText(rawData.publicWebsite, 300) && !data.publicWebsite) {
        return jsonResponse({ ok: false, error: 'Bitte geben Sie eine gültige Website-Adresse mit http:// oder https:// ein.' }, 400, origin);
      }
      for (const field of ['bookingUrl', 'reviewProfileUrl']) {
        if (cleanText(rawData[field], 300) && !data[field]) {
          return jsonResponse({ ok: false, error: 'Bitte geben Sie gültige Profil- und Integrationslinks mit http:// oder https:// ein.' }, 400, origin);
        }
      }
      if ((cleanText(rawData.primaryColor, 20) && !data.primaryColor) || (cleanText(rawData.secondaryColor, 20) && !data.secondaryColor)) {
        return jsonResponse({ ok: false, error: 'Bitte verwenden Sie für Farben einen gültigen Hexwert, zum Beispiel #2F8A69.' }, 400, origin);
      }
      if (payload.submit === true) {
        if (!data.businessName || !data.city || !data.publicEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.publicEmail)) {
          return jsonResponse({ ok: false, error: 'Bitte geben Sie mindestens den Salon-Namen, den Ort und eine gültige öffentliche Kontakt-E-Mail-Adresse an.' }, 400, origin);
        }
        if (data.assetRightsConfirmed !== 'true') {
          const [{ count: onboardingCount, error: onboardingCountError }, { count: requestCount, error: requestCountError }] = await Promise.all([
            supabase.from('website_onboarding_assets').select('id', { count: 'exact', head: true }).eq('request_id', context.requestId),
            supabase.from('website_request_assets').select('id', { count: 'exact', head: true }).eq('request_id', context.requestId),
          ]);
          if (onboardingCountError) throw onboardingCountError;
          if (requestCountError) throw requestCountError;
          if (Number(onboardingCount || 0) + Number(requestCount || 0) > 0) {
            return jsonResponse({ ok: false, error: 'Bitte bestätigen Sie die Nutzungsrechte für alle bisher hochgeladenen Materialien, einschließlich der Dateien aus der ursprünglichen Anfrage.' }, 400, origin);
          }
        }
      }
      const { data: saved, error: saveError } = await supabase.rpc('save_client_onboarding_by_hash', {
        p_token_hash: tokenHash,
        p_data: data,
        p_submit: payload.submit === true,
      });
      if (saveError) {
        if (saveError.code === '28000') return jsonResponse({ ok: false, error: 'Dieser Onboarding-Link ist abgelaufen oder wurde deaktiviert.' }, 410, origin);
        throw saveError;
      }
      return jsonResponse({ ok: true, saved }, 200, origin);
    }

    if (action === 'prepare_uploads') {
      if (payload.rightsConfirmed !== true) {
        return jsonResponse({ ok: false, error: 'Bitte bestätigen Sie die erforderlichen Nutzungsrechte und Einwilligungen für die hochgeladenen Materialien.' }, 400, origin);
      }
      const files = Array.isArray(payload.files) ? payload.files : [];
      if (files.length < 1 || files.length > MAX_UPLOAD_BATCH) {
        return jsonResponse({ ok: false, error: `Dateien werden in Paketen mit höchstens ${MAX_UPLOAD_BATCH} Dateien hochgeladen. Bitte versuchen Sie es erneut.` }, 400, origin);
      }

      const policy = await getUploadPolicy(supabase, String(context.requestId));
      const validatedFiles: Array<{ name: string; mime: string; size: number; category: string; extension: string }> = [];
      let requestedBytes = 0;
      let requestedPhotos = 0;
      let requestedDocuments = 0;
      for (const item of files) {
        if (!item || typeof item !== 'object') return jsonResponse({ ok: false, error: 'Ungültige Dateiinformationen.' }, 400, origin);
        const file = item as Record<string, unknown>;
        const name = safeFilename(cleanText(file.name, 180));
        const mime = cleanText(file.type, 80);
        const size = Number(file.size || 0);
        const category = cleanText(file.category, 30);
        if (!name || !ALLOWED_MIME.has(mime) || !ALLOWED_CATEGORIES.has(category) || !Number.isSafeInteger(size) || size <= 0 || size > MAX_FILE_SIZE) {
          return jsonResponse({ ok: false, error: `Die Datei „${name || 'Datei'}“ hat ein nicht unterstütztes Format oder ist größer als 10 MB.` }, 400, origin);
        }
        if (mime === 'application/pdf') requestedDocuments++;
        else requestedPhotos++;
        requestedBytes += size;
        const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'pdf';
        validatedFiles.push({ name, mime, size, category, extension });
      }

      if (policy.photoCount + requestedPhotos > policy.photoLimit) {
        return jsonResponse({ ok: false, error: `Für dieses Projekt sind maximal ${policy.photoLimit} Fotos erlaubt. Bereits gespeichert: ${policy.photoCount}.` }, 400, origin);
      }
      if (policy.documentCount + requestedDocuments > policy.documentLimit) {
        return jsonResponse({ ok: false, error: `Für dieses Projekt sind zusätzlich maximal ${policy.documentLimit} PDF-Dokumente erlaubt. Bereits gespeichert: ${policy.documentCount}.` }, 400, origin);
      }
      if (policy.totalBytes + requestedBytes > policy.maxTotalBytes) {
        const maxMb = Math.round(policy.maxTotalBytes / (1024 * 1024));
        return jsonResponse({ ok: false, error: `Das gesamte Materialpaket darf für dieses Projekt höchstens ${maxMb} MB umfassen. Bereits gespeichert: ${(policy.totalBytes / (1024 * 1024)).toFixed(1)} MB.` }, 400, origin);
      }

      const uploadItems = [];
      for (const file of validatedFiles) {
        const storagePath = `${context.requestId}/${crypto.randomUUID()}.${file.extension}`;
        const { data: signed, error: signError } = await supabase.storage.from(BUCKET).createSignedUploadUrl(storagePath, { upsert: false });
        if (signError || !signed?.token) throw signError || new Error('Upload-Link konnte nicht erstellt werden.');
        uploadItems.push({
          originalFilename: file.name,
          mimeType: file.mime,
          sizeBytes: file.size,
          category: file.category,
          storagePath,
          uploadToken: signed.token,
        });
      }
      return jsonResponse({ ok: true, uploads: uploadItems, uploadPolicy: policy }, 200, origin);
    }

    if (action === 'register_uploads') {
      const uploads = Array.isArray(payload.uploads) ? payload.uploads : [];
      if (uploads.length > MAX_UPLOAD_BATCH) return jsonResponse({ ok: false, error: `Es können höchstens ${MAX_UPLOAD_BATCH} Dateien pro Paket registriert werden.` }, 400, origin);
      const { data: existingRows, error: existingRowsError } = await supabase
        .from('website_onboarding_assets')
        .select('storage_path,size_bytes,mime_type')
        .eq('request_id', context.requestId);
      if (existingRowsError) throw existingRowsError;
      const knownPaths = new Set((existingRows || []).map((row: Record<string, unknown>) => row.storage_path));
      const rows = [];
      const uploadedPaths: string[] = [];
      for (const item of uploads) {
        if (!item || typeof item !== 'object') continue;
        const file = item as Record<string, unknown>;
        const storagePath = cleanText(file.storagePath, 300);
        const prefix = `${context.requestId}/`;
        if (!storagePath.startsWith(prefix) || storagePath.includes('..')) continue;
        const objectName = storagePath.slice(prefix.length);
        if (!objectName || objectName.includes('/') || knownPaths.has(storagePath)) continue;
        const filename = safeFilename(cleanText(file.originalFilename, 180));
        const mime = cleanText(file.mimeType, 80);
        const size = Number(file.sizeBytes || 0);
        const category = cleanText(file.category, 30);
        if (!filename || !ALLOWED_MIME.has(mime) || !ALLOWED_CATEGORIES.has(category) || !Number.isSafeInteger(size) || size <= 0 || size > MAX_FILE_SIZE) continue;
        const { data: downloaded, error: downloadError } = await supabase.storage.from(BUCKET).download(storagePath);
        if (downloadError || !downloaded) continue;
        const bytes = new Uint8Array(await downloaded.arrayBuffer());
        if (bytes.byteLength !== size || !validFileSignature(bytes, mime)) {
          await supabase.storage.from(BUCKET).remove([storagePath]);
          continue;
        }
        uploadedPaths.push(storagePath);
        rows.push({
          request_id: context.requestId,
          category,
          original_filename: filename,
          storage_path: storagePath,
          mime_type: mime,
          size_bytes: size,
        });
      }
      if (rows.length) {
        const newPhotos = rows.filter(row => IMAGE_MIME.has(row.mime_type)).length;
        const newDocuments = rows.filter(row => row.mime_type === 'application/pdf').length;
        const existingPhotos = (existingRows || []).filter((row: Record<string, unknown>) => IMAGE_MIME.has(String(row.mime_type))).length;
        const existingDocuments = (existingRows || []).filter((row: Record<string, unknown>) => row.mime_type === 'application/pdf').length;
        const existingBytes = (existingRows || []).reduce((sum: number, row: Record<string, unknown>) => sum + Number(row.size_bytes || 0), 0);
        const newBytes = rows.reduce((sum, row) => sum + row.size_bytes, 0);
        const policy = await getUploadPolicy(supabase, String(context.requestId));
        const overLimit = existingPhotos + newPhotos > policy.photoLimit ||
          existingDocuments + newDocuments > policy.documentLimit ||
          existingBytes + newBytes > policy.maxTotalBytes;
        if (overLimit) {
          if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths);
          return jsonResponse({ ok: false, error: 'Die Upload-Grenze dieses Projekts wurde zwischenzeitlich erreicht. Bitte laden Sie weniger Dateien hoch.' }, 400, origin);
        }
        const { error: insertError } = await supabase.from('website_onboarding_assets').upsert(rows, { onConflict: 'storage_path', ignoreDuplicates: true });
        if (insertError) {
          if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths);
          throw insertError;
        }
      }
      return jsonResponse({ ok: true, registered: rows.length, requested: uploads.length }, 200, origin);
    }

    return jsonResponse({ ok: false, error: 'Unbekannte Aktion.' }, 400, origin);
  } catch (error) {
    console.error('client-onboarding failed:', error instanceof Error ? error.name : 'Unknown error');
    return jsonResponse({ ok: false, error: 'Die Angaben konnten nicht verarbeitet werden. Bitte versuchen Sie es erneut.' }, 500, origin);
  }
});
