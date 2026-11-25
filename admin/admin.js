import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CFG = window.PIMENTA_CONFIG || {};
const SUPABASE_URL = CFG.SUPABASE_URL;
const SUPABASE_KEY = CFG.SUPABASE_PUBLISHABLE_KEY;
const BUCKET = 'website-request-assets';
const ONBOARDING_BUCKET = 'website-onboarding-assets';
const STATUS = {
  new: ['Neu', 'orange'],
  in_review: ['In Prüfung', 'blue'],
  waiting_for_materials: ['Warten auf Unterlagen', 'orange'],
  in_production: ['In Umsetzung', 'blue'],
  internal_review: ['Interne Prüfung', 'blue'],
  customer_review: ['Kundenprüfung', 'orange'],
  changes_requested: ['Änderungen gewünscht', 'orange'],
  approved: ['Freigegeben', 'green'],
  published: ['Veröffentlicht', 'green'],
  closed: ['Geschlossen', 'gray'],
};
const EMAIL_STATE = { sent: 'Gesendet', failed: 'Fehlgeschlagen', not_configured: 'Nicht eingerichtet' };
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dateTime = (value) => value ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const currency = (value, code = 'EUR') => new Intl.NumberFormat('de-DE', { style: 'currency', currency: code }).format(Number(value || 0));
const statusLabel = (value) => STATUS[value]?.[0] || value || '—';
const statusPill = (value) => { const info = STATUS[value] || ['Unbekannt','gray']; return `<span class="pill ${info[1]}">${escapeHtml(info[0])}</span>`; };

if (!SUPABASE_URL || !SUPABASE_KEY) {
  $('loginError').hidden = false;
  $('loginError').textContent = 'Die Supabase-Konfiguration fehlt. Bitte js/backend-config.js prüfen.';
  $('loginButton').disabled = true;
  throw new Error('Missing public Supabase configuration.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
let currentUser = null;
let allRequests = [];
let visibleRequests = [];
let selectedRequestId = null;
let busy = false;

function setLoginError(message) {
  $('loginError').textContent = message;
  $('loginError').hidden = !message;
}
function showAppMessage(message, isError = false) {
  const el = $('appMessage');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.hidden = !message;
  if (message) window.setTimeout(() => { if (el.textContent === message) el.hidden = true; }, 6500);
}
function toggleBusy(value) {
  busy = value;
  $('loginButton').disabled = value;
  $('refreshButton').disabled = value;
  $('exportButton').disabled = value;
}

async function verifyAdmin() {
  const { data, error } = await supabase.rpc('is_webconcierge_admin');
  if (error) throw new Error('Admin-Berechtigung konnte nicht geprüft werden. Bitte die Admin-Migration anwenden.');
  if (data !== true) throw new Error('Dieses Konto ist nicht für die Web-Concierge-Verwaltung freigeschaltet.');
  return true;
}

async function enterApp(user) {
  currentUser = user;
  try {
    await verifyAdmin();
  } catch (error) {
    await supabase.auth.signOut();
    currentUser = null;
    $('loginView').hidden = false;
    $('appView').hidden = true;
    setLoginError(error.message || 'Kein Administratorzugriff.');
    return;
  }
  $('loginView').hidden = true;
  $('appView').hidden = false;
  $('sidebarUser').textContent = user.email || 'Administrator';
  setLoginError('');
  await loadRequests();
}

$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  toggleBusy(true);
  setLoginError('');
  try {
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await enterApp(data.user);
  } catch (error) {
    setLoginError(error.message || 'Anmeldung fehlgeschlagen.');
  } finally {
    toggleBusy(false);
  }
});

$('logoutButton').addEventListener('click', async () => {
  await supabase.auth.signOut();
  currentUser = null;
  allRequests = [];
  selectedRequestId = null;
  $('appView').hidden = true;
  $('loginView').hidden = false;
  $('loginPassword').value = '';
  setLoginError('');
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    $('appView').hidden = true;
    $('loginView').hidden = false;
  } else if (event === 'TOKEN_REFRESHED' && session?.user) {
    currentUser = session.user;
  }
});

