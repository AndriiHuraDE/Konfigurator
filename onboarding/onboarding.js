import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CFG = window.PIMENTA_CONFIG || {};
const SUPABASE_URL = CFG.SUPABASE_URL || '';
const SUPABASE_KEY = CFG.SUPABASE_PUBLISHABLE_KEY || '';
const FUNCTION_NAME = 'client-onboarding';
const BUCKET = 'website-onboarding-assets';
const TOKEN_STORAGE_KEY = 'pimenta_webconcierge_onboarding_token_v1';
const MAX_UPLOAD_BATCH = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DOCUMENT_LIMIT = 15;
const DEFAULT_UPLOAD_POLICY = { hasShop: false, photoLimit: 50, photoCount: 0, documentLimit: DOCUMENT_LIMIT, documentCount: 0, maxFileBytes: MAX_FILE_SIZE, maxTotalBytes: 200 * 1024 * 1024, totalBytes: 0 };
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_MIME = new Set([...IMAGE_MIME, 'application/pdf']);
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

let token = '';
let profile = null;
let existingAssets = [];
let uploadPolicy = { ...DEFAULT_UPLOAD_POLICY };
let busy = false;

function showMessage(message, isError = false) {
  const box = $('formMessage');
  box.textContent = message;
  box.classList.toggle('error', isError);
  box.hidden = !message;
  if (message) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showInvalid(message) {
  $('loadingView').hidden = true;
  $('formView').hidden = true;
  $('invalidView').hidden = false;
  $('invalidMessage').textContent = message;
}

function setBusy(value, mode = '') {
  busy = value;
  $('saveDraftButton').disabled = value;
  $('submitButton').disabled = value;
  $('saveDraftButton').textContent = value && mode === 'draft' ? 'Speichert …' : 'Zwischenspeichern';
  $('submitButton').innerHTML = value && mode === 'submit' ? 'Wird übermittelt …' : 'Angaben vollständig einreichen <span aria-hidden="true">→</span>';
  document.querySelectorAll('input,select,textarea').forEach(el => el.disabled = value);
}

async function api(action, extra = {}) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
    body: JSON.stringify({ action, token, ...extra }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok !== true) {
    throw new Error(result.error || `Anfrage fehlgeschlagen (HTTP ${response.status}).`);
  }
  return result;
}

function updateProgress() {
  const fields = ['businessName','city','publicEmail','aboutBusiness','services','brandStyle'];
  const filled = fields.filter(id => $(id).value.trim()).length;
  const percent = Math.round(filled / fields.length * 100);
  $('progressBar').style.width = `${percent}%`;
  $('progressLabel').textContent = profile?.status === 'submitted'
    ? 'Angaben bereits eingereicht – Sie können sie weiterhin bearbeiten'
    : `${percent}% der wichtigsten Angaben ausgefüllt`;
}

function readFormData() {
  return {
    businessName: $('businessName').value.trim(),
    street: $('street').value.trim(),
    postalCode: $('postalCode').value.trim(),
    city: $('city').value.trim(),
    country: $('country').value.trim(),
    publicEmail: $('publicEmail').value.trim(),
    publicPhone: $('publicPhone').value.trim(),
    publicWebsite: $('publicWebsite').value.trim(),
    openingHours: $('openingHours').value.trim(),
    aboutBusiness: $('aboutBusiness').value.trim(),
    specialties: $('specialties').value.trim(),
    targetAudience: $('targetAudience').value.trim(),
    brandStyle: $('brandStyle').value,
    primaryColor: $('primaryColorText').value.trim(),
    secondaryColor: $('secondaryColorText').value.trim(),
    languages: $('languages').value.trim(),
    services: $('services').value.trim(),
    team: $('team').value.trim(),
    products: $('products').value.trim(),
    faqs: $('faqs').value.trim(),
    socialLinks: $('socialLinks').value.trim(),
    bookingProvider: $('bookingProvider').value.trim(),
    bookingUrl: $('bookingUrl').value.trim(),
    reviewProfileUrl: $('reviewProfileUrl').value.trim(),
    shopPaymentProvider: $('shopPaymentProvider').value.trim(),
    newsletterProvider: $('newsletterProvider').value.trim(),
    legalName: $('legalName').value.trim(),
    legalForm: $('legalForm').value.trim(),
    legalRepresentative: $('legalRepresentative').value.trim(),
    registerCourt: $('registerCourt').value.trim(),
    registerNumber: $('registerNumber').value.trim(),
    vatId: $('vatId').value.trim(),
    responsiblePerson: $('responsiblePerson').value.trim(),
    notes: $('notes').value.trim(),
    assetRightsConfirmed: $('assetRightsConfirmed').checked ? 'true' : 'false',
    assetRightsConfirmedAt: $('assetRightsConfirmed').checked ? new Date().toISOString() : '',
  };
}

