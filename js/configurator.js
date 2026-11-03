(() => {
  'use strict';

  // Erst nach Einrichtung der Google-Apps-Script-Web-App befüllen.
  const CONFIG = { FORM_ENDPOINT: '' };
  const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const money = value => currency.format(Number(value || 0));

  // Die Pipeline nennt ca. 120 EUR/Monat nur als vorläufige Orientierung.
  // Die Modulpreise unten sind ein Vorschlag zur transparenten Aufteilung, keine freigegebene Preisliste.
  const BASE_MONTHLY = 35;
  const FREE_TRIAL_MONTHS = 2;
  const PRICE_STATUS = 'Vorläufige Preisorientierung – Einzelpreise intern noch freizugeben';

  const PROJECT_TYPES = {
    new: { name: 'Neue Website', description: 'Wir erstellen Ihren digitalen Auftritt neu.' },
    refresh: { name: 'Website erneuern', description: 'Wir modernisieren Ihre bestehende Website.' },
    extend: { name: 'Website erweitern', description: 'Wir ergänzen Ihre bestehende Website um Funktionen.' }
  };

  const FEATURES = {
    web: [
      { id:'booking', name:'Online-Terminbuchung', short:'Termine direkt online buchen', price:19, icon:'calendar', detail:'Kunden wählen Leistungen und verfügbare Termine direkt auf Ihrer Website. Je nach technischer Lösung kann eine externe Buchungsplattform nötig sein; deren Lizenz- oder Transaktionskosten sind nicht automatisch enthalten.', visual:'calendar' },
      { id:'employeeManagement', name:'Mitarbeiter- & Terminverwaltung', short:'Team und Verfügbarkeiten organisieren', price:15, icon:'team', detail:'Mitarbeiter, Arbeitszeiten und Terminübersichten werden zentral verwaltet. Der genaue Funktionsumfang hängt von der gewählten Buchungslösung ab. Externe Plattformlizenzen werden vorab separat ausgewiesen.', visual:'team' },
      { id:'localSEO', name:'Lokale SEO-Grundlagen', short:'Besser lokal gefunden werden', price:9, icon:'seo', detail:'Wir richten grundlegende lokale SEO-Elemente ein: Seitenstruktur, relevante Unternehmensinformationen, Metadaten und technische Basis. Das ist keine Garantie für bestimmte Rankings und keine laufende SEO-Kampagne.', visual:'seo' },
      { id:'instagramFeed', name:'Instagram-Integration', short:'Instagram-Inhalte auf der Website zeigen', price:4, icon:'instagram', detail:'Eine abgestimmte Instagram-Darstellung verbindet Ihre Website mit Ihrem Profil. Ob ein Live-Feed technisch verfügbar ist, hängt von den Plattform-Schnittstellen ab. Die Hilfe bei Einrichtung und Optimierung des Profils ist keine dauerhafte Social-Media-Betreuung; Beiträge werden nicht laufend für Sie erstellt.', visual:'instagram' },
      { id:'gallery', name:'Galerie & Portfolio', short:'Arbeiten und Referenzen präsentieren', price:3, icon:'image', detail:'Ein übersichtlicher Bildbereich für Frisuren, Nageldesigns, Räume oder Referenzen. Bilder und Nutzungsrechte müssen vom Unternehmen bereitgestellt bzw. geklärt werden.', visual:'gallery' },
      { id:'reviews', name:'Google-Bewertungen', short:'Kundenstimmen sichtbar zeigen', price:3, icon:'star', detail:'Ausgewählte Kundenstimmen oder ein Bewertungslink können auf der Website dargestellt werden. Eine automatische Live-Synchronisation hängt von einer verfügbaren Schnittstelle ab.', visual:'reviews' },
      { id:'maps', name:'Karte & Öffnungszeiten', short:'Standort und Zeiten auf einen Blick', price:0, icon:'map', detail:'Adresse, Öffnungszeiten und eine Anfahrtsmöglichkeit werden auf der Website dargestellt. Eine externe Karten-Einbettung wird nur nach gesonderter technischer und datenschutzrechtlicher Prüfung aktiviert.', visual:'map' },
      { id:'multilingual', name:'Mehrsprachigkeit', short:'Zusätzliche Sprachversionen', price:12, icon:'globe', detail:'Die vereinbarten Seiten werden in eine weitere Sprache übertragen und mit einer Sprachumschaltung versehen. Umfang und spätere Pflege werden im individuellen Angebot festgelegt.', visual:'language' },
      { id:'blog', name:'Blog & Neuigkeiten', short:'Aktuelles selbst veröffentlichen', price:5, icon:'edit', detail:'Ein Beitragsbereich für Neuigkeiten, Tipps oder Unternehmensmeldungen. Ein Redaktionssystem und die Rechte zur eigenständigen Pflege werden passend zum Projekt vereinbart.', visual:'blog' },
      { id:'newsletter', name:'Newsletter-Anmeldung', short:'Interessenten können sich eintragen', price:4, icon:'mail', detail:'Ein Anmeldeformular wird mit einem ausgewählten Newsletter-Anbieter verbunden. Anbieter, Double-Opt-in, Auftragsverarbeitung und mögliche Lizenzgebühren werden vor der Aktivierung geprüft.', visual:'newsletter' },
      { id:'faq', name:'FAQ-Bereich', short:'Häufige Fragen einfach beantworten', price:0, icon:'faq', detail:'Ein übersichtlicher Frage-Antwort-Bereich mit aufklappbaren Einträgen. Die Inhalte werden gemeinsam abgestimmt.', visual:'faq' },
      { id:'shop', name:'Produktverkauf / Mini-Shop', short:'Produkte oder Gutscheine online anbieten', price:25, icon:'shop', detail:'Ein kleiner Produkt- oder Gutscheinbereich mit Bestellablauf. Zahlungsanbieter, Transaktionsgebühren, rechtliche Shop-Pflichten und externe Lizenzen werden separat geprüft.', visual:'shop' }
    ],
    contact: [
      { id:'whatsapp', name:'WhatsApp-Kontakt', short:'Direkt eine WhatsApp-Nachricht öffnen', price:0, icon:'whatsapp', detail:'Ein gut sichtbarer Kontakt-Button öffnet eine Nachricht an Ihre WhatsApp-Business-Nummer. Das ist eine direkte Kontaktmöglichkeit und ausdrücklich noch kein automatischer Chatbot.', visual:'whatsapp' },
      { id:'whatsappBot', name:'WhatsApp-Chatbot', short:'Häufige Fragen automatisch beantworten', price:19, icon:'whatsappBot', detail:'Ein automatisierter Assistent beantwortet vorab definierte häufige Fragen und kann Anliegen vorsortieren. Die technische Anbindung an WhatsApp Business sowie mögliche Meta-, Plattform- und Nachrichtenkosten werden vor Start transparent geprüft. Anders als der einfache WhatsApp-Kontakt-Button ist dies eine automatisierte Kommunikationslösung.', visual:'whatsappBot' },
      { id:'contactPlus', name:'Erweitertes Kontaktformular', short:'Anfragen gezielt erfassen', price:2, icon:'form', detail:'Zusätzliche Felder und Auswahlmöglichkeiten helfen, Anfragen zu strukturieren. Versandweg, Empfänger, Spam-Schutz und Datenschutzhinweise werden passend zum tatsächlich eingesetzten Dienst eingerichtet.', visual:'form' }
    ],
    ai: [
      { id:'chatbot', name:'KI-Website-Chatbot', short:'Häufige Fragen rund um die Uhr beantworten', price:19, icon:'bot', detail:'Ein Website-Assistent beantwortet wiederkehrende Fragen anhand freigegebener Unternehmensinformationen. Antwortgrenzen und Übergabe an einen Menschen werden festgelegt. Laufende KI-API- und Nutzungsgebühren können zusätzlich anfallen.', visual:'chatbot' },
      { id:'leadAssistant', name:'KI-Anfrage-Assistent', short:'Anfragen erfassen und vorsortieren', price:12, icon:'spark', detail:'Der Assistent fragt wichtige Angaben ab und bereitet Anfragen strukturiert für Ihr Team auf. Er trifft keine verbindlichen Geschäftsentscheidungen und verspricht keine Verfügbarkeit.', visual:'assistant' },
      { id:'emailAssistant', name:'KI-E-Mail-Assistent', short:'Wiederkehrende Antworten vorbereiten', price:9, icon:'mail', detail:'Unterstützt beim Sortieren und Erstellen von Antwortentwürfen. Ein automatischer Versand erfolgt nur, wenn dieser Ablauf ausdrücklich vereinbart und eingerichtet wurde.', visual:'email' },
      { id:'crm', name:'CRM-Verknüpfung', short:'Kontakte strukturiert verwalten', price:15, icon:'workflow', detail:'Anfragen können an ein ausgewähltes CRM übertragen werden. CRM-Lizenzen, zusätzliche Nutzer und API-Gebühren sind nicht enthalten.', visual:'crm' },
      { id:'voice', name:'KI-Telefonassistent', short:'Anrufe annehmen und Anliegen erfassen', price:29, icon:'phone', detail:'Ein Sprachassistent nimmt Anrufe entgegen und erfasst Anliegen oder Terminwünsche. Rufnummer, Telefonie-Minuten, Anbieter- und KI-Verbrauch werden separat kalkuliert.', visual:'voice' },
      { id:'automation', name:'Prozess-Automatisierung', short:'Wiederkehrende Abläufe verbinden', price:12, icon:'zap', detail:'Verknüpft ausgewählte Formulare, E-Mails und Tools zu einem definierten Ablauf. Der genaue Prozess und mögliche Drittanbieter-Lizenzen werden vorab festgelegt.', visual:'automation' }
    ]
  };

  const ART_PLACEHOLDER = '';
  const ART={
    calendar:'<rect x="17" y="22" width="66" height="58" rx="7" fill="#fff" stroke="#ced9cc"/><path d="M17 37h66" stroke="#ced9cc"/><path d="M33 16v13M67 16v13" stroke="#668469" stroke-width="4" stroke-linecap="round"/><g fill="#8da58b"><rect x="28" y="47" width="10" height="8" rx="2"/><rect x="45" y="47" width="10" height="8" rx="2"/><rect x="62" y="47" width="10" height="8" rx="2"/></g><rect x="45" y="63" width="10" height="8" rx="2" fill="#3e5a45"/>',
    gallery:'<rect x="14" y="18" width="72" height="62" rx="6" fill="#fff" stroke="#d2dbd0"/><rect x="21" y="25" width="30" height="22" rx="3" fill="#b9cbb6"/><rect x="56" y="25" width="23" height="22" rx="3" fill="#e5d7c0"/><rect x="21" y="53" width="58" height="19" rx="3" fill="#dbe4d8"/><circle cx="39" cy="33" r="4" fill="#fff"/>',
    reviews:'<path d="m50 13 10 21 23 3-17 16 4 23-20-11-20 11 4-23-17-16 23-3Z" fill="#c9b17e"/><path d="M26 84h48" stroke="#cbd7c8" stroke-width="5" stroke-linecap="round"/>',
    map:'<path d="m15 24 23-9 25 9 22-9v61l-22 9-25-9-23 9Z" fill="#fff" stroke="#ced9cc" stroke-width="2"/><path d="M38 15v61M63 24v61" stroke="#cad6c8" stroke-width="2"/><path d="M50 33c-8 0-14 6-14 14 0 10 14 25 14 25s14-15 14-25c0-8-6-14-14-14Z" fill="#6b8b6b"/><circle cx="50" cy="47" r="4" fill="#fff"/>',
    language:'<circle cx="50" cy="50" r="34" fill="#fff" stroke="#cdd8cc" stroke-width="3"/><path d="M16 50h68M50 16c18 18 18 50 0 68M50 16c-18 18-18 50 0 68" fill="none" stroke="#89a086" stroke-width="3"/><text x="50" y="56" text-anchor="middle" font-size="19" font-weight="700" fill="#405a45">A/文</text>',
    blog:'<rect x="20" y="16" width="60" height="68" rx="6" fill="#fff" stroke="#cfd9cd"/><rect x="29" y="25" width="42" height="21" rx="3" fill="#dce7d9"/><path d="M30 57h40M30 65h34M30 73h25" stroke="#9db09b" stroke-width="4" stroke-linecap="round"/>',
    newsletter:'<rect x="15" y="26" width="70" height="48" rx="7" fill="#fff" stroke="#cdd8cc" stroke-width="2"/><path d="m17 30 33 25 33-25" fill="none" stroke="#7e987b" stroke-width="4"/><path d="M29 17h42" stroke="#a7b8a3" stroke-width="4" stroke-linecap="round"/>',
    faq:'<rect x="17" y="17" width="66" height="64" rx="7" fill="#fff" stroke="#ccd8ca"/><path d="M28 34h42M28 51h42M28 68h27" stroke="#a8b8a5" stroke-width="5" stroke-linecap="round"/><circle cx="72" cy="68" r="10" fill="#557252"/><text x="72" y="73" fill="#fff" font-size="13" text-anchor="middle" font-weight="700">?</text>',
    whatsapp:'<circle cx="50" cy="48" r="33" fill="#62a875"/><path d="M31 70 34 58a29 29 0 1 1 11 11Z" fill="#62a875"/><path d="M38 35c-3 4-2 11 5 19 6 7 14 11 19 7l4-5-9-6-4 4c-4-2-7-5-9-9l4-4-6-9Z" fill="#fff"/>',
    form:'<rect x="21" y="14" width="58" height="72" rx="6" fill="#fff" stroke="#cdd8cc" stroke-width="2"/><path d="M32 31h34M32 44h34M32 57h20" stroke="#a6b6a2" stroke-width="4" stroke-linecap="round"/><rect x="54" y="67" width="17" height="9" rx="3" fill="#668466"/>',
    callback:'<circle cx="50" cy="49" r="33" fill="#fff" stroke="#cbd8ca" stroke-width="3"/><path d="M37 31c-4 2-5 8-3 14 5 13 17 24 30 26 6 1 11-1 12-6l-11-8-6 5c-6-3-10-7-13-13l5-5Z" fill="#718e70"/>',
    chatbot:'<rect x="18" y="25" width="64" height="47" rx="12" fill="#fff" stroke="#cbd8ca" stroke-width="2"/><path d="M50 15v10M42 15h16" stroke="#6b8868" stroke-width="3" stroke-linecap="round"/><circle cx="39" cy="46" r="4" fill="#688366"/><circle cx="61" cy="46" r="4" fill="#688366"/><path d="M39 58h22" stroke="#a5b7a2" stroke-width="4" stroke-linecap="round"/>',
    assistant:'<path d="m50 12 8 19 20 8-20 8-8 21-8-21-20-8 20-8Z" fill="#c7b180"/><path d="m76 62 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" fill="#8aa087"/>',
    email:'<rect x="14" y="28" width="72" height="48" rx="7" fill="#fff" stroke="#cbd8ca" stroke-width="2"/><path d="m18 33 32 25 32-25" fill="none" stroke="#789375" stroke-width="4"/><path d="M30 17h40" stroke="#a6b8a2" stroke-width="4" stroke-linecap="round"/>',
    crm:'<rect x="14" y="18" width="25" height="25" rx="5" fill="#dce7d9" stroke="#9bb099"/><rect x="61" y="18" width="25" height="25" rx="5" fill="#e8e0cf" stroke="#cbb98f"/><rect x="38" y="62" width="25" height="25" rx="5" fill="#dce7d9" stroke="#9bb099"/><path d="M39 31h22M50 43v19" stroke="#738d70" stroke-width="3"/>',
    voice:'<rect x="39" y="14" width="22" height="49" rx="11" fill="#fff" stroke="#cbd8ca" stroke-width="3"/><path d="M28 46v5a22 22 0 0 0 44 0v-5M50 73v13M38 86h24" fill="none" stroke="#708c6d" stroke-width="4" stroke-linecap="round"/>',
    automation:'<circle cx="26" cy="50" r="11" fill="#e2eadf" stroke="#90a78c" stroke-width="2"/><circle cx="74" cy="26" r="11" fill="#f0e8d8" stroke="#c8b17e" stroke-width="2"/><circle cx="74" cy="74" r="11" fill="#e2eadf" stroke="#90a78c" stroke-width="2"/><path d="M37 47 63 31M37 53l26 16" stroke="#81977e" stroke-width="3"/>',

    team:'<rect x="14" y="23" width="72" height="57" rx="8" fill="#fff" stroke="#cbd8ca" stroke-width="2"/><circle cx="34" cy="42" r="8" fill="#91a98e"/><circle cx="66" cy="42" r="8" fill="#c8b17e"/><path d="M20 69c2-10 8-14 14-14s12 4 14 14M52 69c2-10 8-14 14-14s12 4 14 14" fill="none" stroke="#81977e" stroke-width="4" stroke-linecap="round"/>',
    seo:'<circle cx="43" cy="43" r="24" fill="#fff" stroke="#8da58b" stroke-width="5"/><path d="m61 61 19 19" stroke="#6e896b" stroke-width="7" stroke-linecap="round"/><path d="M30 44 39 53 57 34" fill="none" stroke="#c8b17e" stroke-width="4" stroke-linecap="round"/>',
    instagram:'<rect x="18" y="18" width="64" height="64" rx="18" fill="#fff" stroke="#b8a6c4" stroke-width="4"/><rect x="31" y="31" width="38" height="38" rx="12" fill="none" stroke="#8f7b9f" stroke-width="4"/><circle cx="50" cy="50" r="9" fill="none" stroke="#8f7b9f" stroke-width="4"/><circle cx="68" cy="32" r="3" fill="#c8b17e"/>',
    whatsappBot:'<path d="M50 14a34 34 0 0 0-29 52l-4 16 17-4a34 34 0 1 0 16-64Z" fill="#6ca77a"/><path d="M37 37c-3 4-1 11 6 18s14 10 18 7l4-5-9-6-4 4c-4-2-7-5-9-9l4-4-6-9Z" fill="#fff"/><circle cx="73" cy="27" r="12" fill="#c8b17e"/><path d="M68 27h10M73 22v10" stroke="#fff" stroke-width="2"/>',
    shop:'<path d="M18 38h64l-6 43H24Z" fill="#fff" stroke="#cbd8ca" stroke-width="3"/><path d="M31 39V28a19 19 0 0 1 38 0v11" fill="none" stroke="#789375" stroke-width="5"/><path d="M39 57h22" stroke="#c8b17e" stroke-width="5" stroke-linecap="round"/>'

  };
  const form = document.getElementById('configForm');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const panels = [...document.querySelectorAll('.step-panel')];
  let step = 0, category = 'web', dialogFeature = null;
  const selectedFeatureIds = new Set();
  const selectedSocialIds = new Set();
  const getValue = name => String(form.elements[name]?.value || '').trim();
  const checked = name => name === 'features' ? [...selectedFeatureIds] : name === 'social' ? [...selectedSocialIds] : [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(x => x.value);
  const allFeatures = Object.values(FEATURES).flat();
  const featureById = id => allFeatures.find(x => x.id === id);
  const selectedFeatures = () => checked('features').map(featureById).filter(Boolean);
  const selectedAI = () => selectedFeatures().filter(x => FEATURES.ai.includes(x));
  const selectedWeb = () => selectedFeatures().filter(x => FEATURES.web.includes(x));
  const selectedSocial = () => checked('social');
  const projectData = () => PROJECT_TYPES[getValue('projectType') || 'new'];
  const totals = () => {
    const chosen = selectedFeatures();
    const modulesMonthly = chosen.reduce((sum, item) => sum + item.price, 0);
    return { base: BASE_MONTHLY, chosen, modulesMonthly, monthly: BASE_MONTHLY + modulesMonthly };
  };
  function art(item) { const svg = ART[item.visual] || ART.assistant; return `<svg viewBox="0 0 100 100" role="img" aria-label="Schematische Darstellung: ${item.name}">${svg}</svg>`; }

  const featureCategories = {
    web: { title:'Website & Sichtbarkeit', sub:'Bausteine für Ihren Webauftritt', hint:'Wählen Sie aus – die Vorschau zeigt die Änderung sofort.' },
    contact: { title:'Kontakt & Termine', sub:'So erreichen Sie Ihre Kunden', hint:'WhatsApp-Link und WhatsApp-Chatbot sind zwei unterschiedliche Leistungen.' },
    ai: { title:'KI & Automatisierung', sub:'Assistenten und digitale Abläufe', hint:'Mögliche KI- und Drittanbieter-Nutzungskosten werden vorab gesondert ausgewiesen.' },
    social: { title:'Social Media', sub:'Bestehende Profile mit Ihrer Website verbinden', hint:'Profil-Links sind inklusive. Keine laufende Beitragserstellung oder Kanalbetreuung.' }
  };

  function renderSocial() {
    const opts = [['instagram','Instagram','◎'],['facebook','Facebook','f'],['tiktok','TikTok','♪'],['linkedin','LinkedIn','in']];
    $('featureGrid').innerHTML = `<div class="social-choice-list">${opts.map(([id,name,ic]) => `<label class="social-choice"><input type="checkbox" name="social" value="${id}" ${selectedSocial().includes(id) ? 'checked' : ''}><span class="social-logo">${ic}</span><span><b>${name}</b><small>Profil-Link auf der Website anzeigen</small></span><span class="social-included">inklusive</span></label>`).join('')}</div><div class="social-support-note"><b>Profil-Setup auf Wunsch</b><span>Einrichtung und Optimierung stimmen wir individuell ab. Laufende Posts und Community-Management sind nicht enthalten.</span></div>`;
  }

  function renderFeatures() {
    const cfg = featureCategories[category];
    $('categoryTitle').textContent = cfg.title;
    $('categorySubtitle').textContent = cfg.sub;
    $('optionsFootnote').textContent = cfg.hint;
    document.querySelectorAll('[data-category]').forEach(button => {
      const active = button.dataset.category === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    if (category === 'social') {
      renderSocial();
      $('categoryCount').textContent = `${selectedSocial().length} Profile`;
      return;
    }
    const list = FEATURES[category];
    $('featureGrid').innerHTML = list.map(item => {
      const active = selectedFeatureIds.has(item.id);
      const price = item.price === 0 ? '<b>Inklusive</b><small>im Basisdienst</small>' : `<b>+ ${money(item.price)}</b><small>pro Monat</small>`;
      return `<article class="feature-card ${active ? 'selected' : ''}" data-feature-card="${item.id}">
        <input type="checkbox" name="features" value="${item.id}" ${active ? 'checked' : ''} hidden>
        <div class="feature-art">${art(item)}</div>
        <div class="feature-card-copy"><strong>${item.name}</strong><small>${item.short}</small>
          <div class="feature-actions-row"><button type="button" class="feature-toggle" data-select-feature="${item.id}" aria-pressed="${active}">${active ? 'Ausgewählt ✓' : 'Hinzufügen +'}</button><button type="button" class="feature-info" data-feature-info="${item.id}" aria-label="Details zu ${item.name}" title="Details ansehen">i</button></div>
        </div><div class="feature-price">${price}</div></article>`;
    }).join('');
    $('categoryCount').textContent = `${list.filter(item => selectedFeatureIds.has(item.id)).length} ausgewählt`;
  }

  function toggleFeature(id) {
    if (selectedFeatureIds.has(id)) selectedFeatureIds.delete(id); else selectedFeatureIds.add(id);
    renderFeatures(); updateAll();
  }

  function renderMock() {
    const d = totals();
    const ids = selectedFeatureIds;
    const moduleMap = [
      ['booking','Online-Terminbuchung','▦'],['employeeManagement','Teamverwaltung','♙'],['localSEO','Lokale SEO','⌖'],
      ['instagramFeed','Instagram-Integration','◎'],['gallery','Galerie','▧'],['reviews','Bewertungen','★'],
      ['maps','Standort & Zeiten','⌖'],['multilingual','Sprachen','文'],['blog','Neuigkeiten','✎'],
      ['newsletter','Newsletter','✉'],['faq','FAQ','?'],['whatsapp','WhatsApp-Kontakt','◔'],
      ['whatsappBot','WhatsApp-Bot','◉'],['contactPlus','Kontaktformular','☷'],['chatbot','KI-Chat','✳'],
      ['leadAssistant','KI-Anfragen','⌁'],['crm','CRM','⇄'],['voice','KI-Telefon','◖'],['automation','Automatik','⚙'],['shop','Mini-Shop','€']
    ];
    const modules = moduleMap.filter(([id]) => ids.has(id)).slice(0, 8).map(([id,name,icon]) => `<div class="mock-module"><i>${icon}</i>${name}</div>`).join('');
    $('mockModules').innerHTML = modules || '<div class="mock-empty-module">Ihre gewählten Funktionen erscheinen hier</div>';
    $('phoneModules').innerHTML = d.chosen.length ? d.chosen.slice(0,3).map(() => '<span class="phone-mini-line"></span><span class="phone-mini-line short"></span>').join('') : '<span class="phone-mini-line"></span><span class="phone-mini-line short"></span>';
    $('phoneWhatsapp').hidden = !(ids.has('whatsapp') || ids.has('whatsappBot'));
    $('phoneAction').textContent = ids.has('booking') ? 'Termin buchen' : (ids.has('whatsapp') || ids.has('whatsappBot')) ? 'WhatsApp öffnen' : 'Kontakt aufnehmen';
    const brand = (getValue('businessName') || 'IHR UNTERNEHMEN').toUpperCase().slice(0,24);
    $('mockBrand').textContent = brand;
    $('phoneBrand').textContent = (getValue('businessName') || 'IHR STUDIO').toUpperCase().slice(0,18);
    const skin = ({'Elegant & ruhig':'look-elegant','Mutig & kreativ':'look-bold'})[getValue('designStyle')] || 'look-modern';
    $('webMock').classList.remove('look-modern','look-elegant','look-bold'); $('webMock').classList.add(skin);
    $('mockCta').innerHTML = ids.has('shop') ? 'Produkte ansehen <b>↗</b>' : ids.has('booking') ? 'Termin buchen <b>↗</b>' : 'Jetzt entdecken <b>↗</b>';
    const aiActive = selectedAI().length > 0 || ids.has('whatsappBot');
    $('aiNode').classList.toggle('active', aiActive);
    $('aiNodeTitle').textContent = aiActive ? `${selectedAI().length + (ids.has('whatsappBot') ? 1 : 0)} ASSISTENTEN AKTIV` : 'AI OPTIONAL';
    $('aiNodeText').textContent = aiActive ? [...selectedAI().map(x => x.name.replace('KI-','')), ...(ids.has('whatsappBot') ? ['WhatsApp-Bot'] : [])].slice(0,2).join(' · ') : 'Assistenten optional ergänzen';
    const platforms = selectedSocial();
    const symbols = {instagram:'◎',facebook:'f',tiktok:'♪',linkedin:'in'};
    $('socialPreview').innerHTML = platforms.length ? platforms.map(x => `<i class="social-${x}">${symbols[x]}</i>`).join('') : '<span class="social-empty">Profile optional</span>';
    const count = d.chosen.length + platforms.length;
    $('visualSelectedCount').textContent = `${count} Baustein${count === 1 ? '' : 'e'} aktiv`;
    $('visualSelectedHint').textContent = platforms.length ? `${platforms.length} Social-Profil(e) verbunden` : 'Auswahl erscheint hier live';
    const chips = [...d.chosen.map(x => x.name), ...platforms.map(x => ({instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',linkedin:'LinkedIn'})[x])];
    $('selectedChips').innerHTML = chips.length ? chips.map(x => `<span class="selected-chip">${x}</span>`).join('') : '<span class="empty-chip">Noch keine Zusatzfunktion ausgewählt</span>';
    $('previewBadge').innerHTML = `<span>✓</span> ${count ? `${count} Anpassungen aktiv` : 'Ihre Auswahl wird live angezeigt'}`;
  }

  function renderQuote() {
    const d = totals();
    $('quotePackageName').textContent = projectData().name;
    $('quoteBasePrice').textContent = `${money(d.base)} / Monat`;
    $('quoteLines').innerHTML = d.chosen.length ? d.chosen.map(item => `<div class="quote-line"><span>${item.name}</span><b>${item.price ? `+ ${money(item.price)}` : 'inklusive'}</b></div>`).join('') : '<div class="quote-empty">Wählen Sie Funktionen aus – der Preis aktualisiert sich live.</div>';
    $('quoteTotal').textContent = `${money(d.monthly)} / Monat`;
    $('quoteMonthly').textContent = '0 €';
    $('mobileTotal').textContent = `${money(d.monthly)} / Monat`;
    $('mobileMonthly').textContent = '2 Monate kostenlos';
  }

  function renderFinal() {
    const d = totals();
    const socialNames = {instagram:'Instagram', facebook:'Facebook', tiktok:'TikTok', linkedin:'LinkedIn'};
    const rows = [
      {name:`Projekt: ${projectData().name}`, price:null},
      {name:'Website, Hosting & Basis-Support', price:d.base},
      ...d.chosen.map(item => ({name:item.name, price:item.price})),
      ...(selectedSocial().length ? [{name:`Social-Profile: ${selectedSocial().map(x => socialNames[x]).join(', ')}`, price:0}] : [])
    ];
    $('finalSummary').innerHTML = `<div class="final-summary-list">${rows.map(item => `<div><span>${item.name}</span><b>${item.price === null ? '' : item.price ? `${money(item.price)} / Mon.` : 'inklusive'}</b></div>`).join('')}</div>`;
    $('finalTotal').textContent = '0 €';
    $('finalMonthly').textContent = `${money(d.monthly)} / Monat nach 2 Freimonaten`;
    const trial = $('finalTrialNote');
    if (trial) trial.textContent = 'Website-Erstellung kostenlos · 2 Monate kostenlos testen · Danach nur bei ausdrücklicher Vereinbarung.';
  }

  function updateAll() {
    document.querySelectorAll('.package-card').forEach(card => card.classList.toggle('selected', card.querySelector('input').checked));
    document.querySelectorAll('.design-choice').forEach(card => card.classList.toggle('selected', card.querySelector('input').checked));
    renderQuote(); renderMock();
    if (category !== 'social') {
      $('categoryCount').textContent = `${FEATURES[category].filter(item => selectedFeatureIds.has(item.id)).length} ausgewählt`;
      document.querySelectorAll('[data-feature-card]').forEach(card => {
        const active = selectedFeatureIds.has(card.dataset.featureCard);
        card.classList.toggle('selected', active);
        const button = card.querySelector('[data-select-feature]');
        if (button) { button.textContent = active ? 'Ausgewählt ✓' : 'Hinzufügen +'; button.setAttribute('aria-pressed', String(active)); }
      });
    } else $('categoryCount').textContent = `${selectedSocial().length} Profile`;
    if (step === 2) renderFinal();
  }

  function showStep(nextStep) {
    step = Math.max(0, Math.min(2, nextStep));
    panels.forEach((panel, i) => { panel.hidden = i !== step; panel.classList.toggle('active', i === step); });
    document.querySelectorAll('[data-step-jump]').forEach((button, i) => { button.classList.toggle('active', i === step); button.classList.toggle('done', i < step); });
    $('mobileQuoteBar').hidden = step !== 1;
    if (step === 2) renderFinal();
    document.getElementById('konfigurator').scrollIntoView({behavior:'smooth', block:'start'});
  }

  function openDetails(id) {
    const item = featureById(id);
    if (!item) return;
    dialogFeature = item;
    $('detailIcon').innerHTML = art(item);
    $('detailTitle').textContent = item.name;
    $('detailDescription').textContent = item.detail;
    $('detailMeta').textContent = item.price ? `${money(item.price)} pro Monat · 2 Monate kostenlos testen` : 'Im Basisdienst enthalten · 2 Monate kostenlos testen';
    $('detailSelect').textContent = selectedFeatureIds.has(id) ? 'Auswahl entfernen' : 'Funktion hinzufügen';
    $('featureDialog').showModal();
  }

  function payload() {
    const d = totals();
    return {
      source: 'pimentaGROUP Website-Konfigurator',
      submittedAt: new Date().toISOString(),
      project: {
        type: projectData().name,
        projectKey: getValue('projectType'),
        industry: getValue('industry'),
        businessName: getValue('businessName'),
        employeeCount: getValue('employeeCount'),
        websiteStatus: getValue('websiteStatus'),
        mainGoal: getValue('mainGoal'),
        designStyle: getValue('designStyle'),
        features: selectedWeb().map(item => ({id:item.id,name:item.name,monthlyPrice:item.price})),
        aiFeatures: selectedAI().map(item => ({id:item.id,name:item.name,monthlyPrice:item.price})),
        contactFeatures: selectedFeatures().filter(item => FEATURES.contact.includes(item)).map(item => ({id:item.id,name:item.name,monthlyPrice:item.price})),
        socialProfiles: selectedSocial(),
        profileSupport: 'Bei Bedarf im individuellen Angebot abzustimmen; keine laufende Social-Media-Betreuung',
        pricing: {
          setupPrice: 0, baseMonthly: d.base, addonsMonthly: d.modulesMonthly,
          monthlyAfterTrial: d.monthly, freeTrialMonths: FREE_TRIAL_MONTHS,
          trialTotal: 0, currency:'EUR', status:PRICE_STATUS,
          note:'Unverbindliche monatliche Richtwerte. Verbindliche Konditionen erst nach individuellem Angebot und ausdrücklicher Vereinbarung.'
        }
      },
      contact: {
        name:getValue('contactName'), company:getValue('contactCompany'), email:getValue('email'),
        phone:getValue('phone'), currentWebsite:getValue('currentWebsite'), message:getValue('message')
      },
      website:getValue('website')
    };
  }

  function downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `pimenta-konfiguration-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  function applySalonPreset() {
    selectedFeatureIds.clear();
    ['booking','whatsapp','whatsappBot','employeeManagement','chatbot','localSEO','instagramFeed'].forEach(id => selectedFeatureIds.add(id));
    selectedSocialIds.clear(); selectedSocialIds.add('instagram');
    category = 'web'; renderFeatures(); updateAll();
  }

  form.addEventListener('change', event => {
    if (event.target.name === 'projectType') {
      const statusByProject = {new:'Keine Website', refresh:'Veraltet / nicht mobiloptimiert', extend:'Vorhanden und aktuell'};
      form.elements.websiteStatus.value = statusByProject[event.target.value] || form.elements.websiteStatus.value;
    }
    if (event.target.name === 'social') {
      if (event.target.checked) selectedSocialIds.add(event.target.value); else selectedSocialIds.delete(event.target.value);
    }
    updateAll();
  });
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { category = button.dataset.category; renderFeatures(); }));
  $('featureGrid').addEventListener('click', event => {
    const info = event.target.closest('[data-feature-info]'); if (info) { openDetails(info.dataset.featureInfo); return; }
    const select = event.target.closest('[data-select-feature]'); if (select) { toggleFeature(select.dataset.selectFeature); return; }
    const card = event.target.closest('[data-feature-card]'); if (card) toggleFeature(card.dataset.featureCard);
  });
  $('detailSelect').addEventListener('click', () => {
    if (!dialogFeature) return;
    const id = dialogFeature.id;
    if (selectedFeatureIds.has(id)) selectedFeatureIds.delete(id); else selectedFeatureIds.add(id);
    renderFeatures(); updateAll(); $('featureDialog').close();
  });
  $('toFeatures').addEventListener('click', () => {
    if (!getValue('industry')) { form.elements.industry.focus(); form.elements.industry.reportValidity(); return; }
    if (!getValue('businessName')) { form.elements.businessName.focus(); form.elements.businessName.reportValidity(); return; }
    showStep(1);
  });
  $('toInquiry').addEventListener('click', () => showStep(2));
  $('toInquiryBottom').addEventListener('click', () => showStep(2));
  $('mobileContinue').addEventListener('click', () => showStep(2));
  $('backToBase').addEventListener('click', () => showStep(0));
  $('backToFeatures').addEventListener('click', () => showStep(1));
  $('editConfig').addEventListener('click', () => showStep(1));
  $('resetFeatures').addEventListener('click', () => { selectedFeatureIds.clear(); selectedSocialIds.clear(); renderFeatures(); updateAll(); });
  const presetButton = $('recommendedSet'); if (presetButton) presetButton.addEventListener('click', applySalonPreset);
  document.querySelectorAll('[data-step-jump]').forEach(button => button.addEventListener('click', () => {
    const n = Number(button.dataset.stepJump);
    if (n === 0) showStep(0);
    else if (n === 1 && getValue('industry') && getValue('businessName')) showStep(1);
    else if (n === 2 && getValue('industry') && getValue('businessName')) showStep(2);
  }));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    $('formError').textContent = '';
    if (!form.elements.privacyConsent.checked) { $('formError').textContent = 'Bitte bestätigen Sie, dass Sie die Datenschutzhinweise zur Kenntnis genommen haben.'; return; }
    if (!form.elements.contactName.value.trim() || !form.elements.email.validity.valid) { $('formError').textContent = 'Bitte geben Sie Ihren Namen und eine gültige E-Mail-Adresse ein.'; return; }
    if (getValue('website')) return;
    const data = payload(); const button = $('submitBtn'); button.disabled = true; button.textContent = 'Wird vorbereitet …';
    try {
      if (CONFIG.FORM_ENDPOINT) {
        await fetch(CONFIG.FORM_ENDPOINT, {method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(data)});
        $('successMessage').textContent = 'Ihre Anfrage wurde vom Browser an den eingerichteten Empfang übermittelt. Bitte beachten Sie: Die tatsächliche Speicherung muss im Google-Tabellenblatt kontrolliert werden.';
      } else {
        downloadJSON(data);
        $('successMessage').textContent = 'Ihre Konfiguration wurde als JSON-Datei exportiert. Der automatische Empfang bei pimentaGROUP ist noch nicht aktiviert.';
      }
      $('successDialog').showModal();
    } catch (error) {
      $('formError').textContent = 'Die Anfrage konnte nicht übermittelt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns per E-Mail.';
    } finally {
      button.disabled = false; button.innerHTML = 'Konfiguration abschließen <span>↗</span>';
    }
  });

  $('year').textContent = new Date().getFullYear();
  renderFeatures(); updateAll();
})();