const REQUEST_COLUMNS = [
  'id','reference_code','source','schema_version','creation_mode','status','industry','project_type','website_status',
  'contact_name','business_name','email','phone','current_website','message','contact_consent','consent_at',
  'billing_start','free_trial_months','monthly_total','one_time_total','currency','pricing_snapshot','configuration',
  'admin_email_status','customer_email_status','automation_status','admin_notes','priority','created_at','updated_at'
].join(',');

async function loadRequests(preserveSelection = true) {
  $('requestList').innerHTML = '<div class="loading-state">Anfragen werden geladen …</div>';
  try {
    const { data, error } = await supabase.from('website_requests').select(REQUEST_COLUMNS).order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    allRequests = data || [];
    updateStats();
    applyFilters();
    $('lastUpdated').textContent = `Aktualisiert: ${new Date().toLocaleTimeString('de-DE', {hour:'2-digit',minute:'2-digit'})}`;
    if (preserveSelection && selectedRequestId) {
      const selected = allRequests.find(item => item.id === selectedRequestId);
      if (selected) await renderDetail(selected);
      else clearDetail();
    } else if (!selectedRequestId && visibleRequests.length) {
      await selectRequest(visibleRequests[0].id);
    }
  } catch (error) {
    $('requestList').innerHTML = `<div class="list-empty">${escapeHtml(error.message || 'Fehler beim Laden der Anfragen.')}</div>`;
    showAppMessage(error.message || 'Anfragen konnten nicht geladen werden.', true);
  }
}

function updateStats() {
  const count = (statuses) => allRequests.filter(item => statuses.includes(item.status)).length;
  $('statTotal').textContent = allRequests.length;
  $('statNew').textContent = count(['new']);
  $('statActive').textContent = count(['in_review','in_production','internal_review']);
  $('statWaiting').textContent = count(['waiting_for_materials','customer_review','changes_requested']);
}

function applyFilters() {
  const query = $('searchInput').value.trim().toLocaleLowerCase('de-DE');
  const filterStatus = $('statusFilter').value;
  visibleRequests = allRequests.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (!query) return true;
    return [item.reference_code,item.contact_name,item.business_name,item.email,item.phone].some(value => String(value || '').toLocaleLowerCase('de-DE').includes(query));
  });
  if (selectedRequestId && !visibleRequests.some(item => item.id === selectedRequestId)) {
    selectedRequestId = null;
    clearDetail(false);
  }
  renderList();
}

function renderList() {
  $('listCount').textContent = `${visibleRequests.length} von ${allRequests.length} Anfragen`;
  if (!visibleRequests.length) {
    $('requestList').innerHTML = '<div class="list-empty">Keine passenden Anfragen gefunden.</div>';
    return;
  }
  $('requestList').innerHTML = visibleRequests.map(item => {
    const name = item.business_name || item.contact_name || 'Unbekannter Kontakt';
    const isSelected = item.id === selectedRequestId;
    return `<button type="button" class="request-row ${isSelected ? 'selected' : ''}" data-request-id="${escapeHtml(item.id)}">
      <div class="request-row-top"><strong>${escapeHtml(name)}</strong>${statusPill(item.status)}</div>
      <div class="request-row-bottom"><span class="request-ref">${escapeHtml(item.reference_code)}</span><span>${escapeHtml(dateTime(item.created_at))}</span></div>
      <div class="request-meta">${escapeHtml(item.contact_name)} · ${escapeHtml(item.email)} · ${escapeHtml(item.industry)}</div>
    </button>`;
  }).join('');
  $('requestList').querySelectorAll('[data-request-id]').forEach(button => button.addEventListener('click', () => selectRequest(button.dataset.requestId)));
}