function fillForm(data = {}) {
  const fields = [
    'businessName','street','postalCode','city','country','publicEmail','publicPhone','publicWebsite','openingHours',
    'aboutBusiness','specialties','targetAudience','brandStyle','primaryColor','secondaryColor','languages','services','team','products','faqs','socialLinks',
    'bookingProvider','bookingUrl','reviewProfileUrl','shopPaymentProvider','newsletterProvider','legalName','legalForm','legalRepresentative','registerCourt','registerNumber','vatId','responsiblePerson','notes',
  ];
  fields.forEach(key => { if (typeof data[key] === 'string' && $(key)) $(key).value = data[key]; });
  // A pre-v37 consent covered onboarding uploads only. Require an explicit re-confirmation for the v2 scope, which also covers initial request uploads.
  if (data.assetRightsConfirmed === 'true' && data.assetRightsConfirmationVersion === 'v2') $('assetRightsConfirmed').checked = true;
  if (data.primaryColor && /^#[0-9a-f]{6}$/i.test(data.primaryColor)) $('primaryColor').value = data.primaryColor;
  if (data.secondaryColor && /^#[0-9a-f]{6}$/i.test(data.secondaryColor)) $('secondaryColor').value = data.secondaryColor;
  $('primaryColorText').value = $('primaryColor').value;
  $('secondaryColorText').value = $('secondaryColor').value;
  updateProgress();
}

function selectedFiles() {
  const output = [];
  document.querySelectorAll('input[type="file"][data-category]').forEach(input => {
    [...(input.files || [])].forEach(file => output.push({ file, category: input.dataset.category }));
  });
  return output;
}

function countAssetTypes(assets) {
  return {
    photos: assets.filter(asset => IMAGE_MIME.has(asset.mime_type)).length,
    documents: assets.filter(asset => asset.mime_type === 'application/pdf').length,
    bytes: assets.reduce((sum, asset) => sum + Number(asset.size_bytes || 0), 0),
  };
}

function updateUploadGuidance() {
  const usage = countAssetTypes(existingAssets);
  const maxMb = Math.round(uploadPolicy.maxTotalBytes / (1024 * 1024));
  $('uploadRules').textContent = `Für dieses Projekt: bis zu ${uploadPolicy.photoLimit} Fotos${uploadPolicy.hasShop ? ' (inkl. Mini-Shop)' : ''} und ${uploadPolicy.documentLimit} PDF-Dokumente. Maximal 10 MB pro Datei und ${maxMb} MB Gesamtvolumen.`;
  $('uploadUsage').textContent = `Bereits gespeichert: ${usage.photos}/${uploadPolicy.photoLimit} Fotos · ${usage.documents}/${uploadPolicy.documentLimit} PDFs · ${(usage.bytes / 1024 / 1024).toFixed(1)}/${maxMb} MB`;
}

function renderSelectedFiles() {
  const files = selectedFiles();
  const container = $('selectedFiles');
  if (!files.length) { container.hidden = true; container.innerHTML = ''; return; }
  const photos = files.filter(item => IMAGE_MIME.has(item.file.type)).length;
  const documents = files.filter(item => item.file.type === 'application/pdf').length;
  container.hidden = false;
  const visibleFiles = files.slice(0, 20);
  container.innerHTML = `<strong style="font-size:11px">Ausgewählt: ${photos} Foto(s), ${documents} PDF(s)</strong>` + visibleFiles.map(item =>
    `<div class="file-line"><span>${escapeHtml(item.file.name)}</span><small>${(item.file.size / 1024 / 1024).toFixed(2)} MB</small></div>`
  ).join('') + (files.length > visibleFiles.length ? `<small class="upload-more">… und ${files.length - visibleFiles.length} weitere ausgewählte Dateien</small>` : '');
}

function renderExistingAssets(assets = []) {
  existingAssets = assets;
  const container = $('existingAssets');
  const usage = countAssetTypes(assets);
  if (!assets.length) {
    container.hidden = true;
    container.innerHTML = '';
    updateUploadGuidance();
    return;
  }
  const labels = { logo: 'Logo & Marke', team: 'Teamfotos', gallery: 'Arbeiten & Galerie', products: 'Shop-Produkte', documents: 'Dokumente', other: 'Weitere Dateien' };
  const visibleAssets = assets.slice(0, 30);
  container.hidden = false;
  container.innerHTML = `<strong style="font-size:11px">Bereits hochgeladen (${usage.photos} Fotos, ${usage.documents} PDFs)</strong>` + visibleAssets.map(asset =>
    `<div class="file-line"><span>${escapeHtml(asset.original_filename)}</span><small>${escapeHtml(labels[asset.category] || asset.category)} · ${(Number(asset.size_bytes) / 1024 / 1024).toFixed(2)} MB</small></div>`
  ).join('') + (assets.length > visibleAssets.length ? `<small class="upload-more">… und ${assets.length - visibleAssets.length} weitere Dateien</small>` : '');
  updateUploadGuidance();
}

function validateFiles(files) {
  const selectedPhotos = files.filter(({ file }) => IMAGE_MIME.has(file.type)).length;
  const selectedDocuments = files.filter(({ file }) => file.type === 'application/pdf').length;
  const saved = countAssetTypes(existingAssets);
  if (saved.photos + selectedPhotos > uploadPolicy.photoLimit) {
    throw new Error(`Für dieses Projekt sind maximal ${uploadPolicy.photoLimit} Fotos erlaubt. Bereits gespeichert: ${saved.photos}.`);
  }
  if (saved.documents + selectedDocuments > uploadPolicy.documentLimit) {
    throw new Error(`Für dieses Projekt sind zusätzlich maximal ${uploadPolicy.documentLimit} PDF-Dokumente erlaubt. Bereits gespeichert: ${saved.documents}.`);
  }
  let selectedBytes = 0;
  for (const { file } of files) {
    if (!ALLOWED_MIME.has(file.type)) throw new Error(`„${file.name}“ hat ein nicht unterstütztes Format. Erlaubt sind JPG, PNG, WebP und PDF.`);
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new Error(`„${file.name}“ ist größer als 10 MB oder leer.`);
    selectedBytes += file.size;
  }
  if (saved.bytes + selectedBytes > uploadPolicy.maxTotalBytes) {
    const maxMb = Math.round(uploadPolicy.maxTotalBytes / (1024 * 1024));
    throw new Error(`Alle Materialien dürfen zusammen höchstens ${maxMb} MB groß sein.`);
  }
}

async function refreshUploadState() {
  const result = await api('load');
  uploadPolicy = result.uploadPolicy || uploadPolicy;
  renderExistingAssets(result.assets || []);
}

async function uploadSelected(files) {
  if (!files.length) return 0;
  validateFiles(files);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const failed = [];
  let uploadedCount = 0;
  for (let offset = 0; offset < files.length; offset += MAX_UPLOAD_BATCH) {
    const batch = files.slice(offset, offset + MAX_UPLOAD_BATCH);
    showMessage(`Dateien werden hochgeladen: ${Math.min(offset + batch.length, files.length)} von ${files.length} vorbereitet …`);
    const prepared = await api('prepare_uploads', {
      rightsConfirmed: $('assetRightsConfirmed').checked,
      files: batch.map(({ file, category }) => ({ name: file.name, type: file.type, size: file.size, category })),
    });
    if (!Array.isArray(prepared.uploads) || prepared.uploads.length !== batch.length) {
      throw new Error('Die Upload-Links konnten nicht vollständig vorbereitet werden.');
    }

    const registered = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < batch.length) {
        const index = cursor++;
        const item = batch[index];
        const upload = prepared.uploads[index];
        const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(
          upload.storagePath,
          upload.uploadToken,
          item.file,
          { contentType: item.file.type, upsert: false },
        );
        if (error) {
          failed.push(`${item.file.name}: ${error.message}`);
          continue;
        }
        registered.push({
          storagePath: upload.storagePath,
          originalFilename: item.file.name,
          mimeType: item.file.type,
          sizeBytes: item.file.size,
          category: item.category,
        });
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, batch.length) }, () => worker()));
    if (registered.length) {
      const result = await api('register_uploads', { uploads: registered });
      if (Number(result.registered) !== registered.length) {
        throw new Error(`Nur ${Number(result.registered || 0)} von ${registered.length} hochgeladenen Dateien wurden bestätigt.`);
      }
      uploadedCount += registered.length;
    }
    showMessage(`Dateien werden hochgeladen: ${Math.min(offset + batch.length, files.length)} von ${files.length} verarbeitet …`);
  }

  if (uploadedCount) document.querySelectorAll('input[type="file"][data-category]').forEach(input => { input.value = ''; });
  renderSelectedFiles();
  await refreshUploadState();
  if (failed.length) {
    throw new Error(`${uploadedCount} Datei(en) wurden gespeichert. Folgende Datei(en) konnten nicht hochgeladen werden; bitte wählen Sie diese erneut aus: ${failed.join(' · ')}`);
  }
  return uploadedCount;
}

