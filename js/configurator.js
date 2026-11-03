(() => {
  'use strict';

  // Google Apps Script Web-App URL eintragen, sobald der Empfang eingerichtet ist.
  const CONFIG = { FORM_ENDPOINT: '' };
  const EURO = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const PACKAGES = {
    landing: { name: 'Landingpage', price: 490, includedPages: 1, description: 'Eine fokussierte Seite für ein Angebot oder eine Kampagne.' },
    business: { name: 'Unternehmenswebsite', price: 890, includedPages: 5, description: 'Der komplette digitale Auftritt für Ihr Unternehmen.' },
    shop: { name: 'Online-Shop', price: 1490, includedPages: 5, description: 'Produkte präsentieren und online verkaufen.' },
    relaunch: { name: 'Website-Relaunch', price: 690, includedPages: 5, description: 'Eine bestehende Website modernisieren und neu strukturieren.' }
  };

  const FEATURES = {
    web: [
      { id:'booking', name:'Online-Terminbuchung', desc:'Kunden wählen Dienstleistung, Datum und Uhrzeit direkt auf Ihrer Website.', price:249, icon:'calendar' },
      { id:'whatsapp', name:'WhatsApp-Kontakt', desc:'Ein gut sichtbarer Kontakt-Button für schnelle Nachrichten.', price:49, icon:'message' },
      { id:'contactPlus', name:'Erweitertes Kontaktformular', desc:'Mit zusätzlichen Feldern, Auswahlmöglichkeiten und Anfrage-Details.', price:89, icon:'form' },
      { id:'gallery', name:'Galerie & Portfolio', desc:'Bilder, Referenzen und Projekte ansprechend präsentieren.', price:79, icon:'image' },
      { id:'reviews', name:'Google-Bewertungen', desc:'Kundenstimmen und Bewertungen sichtbar auf der Website einbinden.', price:59, icon:'star' },
      { id:'maps', name:'Karte & Öffnungszeiten', desc:'Standort, Anfahrt und aktuelle Öffnungszeiten übersichtlich zeigen.', price:39, icon:'map' },
      { id:'multilingual', name:'Mehrsprachigkeit', desc:'Zusätzliche Sprachversion für internationale Besucher.', price:249, icon:'globe' },
      { id:'blog', name:'Blog & Neuigkeiten', desc:'Beiträge und aktuelle Informationen selbst veröffentlichen.', price:129, icon:'edit' },
      { id:'newsletter', name:'Newsletter-Anmeldung', desc:'Interessenten können sich für Neuigkeiten eintragen.', price:89, icon:'mail' },
      { id:'faq', name:'Interaktiver FAQ-Bereich', desc:'Häufige Fragen schnell auffindbar und übersichtlich beantworten.', price:49, icon:'help' }
    ],
    ai: [
      { id:'chatbot', name:'KI-Chatbot für Ihre Website', desc:'Beantwortet häufige Fragen rund um die Uhr auf Basis Ihrer Informationen.', price:349, icon:'bot', detail:'Einrichtung einmalig' },
      { id:'leadAssistant', name:'KI-Anfrage-Assistent', desc:'Fragt wichtige Details ab und sortiert eingehende Kundenanfragen vor.', price:249, icon:'spark', detail:'Einrichtung einmalig' },
      { id:'emailAssistant', name:'KI-E-Mail-Assistent', desc:'Erstellt Antwortentwürfe und hilft bei wiederkehrender E-Mail-Kommunikation.', price:199, icon:'mail', detail:'Einrichtung einmalig' },
      { id:'crm', name:'CRM-Verknüpfung', desc:'Überträgt Anfragen strukturiert in ein Kunden- oder Kontaktverwaltungssystem.', price:299, icon:'workflow', detail:'Einrichtung einmalig' },
      { id:'voice', name:'KI-Telefonassistent', desc:'Nimmt Anrufe entgegen und erfasst Anliegen oder Terminwünsche.', price:599, icon:'phone', detail:'Einrichtung einmalig' },
      { id:'automation', name:'Individuelle Prozess-Automation', desc:'Verbindet Formulare, E-Mails und weitere Tools zu automatisierten Abläufen.', price:249, icon:'zap', detail:'Einrichtung einmalig' }
    ]
  };
  const CARE = {
    none: { name:'Keine laufende Betreuung', price:0 },
    basic: { name:'Care Basic', price:19 },
    plus: { name:'Care Plus', price:39 }
  };
  const ICONS = {
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3"/>',
    message:'<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-6a7.5 7.5 0 1 1 17-3.5Z"/><path d="M8 11h8M8 14h5"/>',
    form:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
    star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.4 1.6c-1.1.9-1.9 1.2-1.9 2.9M12 17h.01"/>',
    bot:'<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 3v4M9 13h.01M15 13h.01M8 17h8M2 11v5M22 11v5"/>',
    spark:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z"/>',
    workflow:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M10 6.5h3a2 2 0 0 1 2 2v5.5M14 17.5h-3a2 2 0 0 1-2-2V10"/>',
    phone:'<path d="M5 3h4l2 5-2.5 1.5a14 14 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
    zap:'<path d="m13 2-3 9h7l-6 11 1-9H5Z"/>'
  };

  const form = document.getElementById('configForm');
  if (!form) return;
  const panels = [...document.querySelectorAll('.step-panel')];
  const stepIndicators = [...document.querySelectorAll('[data-step-indicator]')];
  const nextBtn = document.getElementById('nextBtn');
  const backBtn = document.getElementById('backBtn');
  const submitBtn = document.getElementById('submitBtn');
  const mobileNextBtn = document.getElementById('mobileNextBtn');
  const mobileSubmitBtn = document.getElementById('mobileSubmitBtn');
  const globalError = document.getElementById('globalError');
  const successOverlay = document.getElementById('successOverlay');
  let currentStep = 0;
  const totalSteps = panels.length;

  const money = value => EURO.format(value);
  const valueOf = name => String(form.elements[name]?.value || '').trim();
  const checkedValues = name => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
  const contentPageCount = () => checkedValues('pages').filter(page => page !== 'Impressum & Datenschutz').length;
  const packageKey = () => valueOf('projectType') || 'business';
  const packageInfo = () => PACKAGES[packageKey()];
  const selectedItems = type => checkedValues(type === 'web' ? 'features' : 'aiFeatures').map(id => FEATURES[type].find(item => item.id === id)).filter(Boolean);
  const pageExtraCount = () => Math.max(0, contentPageCount() - packageInfo().includedPages);
  const priceDetails = () => {
    const pkg = packageInfo();
    const web = selectedItems('web');
    const ai = selectedItems('ai');
    const extraPages = pageExtraCount();
    const care = CARE[valueOf('carePlan') || 'none'];
    const onceItems = [
      { label: pkg.name, price: pkg.price, type: 'Basis-Paket' },
      ...(extraPages ? [{ label: `${extraPages} zusätzliche ${extraPages === 1 ? 'Seite' : 'Seiten'}`, price: extraPages * 49, type: 'Inhalte' }] : []),
      ...web.map(x => ({ label: x.name, price: x.price, type: 'Website-Funktion' })),
      ...ai.map(x => ({ label: x.name, price: x.price, type: 'KI-Einrichtung' }))
    ];
    const once = onceItems.reduce((sum, item) => sum + item.price, 0);
    return { pkg, web, ai, extraPages, care, onceItems, once, monthly: care.price };
  };

  function svg(name) { return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.spark}</svg>`; }

  function renderFeatureCards(containerId, type) {
    const container = document.getElementById(containerId);
    const selected = new Set(checkedValues(type === 'web' ? 'features' : 'aiFeatures'));
    container.innerHTML = FEATURES[type].map(item => `
      <label class="feature-card${selected.has(item.id) ? ' selected' : ''}" data-feature="${item.id}">
        <input type="checkbox" name="${type === 'web' ? 'features' : 'aiFeatures'}" value="${item.id}" ${selected.has(item.id) ? 'checked' : ''}>
        <span class="feature-icon">${svg(item.icon)}</span>
        <span class="feature-copy"><b>${item.name}</b><small>${item.desc}</small></span>
        <span class="feature-price"><b>+ ${money(item.price)}</b><small>einmalig</small></span>
        <span class="feature-toggle">✓</span>
      </label>`).join('');
  }

  function updateSelectedStyles() {
    document.querySelectorAll('.package-card').forEach(card => {
      card.classList.toggle('selected', card.querySelector('input').checked);
    });
    document.querySelectorAll('.style-card').forEach(card => {
      card.classList.toggle('selected', card.querySelector('input').checked);
    });
    document.querySelectorAll('.page-option').forEach(card => {
      card.classList.toggle('selected', card.querySelector('input').checked);
    });
    document.querySelectorAll('.care-option').forEach(card => {
      card.classList.toggle('selected', card.querySelector('input').checked);
    });
    document.querySelectorAll('.feature-card').forEach(card => {
      card.classList.toggle('selected', card.querySelector('input').checked);
    });
  }

  function renderSidebar() {
    const d = priceDetails();
    document.getElementById('sidebarPackage').innerHTML = `
      <span class="quote-package-icon">${String(panels.length).padStart(2,'0')}</span>
      <div><b>${d.pkg.name}</b><small>${d.pkg.includedPages} ${d.pkg.includedPages === 1 ? 'Seite' : 'Seiten'} im Paket enthalten</small></div>
      <strong>${money(d.pkg.price)}</strong>`;
    const extras = d.onceItems.slice(1);
    document.getElementById('sidebarLines').innerHTML = extras.length
      ? extras.map(item => `<div class="quote-line"><span>${item.label}</span><b>${money(item.price)}</b></div>`).join('')
      : '<div class="quote-empty">Noch keine Zusatzfunktionen ausgewählt.</div>';
    document.getElementById('sidebarTotal').textContent = money(d.once);
    document.getElementById('sidebarMonthly').textContent = money(d.monthly);
    document.getElementById('mobileTotal').textContent = money(d.once);
    document.getElementById('mobileMonthly').textContent = `+ ${money(d.monthly)} / Monat`;
    document.getElementById('webFeatureCount').textContent = `${d.web.length} ausgewählt`;
    document.getElementById('aiFeatureCount').textContent = `${d.ai.length} ausgewählt`;
    document.getElementById('pageCountText').textContent = `${contentPageCount()} ${contentPageCount() === 1 ? 'Inhaltsseite' : 'Inhaltsseiten'} ausgewählt`;
    document.getElementById('pageIncludedText').textContent = `Im Paket enthalten: ${d.pkg.includedPages} ${d.pkg.includedPages === 1 ? 'Seite' : 'Seiten'}`;
    updateSelectedStyles();
  }

  function renderFinalQuote() {
    const d = priceDetails();
    const summary = document.getElementById('finalQuote');
    const items = [
      ...d.onceItems.map(item => `<div class="final-quote-item"><span>${item.label}</span><b>${money(item.price)}</b></div>`),
      ...(d.monthly ? [`<div class="final-quote-item"><span>${d.care.name}</span><b>${money(d.monthly)} / Monat</b></div>`] : [])
    ].join('');
    summary.innerHTML = `
      <div class="final-quote-head"><b>Ihre aktuelle Konfiguration</b><span>${contentPageCount()} Inhaltsseiten · ${d.web.length + d.ai.length} Zusatzfunktionen</span></div>
      <div class="final-quote-list">${items}</div>
      <div class="final-quote-total"><span>Einmaliger Richtpreis</span><strong>${money(d.once)}</strong></div>
      <div class="final-quote-monthly"><span>Laufende Betreuung</span><b>${money(d.monthly)} / Monat</b></div>`;
  }

  function updateAll() {
    renderSidebar();
    if (currentStep === 3) renderFinalQuote();
  }

  function setError(message) {
    globalError.textContent = message;
    globalError.classList.toggle('show', Boolean(message));
  }

  function validateStep(step) {
    if (step === 0) {
      if (!valueOf('projectType')) return 'Bitte wählen Sie zuerst ein Website-Paket aus.';
      if (!valueOf('industry')) return 'Bitte geben Sie Ihre Branche oder Ihren Tätigkeitsbereich an.';
    }
    if (step === 1) {
      if (!valueOf('designStyle')) return 'Bitte wählen Sie eine Designrichtung aus.';
      if (!checkedValues('pages').length) return 'Bitte wählen Sie mindestens eine Inhaltsseite aus.';
    }
    return '';
  }

  function showStep(index) {
    currentStep = Math.max(0, Math.min(totalSteps - 1, index));
    panels.forEach((panel, i) => {
      panel.classList.toggle('active', i === currentStep);
      panel.setAttribute('aria-hidden', i === currentStep ? 'false' : 'true');
    });
    stepIndicators.forEach((item, i) => {
      item.classList.toggle('active', i === currentStep);
      item.classList.toggle('done', i < currentStep);
    });
    const names = ['Projekt', 'Design', 'Funktionen', 'Anfrage'];
    const percent = Math.round(((currentStep + 1) / totalSteps) * 100);
    document.getElementById('mobileStepName').textContent = `Schritt ${currentStep + 1} von ${totalSteps} · ${names[currentStep]}`;
    document.getElementById('mobileProgressPercent').textContent = `${percent} %`;
    document.getElementById('mobileProgressFill').style.width = `${percent}%`;
    backBtn.disabled = currentStep === 0;
    nextBtn.hidden = currentStep === totalSteps - 1;
    submitBtn.hidden = currentStep !== totalSteps - 1;
    mobileNextBtn.hidden = currentStep === totalSteps - 1;
    mobileSubmitBtn.hidden = currentStep !== totalSteps - 1;
    nextBtn.innerHTML = currentStep === 0 ? 'Weiter zum Design <span>→</span>' : currentStep === 1 ? 'Funktionen auswählen <span>→</span>' : 'Preis & Anfrage <span>→</span>';
    mobileNextBtn.innerHTML = currentStep === 0 ? 'Weiter <span>→</span>' : currentStep === 1 ? 'Funktionen <span>→</span>' : 'Weiter <span>→</span>';
    setError('');
    if (currentStep === 3) renderFinalQuote();
    if (window.innerWidth < 821) {
      document.getElementById('konfigurator').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      document.querySelector('.builder-main').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function goNext() {
    const error = validateStep(currentStep);
    if (error) return setError(error);
    showStep(currentStep + 1);
  }

  function collectPayload() {
    const d = priceDetails();
    return {
      source: 'pimentaGROUP Website-Konfigurator',
      submittedAt: new Date().toISOString(),
      project: {
        type: d.pkg.name,
        packageKey: packageKey(),
        basePrice: d.pkg.price,
        includedPages: d.pkg.includedPages,
        industry: valueOf('industry'),
        businessName: valueOf('businessName'),
        mainGoal: valueOf('mainGoal'),
        designStyle: valueOf('designStyle'),
        pages: checkedValues('pages'),
        contentPageCount: contentPageCount(),
        extraPages: d.extraPages,
        features: d.web.map(item => ({ id:item.id, name:item.name, price:item.price })),
        aiFeatures: d.ai.map(item => ({ id:item.id, name:item.name, setupPrice:item.price })),
        carePlan: { name:d.care.name, monthlyPrice:d.monthly },
        adviceRequested: Boolean(form.elements.aiUnsure?.checked),
        pricing: { oneTimeTotal:d.once, monthlyTotal:d.monthly, currency:'EUR' }
      },
      contact: {
        name: valueOf('contactName'),
        company: valueOf('contactCompany'),
        email: valueOf('email'),
        phone: valueOf('phone'),
        timeframe: valueOf('timeframe'),
        currentWebsite: valueOf('currentWebsite'),
        message: valueOf('message')
      },
      privacyConsent: Boolean(form.elements.privacyConsent.checked),
      website: valueOf('website')
    };
  }

  function validateContact() {
    const name = form.elements.contactName;
    const email = form.elements.email;
    if (!name.value.trim()) { name.focus(); name.setAttribute('aria-invalid','true'); return 'Bitte tragen Sie Ihren Namen ein.'; }
    name.removeAttribute('aria-invalid');
    if (!email.value.trim() || !email.checkValidity()) { email.focus(); email.setAttribute('aria-invalid','true'); return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'; }
    email.removeAttribute('aria-invalid');
    const currentWebsite = form.elements.currentWebsite;
    if (currentWebsite.value.trim() && !currentWebsite.checkValidity()) { currentWebsite.focus(); return 'Bitte prüfen Sie die URL Ihrer bestehenden Website.'; }
    if (!form.elements.privacyConsent.checked) return 'Bitte bestätigen Sie die Datenschutzhinweise.';
    return '';
  }

  function downloadRequest(payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pimenta-website-anfrage-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function submitRequest(event) {
    event.preventDefault();
    const error = validateContact();
    if (error) return setError(error);
    const payload = collectPayload();
    if (payload.website) return;
    submitBtn.disabled = true;
    mobileSubmitBtn.disabled = true;
    submitBtn.innerHTML = 'Wird gesendet …';
    mobileSubmitBtn.textContent = 'Wird gesendet …';
    setError('');
    try {
      if (CONFIG.FORM_ENDPOINT.trim()) {
        await fetch(CONFIG.FORM_ENDPOINT, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        document.getElementById('successTitle').textContent = 'Vielen Dank für Ihre Anfrage!';
        document.getElementById('successMessage').textContent = 'Ihre Konfiguration wurde an unseren Anfrage-Endpunkt übergeben. Wir melden uns persönlich bei Ihnen. Bitte beachten Sie: Die endgültige Projektkalkulation erfolgt nach einem gemeinsamen Gespräch.';
      } else {
        downloadRequest(payload);
        document.getElementById('successTitle').textContent = 'Ihre Konfiguration ist erstellt.';
        document.getElementById('successMessage').textContent = 'Die Anfrage wurde als JSON-Datei heruntergeladen. Damit neue Anfragen automatisch bei pimentaGROUP eingehen, muss einmalig die Google-Sheets-Verbindung eingerichtet werden. Die Anleitung dazu finden Sie in der README-Datei.';
      }
      successOverlay.hidden = false;
      document.getElementById('closeSuccess').focus();
    } catch (err) {
      console.error(err);
      setError('Die Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es erneut.');
    } finally {
      submitBtn.disabled = false;
      mobileSubmitBtn.disabled = false;
      submitBtn.innerHTML = 'Anfrage senden <span>↗</span>';
      mobileSubmitBtn.innerHTML = 'Anfrage senden <span>↗</span>';
    }
  }

  nextBtn.addEventListener('click', goNext);
  mobileNextBtn.addEventListener('click', goNext);
  backBtn.addEventListener('click', () => showStep(currentStep - 1));
  document.getElementById('editSelections').addEventListener('click', () => showStep(0));
  form.addEventListener('submit', submitRequest);
  mobileSubmitBtn.addEventListener('click', () => form.requestSubmit());

  form.addEventListener('change', event => {
    if (event.target.matches('input,select,textarea')) event.target.removeAttribute('aria-invalid');
    if (event.target.name === 'projectType') {
      const pkg = packageInfo();
      document.getElementById('pageIncludedText').textContent = `Im Paket enthalten: ${pkg.includedPages} ${pkg.includedPages === 1 ? 'Seite' : 'Seiten'}`;
    }
    updateAll();
  });

  function closeSuccess() { successOverlay.hidden = true; }
  document.getElementById('closeSuccess').addEventListener('click', closeSuccess);
  document.getElementById('closeSuccessPrimary').addEventListener('click', closeSuccess);
  successOverlay.addEventListener('click', event => { if (event.target === successOverlay) closeSuccess(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !successOverlay.hidden) closeSuccess(); });
  document.getElementById('year').textContent = new Date().getFullYear();

  renderFeatureCards('webFeatures','web');
  renderFeatureCards('aiFeatures','ai');
  updateAll();
  showStep(0);
})();