async function selectRequest(id) {
  selectedRequestId = id;
  renderList();
  const item = allRequests.find(request => request.id === id);
  if (item) await renderDetail(item);
}

function field(label, value, full = false) {
  return `<div class="data-field ${full ? 'full' : ''}"><div class="data-label">${escapeHtml(label)}</div><div class="data-value">${value || '—'}</div></div>`;
}
function textLink(value, href) {
  if (!value) return '—';
  return `<a href="${escapeHtml(href)}">${escapeHtml(value)}</a>`;
}
function formatBilling(item) {
  return item.billing_start === 'trial' ? `${Number(item.free_trial_months || 0)} Monate kostenlos, danach monatlich` : 'Monatlicher Start ab sofort gewünscht';
}
function formatStatusState(value) { return EMAIL_STATE[value] || value || '—'; }

async function renderDetail(item) {
  const config = item.configuration?.project || {};
  const features = Array.isArray(config.features) ? config.features : [];
  const social = Array.isArray(config.socialProfiles) ? config.socialProfiles : [];
  const detail = $('detailPanel');
  detail.innerHTML = `<div class="detail-content">
    <div class="detail-heading"><div><div class="eyebrow">${escapeHtml(item.reference_code)}</div><h2>${escapeHtml(item.business_name || item.contact_name)}</h2><div class="detail-subtitle">Eingegangen am ${escapeHtml(dateTime(item.created_at))}</div></div>${statusPill(item.status)}</div>
    <section class="detail-section"><h3 class="section-title">Kontakt & Betrieb</h3><div class="detail-grid">
      ${field('Kontaktperson', escapeHtml(item.contact_name))}
      ${field('Salon / Unternehmen', escapeHtml(item.business_name || 'Nicht angegeben'))}
      ${field('E-Mail', textLink(item.email, `mailto:${encodeURIComponent(item.email || '')}`))}
      ${field('Telefon', item.phone ? textLink(item.phone, `tel:${encodeURIComponent(item.phone)}`) : 'Nicht angegeben')}
      ${field('Branche', escapeHtml(item.industry))}
      ${field('Website-Situation', escapeHtml(item.website_status))}
      ${field('Vorhandene Website', item.current_website ? textLink(item.current_website, item.current_website) : 'Nicht angegeben', true)}
      ${field('Nachricht', escapeHtml(item.message || 'Keine Nachricht'), true)}
    </div></section>
    <section class="detail-section"><h3 class="section-title">Ausgewählte Funktionen</h3>
      <div class="feature-list">${features.length ? features.map(feature => `<span class="feature-chip">${escapeHtml(feature.name)} · ${currency(feature.monthlyPrice)}</span>`).join('') : '<span class="muted">Keine Funktionsdetails gespeichert</span>'}</div>
      ${social.length ? `<h3 class="section-title" style="margin-top:14px">Social-Media-Profile</h3><div class="feature-list">${social.map(profile => `<span class="feature-chip social">${escapeHtml(profile.name)} · ${currency(profile.setupPrice || 0)} einmalig</span>`).join('')}</div>` : ''}
      <div class="detail-section"><h3 class="section-title">Preisorientierung</h3>
        <div class="pricing-row"><span>Monatlich</span><strong>${currency(item.monthly_total,item.currency)}</strong></div>
        <div class="pricing-row"><span>Einmalige Einrichtung</span><strong>${currency(item.one_time_total,item.currency)}</strong></div>
        <div class="pricing-row"><span>Gewünschter Zahlungsbeginn</span><strong>${escapeHtml(formatBilling(item))}</strong></div>
        <p class="muted" style="font-size:10px;margin-top:8px">Unverbindliche Preisorientierung; verbindlich erst nach individuellem Angebot.</p>
      </div>
    </section>
    <section class="detail-section"><h3 class="section-title">Hochgeladene Materialien</h3><div id="assetContainer" class="asset-grid"><div class="muted">Materialien werden geladen …</div></div></section>
    <section class="detail-section"><h3 class="section-title">Kunden-Onboarding</h3>
      <p class="muted" style="font-size:11px;margin:-4px 0 12px">Erstellen Sie einen persönlichen Link, über den der Kunde Unternehmensdaten, Leistungen, Team-Informationen und Materialien nachreichen kann. Der bisherige aktive Link wird dabei ungültig.</p>
      <button id="createOnboardingInvite" class="button button-secondary button-small" type="button">Onboarding-Link erstellen (30 Tage)</button>
      <div id="onboardingInviteResult" style="margin-top:10px"></div>
      <div id="onboardingContainer" style="margin-top:14px"><div class="muted" style="font-size:11px">Onboarding-Status wird geladen …</div></div>
    </section>
    <section class="detail-section"><h3 class="section-title">Bearbeitung</h3>
      <div class="status-editor">
        <label>Status<select id="editStatus">${Object.entries(STATUS).map(([value,info]) => `<option value="${value}" ${item.status===value?'selected':''}>${escapeHtml(info[0])}</option>`).join('')}</select></label>
        <label>Priorität<select id="editPriority"><option value="low" ${item.priority==='low'?'selected':''}>Niedrig</option><option value="normal" ${!item.priority||item.priority==='normal'?'selected':''}>Normal</option><option value="high" ${item.priority==='high'?'selected':''}>Hoch</option></select></label>
      </div>
      <label class="field-label" for="adminNotes">Interne Notizen (nur für pimentaGROUP)</label>
      <textarea id="adminNotes" placeholder="Interne Notizen, nächste Schritte, Rückfragen …">${escapeHtml(item.admin_notes || '')}</textarea>
      <div class="save-row"><button id="saveChanges" class="button button-primary button-small" type="button">Änderungen speichern</button></div>
    </section>
    <section class="detail-section"><h3 class="section-title">Systemstatus</h3><div class="system-grid">
      <div class="system-item"><span>Interne E-Mail</span><strong>${escapeHtml(formatStatusState(item.admin_email_status))}</strong></div>
      <div class="system-item"><span>Kunden-E-Mail</span><strong>${escapeHtml(formatStatusState(item.customer_email_status))}</strong></div>
      <div class="system-item"><span>Automatisierung</span><strong>${escapeHtml(item.automation_status || '—')}</strong></div>
    </div><div id="outboxContainer" class="muted" style="font-size:10px;margin-top:9px">Ereignisstatus wird geladen …</div></section>
    <section class="detail-section"><h3 class="section-title">Statusverlauf</h3><div id="historyContainer" class="timeline"><div class="muted">Verlauf wird geladen …</div></div></section>
  </div>`;
  $('saveChanges').addEventListener('click', () => saveRequestChanges(item.id));
  $('createOnboardingInvite').addEventListener('click', () => createOnboardingInvite(item.id));
  await Promise.all([loadAssets(item.id), loadOnboarding(item.id), loadOutbox(item.id), loadHistory(item.id)]);
}