function clearQueryToken() {
  try { history.replaceState({}, document.title, window.location.pathname); } catch { /* Ignore URL cleanup failure. */ }
}

async function initialize() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    showInvalid('Die Projektverbindung ist nicht eingerichtet. Bitte kontaktieren Sie pimentaGROUP.');
    return;
  }
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const fragmentToken = params.get('token') || '';
  if (fragmentToken) {
    token = fragmentToken;
    try { sessionStorage.setItem(TOKEN_STORAGE_KEY, token); } catch { /* Keep token in memory for this page load. */ }
    clearQueryToken();
  } else {
    try { token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || ''; } catch { token = ''; }
  }
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    showInvalid('Der persönliche Zugangslink fehlt. Bitte öffnen Sie den vollständigen Link aus Ihrer Nachricht von pimentaGROUP.');
    return;
  }
  try {
    const result = await api('load');
    profile = result.profile;
    uploadPolicy = result.uploadPolicy || uploadPolicy;
    existingAssets = result.assets || [];
    $('referenceCode').textContent = profile.referenceCode || '—';
    $('businessName').value = profile.data?.businessName || profile.businessName || '';
    fillForm(profile.data || {});
    renderExistingAssets(existingAssets);
    $('expiryLabel').textContent = profile.expiresAt ? `Link gültig bis ${new Intl.DateTimeFormat('de-DE').format(new Date(profile.expiresAt))}` : '';
    $('loadingView').hidden = true;
    $('formView').hidden = false;
    updateProgress();
  } catch (error) {
    showInvalid(error.message || 'Der Link konnte nicht geöffnet werden.');
  }
}