async function loadAssets(requestId) {
  const container = $('assetContainer');
  try {
    const { data, error } = await supabase.from('website_request_assets').select('id,original_filename,storage_path,mime_type,size_bytes,created_at').eq('request_id', requestId).order('created_at', { ascending: true });
    if (error) throw error;
    if (!data?.length) { container.innerHTML = '<span class="muted">Keine Dateien hochgeladen.</span>'; return; }
    const cards = await Promise.all(data.map(async asset => {
      const { data: signed, error: signError } = await supabase.storage.from(BUCKET).createSignedUrl(asset.storage_path, 600);
      const url = !signError ? signed?.signedUrl : '';
      return `<article class="asset-card">${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener"><img src="${escapeHtml(url)}" alt="${escapeHtml(asset.original_filename)}" loading="lazy"></a>` : '<div class="loading-state">Vorschau nicht verfügbar</div>'}<div class="asset-card-info"><div title="${escapeHtml(asset.original_filename)}">${escapeHtml(asset.original_filename)}</div>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Datei öffnen ↗</a>` : '<span class="muted">Kein Zugriff</span>'}<div class="muted" style="margin-top:5px">${(Number(asset.size_bytes)/1024).toFixed(1)} KB</div></div></article>`;
    }));
    if ($('assetContainer')) container.innerHTML = cards.join('');
  } catch (error) { if ($('assetContainer')) container.innerHTML = `<span class="muted">Dateien konnten nicht geladen werden: ${escapeHtml(error.message)}</span>`; }
}

async function createOnboardingInvite(requestId) {
  const button = $('createOnboardingInvite');
  const result = $('onboardingInviteResult');
  if (!button || button.disabled) return;
  button.disabled = true;
  button.textContent = 'Link wird erstellt …';
  result.innerHTML = '';
  try {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const rawToken = [...randomBytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawToken));
    const tokenHash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const { data, error } = await supabase.rpc('create_website_onboarding_invite', {
      p_request_id: requestId,
      p_token_hash: tokenHash,
      p_valid_days: 30,
    });
    if (error) throw error;
    if (!data) throw new Error('Der Onboarding-Link wurde nicht korrekt erstellt.');
    const target = new URL('../onboarding/', window.location.href);
    target.hash = new URLSearchParams({ token: rawToken }).toString();
    const link = target.toString();
    result.innerHTML = `<div class="invite-result"><strong>Persönlicher Link erstellt</strong><p>Gültig für 30 Tage. Wenn Sie einen neuen Link erstellen, wird der vorherige Link deaktiviert.</p><div class="invite-copy-row"><input id="onboardingInviteUrl" type="text" readonly value="${escapeHtml(link)}" aria-label="Persönlicher Onboarding-Link"><button id="copyOnboardingInvite" class="button button-secondary button-small" type="button">Link kopieren</button></div><small>Der geheime Zugangstoken wird nur jetzt angezeigt. Kopieren Sie den Link und senden Sie ihn dem Kunden über einen sicheren Kanal.</small></div>`;
    $('copyOnboardingInvite').addEventListener('click', async () => {
      const input = $('onboardingInviteUrl');
      try {
        await navigator.clipboard.writeText(link);
        $('copyOnboardingInvite').textContent = 'Kopiert';
      } catch {
        input.focus(); input.select();
        $('copyOnboardingInvite').textContent = 'Markiert – kopieren';
      }
    });
    showAppMessage('Persönlicher Onboarding-Link wurde erstellt.');
  } catch (error) {
    result.innerHTML = `<div class="muted" style="font-size:11px;color:#a54848">${escapeHtml(error.message || 'Onboarding-Link konnte nicht erstellt werden.')}</div>`;
    showAppMessage(error.message || 'Onboarding-Link konnte nicht erstellt werden.', true);
  } finally {
    if ($('createOnboardingInvite')) {
      $('createOnboardingInvite').disabled = false;
      $('createOnboardingInvite').textContent = 'Neuen Onboarding-Link erstellen (30 Tage)';
    }
  }
}