async function save(submit) {
  if (busy) return;
  if (submit && !$('onboardingForm').reportValidity()) return;
  const files = selectedFiles();
  try { validateFiles(files); } catch (error) { showMessage(error.message, true); return; }
  if (files.length && !$('assetRightsConfirmed').checked) {
    showMessage('Bitte bestätigen Sie, dass Sie die erforderlichen Rechte und Einwilligungen für die hochgeladenen Materialien besitzen.', true);
    $('assetRightsConfirmed').focus();
    return;
  }
  setBusy(true, submit ? 'submit' : 'draft');
  showMessage('');
  try {
    const data = readFormData();
    // Save text first so that progress is not lost if a later upload fails.
    await api('save', { data, submit: false });
    let uploaded = 0;
    if (files.length) {
      showMessage('Ihre Angaben sind gespeichert. Dateien werden sicher hochgeladen …');
      uploaded = await uploadSelected(files);
    }
    if (submit) {
      const result = await api('save', { data: readFormData(), submit: true });
      profile = { ...(profile || {}), status: 'submitted', submittedAt: result.saved?.submittedAt };
      $('progressBar').style.width = '100%';
      $('progressLabel').textContent = 'Ihre Angaben wurden eingereicht';
      showMessage(`Vielen Dank! Ihre Angaben wurden an pimentaGROUP übermittelt.${uploaded ? ` ${uploaded} Datei(en) wurden ebenfalls hochgeladen.` : ''} Sie können diesen Link weiterhin öffnen, falls Sie noch etwas ergänzen möchten.`);
    } else {
      profile = { ...(profile || {}), status: 'draft' };
      updateProgress();
      showMessage(`Ihre Angaben wurden zwischengespeichert.${uploaded ? ` ${uploaded} Datei(en) wurden hochgeladen.` : ''} Sie können später über denselben Link weitermachen.`);
    }
    const reloaded = await api('load');
    uploadPolicy = reloaded.uploadPolicy || uploadPolicy;
    renderExistingAssets(reloaded.assets || []);
  } catch (error) {
    showMessage(error.message || 'Ihre Angaben konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.', true);
  } finally {
    setBusy(false);
  }
}

$('saveDraftButton').addEventListener('click', () => save(false));
$('onboardingForm').addEventListener('submit', event => { event.preventDefault(); save(true); });
document.querySelectorAll('input[type="file"][data-category]').forEach(input => input.addEventListener('change', renderSelectedFiles));
['businessName','city','publicEmail','aboutBusiness','services','brandStyle'].forEach(id => $(id).addEventListener('input', updateProgress));
$('primaryColor').addEventListener('input', () => $('primaryColorText').value = $('primaryColor').value);
$('secondaryColor').addEventListener('input', () => $('secondaryColorText').value = $('secondaryColor').value);
$('primaryColorText').addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test($('primaryColorText').value)) $('primaryColor').value = $('primaryColorText').value; });
$('secondaryColorText').addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test($('secondaryColorText').value)) $('secondaryColor').value = $('secondaryColorText').value; });

initialize();