async function loadOnboarding(requestId) {
  const container = $('onboardingContainer');
  if (!container) return;
  try {
    const [{ data: profile, error: profileError }, { data: assets, error: assetsError }] = await Promise.all([
      supabase.from('website_onboarding_profiles').select('status,data,submitted_at,updated_at').eq('request_id', requestId).maybeSingle(),
      supabase.from('website_onboarding_assets').select('id,category,original_filename,storage_path,mime_type,size_bytes,created_at').eq('request_id', requestId).order('created_at', { ascending: true }),
    ]);
    if (profileError) throw profileError;
    if (assetsError) throw assetsError;
    if (!profile && !(assets || []).length) {
      container.innerHTML = '<div class="muted" style="font-size:11px">Der Kunde hat noch keine zusätzlichen Angaben oder Materialien übermittelt. Erstellen Sie oben einen persönlichen Onboarding-Link.</div>';
      return;
    }
    const labels = {
      businessName:'Salon / Unternehmen', street:'Straße', postalCode:'Postleitzahl', city:'Stadt', country:'Land',
      publicEmail:'Öffentliche E-Mail', publicPhone:'Telefon', publicWebsite:'Website', openingHours:'Öffnungszeiten',
      aboutBusiness:'Über den Salon', specialties:'Spezialisierungen', targetAudience:'Zielgruppe', brandStyle:'Gewünschter Stil',
      primaryColor:'Hauptfarbe', secondaryColor:'Weitere Farbe', languages:'Sprachen', services:'Leistungen & Preise', team:'Team', notes:'Weitere Wünsche',
      assetRightsConfirmed:'Nutzungsrechte bestätigt', assetRightsConfirmedAt:'Bestätigung am',
    };
    const data = profile?.data || {};
    const entries = Object.entries(labels).filter(([key]) => String(data[key] || '').trim() && !(key === 'assetRightsConfirmed' && data[key] !== 'true'));
    const summary = entries.length ? `<div class="onboarding-summary">${entries.map(([key,label]) => `<div class="onboarding-summary-item"><strong>${escapeHtml(label)}</strong><div>${escapeHtml(key === 'assetRightsConfirmed' ? 'Ja' : data[key]).replace(/\n/g,'<br>')}</div></div>`).join('')}</div>` : '<p class="muted" style="font-size:11px">Noch keine Angaben gespeichert.</p>';
    const status = profile?.status === 'submitted' ? '<span class="pill green">Angaben eingereicht</span>' : profile ? '<span class="pill orange">Entwurf gespeichert</span>' : '';
    const assetCards = await Promise.all((assets || []).map(async asset => {
      const { data: signed } = await supabase.storage.from(ONBOARDING_BUCKET).createSignedUrl(asset.storage_path, 600);
      const url = signed?.signedUrl || '';
      const visual = url && asset.mime_type.startsWith('image/')
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener"><img src="${escapeHtml(url)}" alt="${escapeHtml(asset.original_filename)}" loading="lazy"></a>`
        : `<div class="onboarding-file-icon">PDF</div>`;
      return `<article class="asset-card">${visual}<div class="asset-card-info"><div title="${escapeHtml(asset.original_filename)}">${escapeHtml(asset.original_filename)}</div>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Datei öffnen ↗</a>` : '<span class="muted">Kein Zugriff</span>'}<div class="muted" style="margin-top:5px">${escapeHtml(asset.category)} · ${(Number(asset.size_bytes)/1024).toFixed(1)} KB</div></div></article>`;
    }));
    container.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">${status}<span class="muted" style="font-size:10px">${profile?.updated_at ? `Aktualisiert: ${escapeHtml(dateTime(profile.updated_at))}` : ''}</span></div>${summary}${assetCards.length ? `<h4 class="section-title" style="margin-top:14px">Weitere Kunden-Dateien (${assetCards.length})</h4><div class="asset-grid">${assetCards.join('')}</div>` : ''}`;
  } catch (error) {
    container.innerHTML = `<div class="muted" style="font-size:11px;color:#a54848">Onboarding-Daten konnten nicht geladen werden. Bitte prüfen Sie, ob die Onboarding-Migration angewendet wurde. (${escapeHtml(error.message)})</div>`;
  }
}

async function loadOutbox(requestId) {
  const container = $('outboxContainer');
  try {
    const { data, error } = await supabase.from('website_automation_outbox').select('event_type,status,attempt_count,last_error,created_at,delivered_at').eq('request_id', requestId).order('created_at', { ascending: false });
    if (error) throw error;
    if (!data?.length) { container.textContent = 'Keine Automatisierungsereignisse gefunden.'; return; }
    container.innerHTML = data.map(event => `<div style="margin-top:7px"><strong>${escapeHtml(event.event_type)}</strong> · ${escapeHtml(event.status)} · Versuche: ${Number(event.attempt_count || 0)}${event.last_error ? `<div class="muted">${escapeHtml(event.last_error)}</div>` : ''}</div>`).join('');
  } catch (error) { if ($('outboxContainer')) container.textContent = `Ereignisse nicht verfügbar: ${error.message}`; }
}

async function loadHistory(requestId) {
  const container = $('historyContainer');
  try {
    const { data, error } = await supabase.from('website_request_status_history').select('previous_status,new_status,changed_by_email,changed_at').eq('request_id', requestId).order('changed_at', { ascending: false }).limit(30);
    if (error) throw error;
    if (!data?.length) { container.innerHTML = '<span class="muted">Noch kein Verlauf vorhanden.</span>'; return; }
    container.innerHTML = data.map(entry => `<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${escapeHtml(entry.previous_status ? `${statusLabel(entry.previous_status)} → ${statusLabel(entry.new_status)}` : statusLabel(entry.new_status))}</strong><small>${escapeHtml(entry.changed_by_email || 'System')} · ${escapeHtml(dateTime(entry.changed_at))}</small></div></div>`).join('');
  } catch (error) { if ($('historyContainer')) container.innerHTML = `<span class="muted">Verlauf nicht verfügbar: ${escapeHtml(error.message)}</span>`; }
}

async function saveRequestChanges(id) {
  const button = $('saveChanges');
  if (!button || button.disabled) return;
  button.disabled = true;
  button.textContent = 'Speichert …';
  try {
    const update = {
      status: $('editStatus').value,
      priority: $('editPriority').value,
      admin_notes: $('adminNotes').value.trim(),
    };
    const { error } = await supabase.from('website_requests').update(update).eq('id', id);
    if (error) throw error;
    showAppMessage('Änderungen wurden gespeichert.');
    await loadRequests(true);
  } catch (error) {
    showAppMessage(error.message || 'Änderungen konnten nicht gespeichert werden.', true);
  } finally {
    const current = $('saveChanges');
    if (current) { current.disabled = false; current.textContent = 'Änderungen speichern'; }
  }
}

function clearDetail(refreshList = true) {
  selectedRequestId = null;
  $('detailPanel').innerHTML = '<div class="empty-detail"><div class="empty-icon">↖</div><h2>Anfrage auswählen</h2><p class="muted">Wählen Sie links eine Anfrage aus, um Kontaktdaten, Funktionsauswahl und Materialien zu sehen.</p></div>';
  if (refreshList) renderList();
}

function exportCsv() {
  const rows = visibleRequests;
  if (!rows.length) { showAppMessage('Keine Anfragen zum Exportieren vorhanden.', true); return; }
  const columns = [
    ['Referenz','reference_code'],['Erstellt','created_at'],['Status','status'],['Priorität','priority'],['Kontakt','contact_name'],
    ['Unternehmen','business_name'],['E-Mail','email'],['Telefon','phone'],['Branche','industry'],['Website','current_website'],
    ['Monatlich EUR','monthly_total'],['Einmalig EUR','one_time_total'],['Zahlungsbeginn','billing_start'],['Nachricht','message']
  ];
  const quote = value => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`; // Prevent spreadsheet formula injection.
    return `"${text.replace(/"/g,'""')}"`;
  };
  const csv = [columns.map(([label]) => quote(label)).join(';'), ...rows.map(row => columns.map(([,key]) => quote(row[key])).join(';'))].join('\r\n');
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pimenta-webconcierge-anfragen-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

$('refreshButton').addEventListener('click', () => loadRequests(true));
$('searchInput').addEventListener('input', applyFilters);
$('statusFilter').addEventListener('change', applyFilters);
$('exportButton').addEventListener('click', exportCsv);

(async function restoreSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) await enterApp(data.session.user);
})();
