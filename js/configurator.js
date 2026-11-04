(() => {
  'use strict';

  // Erst nach Bereitstellung der Google-Apps-Script-Web-App ausfüllen.
  const CONFIG = { FORM_ENDPOINT: '' };
  const BASE_MONTHLY = 35;
  const FREE_TRIAL_MONTHS = 2;
  const PRICE_STATUS = 'Vorläufige Preisorientierung – monatliche Einzelpreise noch intern freizugeben';
  const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const money = value => euro.format(Number(value || 0));
  const $ = id => document.getElementById(id);

  const FEATURES = {
    website: [
      {id:'gallery',name:'Galerie & Portfolio',price:3,glyph:'▧',scene:'website',target:'module-gallery',detail:'Eine große, bildorientierte Galerie für Arbeiten, Referenzen oder Räume. Die Vorschau zeigt einen echten Bildbereich mit mehreren Formaten. Fotos und Nutzungsrechte werden vom Betrieb bereitgestellt bzw. vorab geklärt.'},
      {id:'reviews',name:'Google-Bewertungen',price:3,glyph:'★',scene:'website',target:'module-reviews',detail:'Ein Bewertungsbereich mit ausgewählten Kundenstimmen und einer Verknüpfung zum Bewertungsprofil. Eine automatische Live-Synchronisierung hängt von einer verfügbaren Schnittstelle ab.'},
      {id:'maps',name:'Karte & Öffnungszeiten',price:0,glyph:'⌖',scene:'website',target:'module-maps',detail:'Ein sichtbarer Standortbereich mit einer grafischen Karte, Adresse, Öffnungszeiten und einem Link zur Routenplanung. Eine externe Karten-Einbettung wird erst nach technischer und datenschutzrechtlicher Prüfung aktiviert.'},
      {id:'faq',name:'FAQ-Bereich',price:0,glyph:'＋',scene:'website',target:'module-faq',detail:'Ein aufklappbarer Fragenbereich. Besucher können Antworten direkt auf der Website öffnen, ohne erst anrufen zu müssen.'},
      {id:'blog',name:'Blog & Neuigkeiten',price:5,glyph:'▤',scene:'website',target:'module-blog',detail:'Ein redaktioneller Bereich für Neuigkeiten, Tipps und Beiträge. Die Vorschau zeigt einen echten Artikelaufbau mit Titel, Bild und Kurztext.'},
      {id:'shop',name:'Produktverkauf / Mini-Shop',price:25,glyph:'◇',scene:'website',target:'module-shop',detail:'Ein kleiner Produkt- oder Gutscheinbereich mit Produktkarten, Preisen und Bestellaufruf. Zahlungsanbieter, Transaktionsgebühren und rechtliche Shop-Pflichten werden separat geprüft.'},
      {id:'newsletter',name:'Newsletter-Anmeldung',price:4,glyph:'✉',scene:'website',target:'module-newsletter',detail:'Ein sichtbares Anmeldeformular für Neuigkeiten und Angebote. Newsletter-Anbieter, Double-Opt-in und mögliche Lizenzgebühren werden vor der Aktivierung geprüft.'}
    ],
    phone: [
      {id:'booking',name:'Online-Terminbuchung',price:19,glyph:'▦',scene:'phone',target:'phone-booking',detail:'Kunden wählen Leistungen, Wunschtermin und freie Uhrzeiten direkt auf Ihrer Website. Der genaue Buchungsablauf und mögliche Plattformlizenzen werden vor dem Start vereinbart.'},
      {id:'employeeManagement',name:'Mitarbeiter- & Terminverwaltung',price:15,glyph:'♙',scene:'phone',target:'phone-team',detail:'Mitarbeiter, Arbeitszeiten und Terminübersichten werden zentral verwaltet. Die Vorschau zeigt eine Team- und Tagesübersicht. Der genaue Funktionsumfang hängt von der gewählten Buchungslösung ab.'},
      {id:'whatsapp',name:'WhatsApp-Kontakt',price:0,glyph:'◔',scene:'phone',target:'phone-whatsapp',detail:'Ein Kontakt-Button öffnet eine Nachricht an Ihre WhatsApp-Business-Nummer. Das ist ein direkter Kontaktweg und noch kein automatischer Chatbot.'},
      {id:'contactPlus',name:'Erweitertes Kontaktformular',price:2,glyph:'▤',scene:'phone',target:'phone-contact',detail:'Ein Formular mit zusätzlichen Feldern und Auswahlmöglichkeiten hilft, Anfragen strukturiert zu erfassen. Empfänger, Versandweg und Spam-Schutz werden passend eingerichtet.'}
    ],
    ai: [
      {id:'whatsappBot',name:'WhatsApp-Chatbot',price:19,glyph:'◔',scene:'ai',target:'aiChatDemo',detail:'Ein automatisierter Assistent beantwortet definierte häufige Fragen über WhatsApp und kann Anliegen vorsortieren. Die Anbindung an WhatsApp Business sowie mögliche Meta-, Plattform- und Nachrichtenkosten werden separat geprüft.'},
      {id:'chatbot',name:'KI-Website-Chatbot',price:19,glyph:'✳',scene:'ai',target:'aiChatDemo',detail:'Ein Website-Assistent beantwortet wiederkehrende Fragen anhand freigegebener Unternehmensinformationen. Antwortgrenzen und die Übergabe an einen Menschen werden festgelegt. Laufende KI-API- und Nutzungsgebühren können zusätzlich anfallen.'},
      {id:'leadAssistant',name:'KI-Anfrage-Assistent',price:12,glyph:'⌁',scene:'ai',target:'automationDemo',detail:'Der Assistent fragt wichtige Angaben ab und bereitet Kundenanfragen strukturiert für Ihr Team vor. Er trifft keine verbindlichen Geschäftsentscheidungen und verspricht keine Verfügbarkeit.'},
      {id:'emailAssistant',name:'KI-E-Mail-Assistent',price:9,glyph:'✉',scene:'ai',target:'automationDemo',detail:'Unterstützt beim Sortieren und Erstellen von Antwortentwürfen für wiederkehrende Anfragen. Ein automatischer Versand erfolgt nur, wenn dieser Ablauf ausdrücklich vereinbart wurde.'},
      {id:'crm',name:'CRM-Verknüpfung',price:15,glyph:'⇄',scene:'ai',target:'automationDemo',detail:'Anfragen können an ein ausgewähltes CRM übertragen werden. CRM-Lizenzen, zusätzliche Nutzer und API-Gebühren sind nicht enthalten.'},
      {id:'voice',name:'KI-Telefonassistent',price:29,glyph:'◖',scene:'ai',target:'aiChatDemo',detail:'Ein Sprachassistent nimmt Anrufe entgegen und erfasst Anliegen oder Terminwünsche. Rufnummer, Telefonie-Minuten, Anbieter- und KI-Verbrauch werden separat kalkuliert.'},
      {id:'automation',name:'Prozess-Automatisierung',price:12,glyph:'⚙',scene:'ai',target:'automationDemo',detail:'Verbindet ausgewählte Formulare, E-Mails und Tools zu einem definierten Ablauf. Der genaue Prozess und mögliche Drittanbieter-Lizenzen werden vorab festgelegt.'}
    ],
    extras: [
      {id:'localSEO',name:'Lokale SEO-Grundlagen',price:9,glyph:'⌕',scene:'extras',target:'extrasVisual',detail:'Grundlegende lokale SEO-Einrichtung: Seitenstruktur, Unternehmensinformationen, Metadaten und technische Basis. Das ist keine Garantie für bestimmte Rankings und keine laufende SEO-Kampagne.'},
      {id:'multilingual',name:'Mehrsprachigkeit',price:12,glyph:'文',scene:'extras',target:'extrasVisual',detail:'Die vereinbarten Seiten werden in zusätzliche Sprachen übertragen und mit einer Sprachumschaltung versehen. Umfang und spätere Pflege werden im individuellen Angebot festgelegt.'}
    ],
    social: [
      {id:'instagramFeed',name:'Instagram-Integration',price:4,glyph:'◎',scene:'social',target:'socialProfile',detail:'Eine abgestimmte Instagram-Darstellung verbindet die Website mit Ihrem Profil. Ob ein Live-Feed technisch verfügbar ist, hängt von den aktuellen Plattform-Schnittstellen ab. Laufende Social-Media-Betreuung und die Erstellung von Beiträgen sind nicht enthalten.'}
    ]
  };

  const SOCIAL = [
    {id:'instagram',name:'Instagram',symbol:'◎'},
    {id:'facebook',name:'Facebook',symbol:'f'},
    {id:'tiktok',name:'TikTok',symbol:'♪'},
    {id:'linkedin',name:'LinkedIn',symbol:'in'}
  ];

  const SELECTED = new Set();
  const SELECTED_SOCIAL = new Set();
  let industry = 'Friseursalon / Barbershop';
  let websiteStatus = 'Keine Website';
  let currentInfoId = null;
  let currentScene = 'website';
  let railFrame = false;

  const allFeatures = Object.values(FEATURES).flat();
  const byId = id => allFeatures.find(item => item.id === id);
  const categoryOf = id => Object.keys(FEATURES).find(key => FEATURES[key].some(item => item.id === id));
  const selectedItems = () => allFeatures.filter(item => SELECTED.has(item.id));
  const moduleTotal = () => selectedItems().reduce((sum, item) => sum + item.price, 0);
  const monthlyTotal = () => BASE_MONTHLY + moduleTotal();
  const projectType = () => websiteStatus === 'Keine Website' ? 'Neue Website' : websiteStatus.startsWith('Veraltet') ? 'Website erneuern' : 'Website erweitern';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function renderFeatureRows() {
    const map = {website:'listWebsite',phone:'listPhone',ai:'listAI',extras:'listExtras',social:'listSocial'};
    Object.entries(map).forEach(([category, containerId]) => {
      const target = $(containerId);
      target.innerHTML = FEATURES[category].map(item => {
        const active = SELECTED.has(item.id);
        return `<div class="feature-row${active ? ' selected' : ''}" role="checkbox" aria-checked="${active}" tabindex="0" data-feature="${item.id}">
          <div class="feature-main"><span class="feature-glyph" aria-hidden="true">${item.glyph}</span><div class="feature-meta"><span class="feature-name">${item.name}</span><span class="feature-price">${item.price ? `+ ${money(item.price)} / Mon.` : 'Inklusive'}</span></div></div>
          <div class="feature-actions"><button type="button" class="feature-info" data-info="${item.id}" aria-label="Details zu ${item.name}">i</button><span class="feature-check" aria-hidden="true">✓</span></div>
        </div>`;
      }).join('');
    });
    $('socialChoices').innerHTML = SOCIAL.map(item => {
      const active = SELECTED_SOCIAL.has(item.id);
      return `<div class="social-choice${active ? ' selected' : ''}" role="checkbox" aria-checked="${active}" tabindex="0" data-social="${item.id}"><span class="social-choice-symbol">${item.symbol}</span><b>${item.name}</b><span class="social-choice-check">✓</span></div>`;
    }).join('');
  }

  function moduleHeading(eyebrow, title, subtitle = '') {
    return `<span class="module-kicker">${eyebrow}</span><h3 class="module-title">${title}</h3>${subtitle ? `<p class="module-subtitle">${subtitle}</p>` : ''}`;
  }

  function renderWebsiteModules() {
    const parts = [];
    const has = id => SELECTED.has(id);
    if (has('booking')) parts.push(`<section class="site-module module-booking" id="module-booking">${moduleHeading('ONLINE TERMIN','Ihren Termin auswählen','Wählen Sie Ihre gewünschte Leistung und einen passenden Zeitpunkt.')}
      <div class="booking-widget"><div class="booking-widget-head"><b>Was möchten Sie buchen?</b><small>01 / 03 · SERVICE</small></div><div class="booking-services"><span>Damen Haarschnitt · 49 €</span><span>Balayage · ab 129 €</span><span>Herren Styling · 35 €</span></div><div class="booking-dates"><span>MO<br>09</span><span>DI<br>10</span><span>MI<br>11</span><span>DO<br>12</span><span>FR<br>13</span></div><div class="booking-times"><span>09:00</span><span>10:30</span><span>12:00</span><span>14:00</span></div></div></section>`);
    if (has('employeeManagement')) parts.push(`<section class="site-module" id="module-team-management">${moduleHeading('UNSER TEAM','Die Menschen für Ihren Look')}
      <div class="module-team-grid"><div class="module-team-person"><span class="module-team-avatar"></span><div><b>Anna Müller</b><small>Heute · 09:00–17:00</small></div></div><div class="module-team-person"><span class="module-team-avatar"></span><div><b>Lukas Schneider</b><small>Heute · 10:00–18:00</small></div></div><div class="module-team-person"><span class="module-team-avatar"></span><div><b>Sophie Weber</b><small>Heute · 09:00–16:00</small></div></div></div></section>`);
    if (has('gallery')) parts.push(`<section class="site-module" id="module-gallery">${moduleHeading('EINBLICKE','Unsere Arbeiten','Ein kleiner Einblick in aktuelle Looks und Arbeiten aus dem Studio.')}
      <div class="module-gallery-grid"><i></i><i></i><i></i></div></section>`);
    if (has('instagramFeed')) parts.push(`<section class="site-module" id="module-instagram">${moduleHeading('FOLLOW US','Einblicke auf Instagram','Entdecken Sie aktuelle Arbeiten und Neuigkeiten aus unserem Studio.')}
      <div class="module-instagram-grid"><i></i><i></i><i></i><i></i></div></section>`);
    if (has('reviews')) parts.push(`<section class="site-module" id="module-reviews">${moduleHeading('KUNDENSTIMMEN','Das sagen unsere Kunden')}
      <div class="module-reviews-grid"><article class="review-card"><div class="review-stars">★★★★★</div><blockquote>„Ein wunderbares Studio. Ich habe mich vom ersten Moment an wohlgefühlt.“</blockquote><small>— Julia M. · Google-Bewertung</small></article><article class="review-card"><div class="review-stars">★★★★★</div><blockquote>„Tolle Beratung und ein Ergebnis, das einfach passt.“</blockquote><small>— Sarah K. · Google-Bewertung</small></article></div></section>`);
    if (has('maps')) parts.push(`<section class="site-module" id="module-maps">${moduleHeading('BESUCHEN SIE UNS','Wir freuen uns auf Sie.')}
      <div class="module-map-layout"><div class="map-art"><span class="map-park"></span><span class="map-water"></span><span class="map-pin"></span></div><div class="map-info"><b>Mitten in Münster.</b><span>Beispielstraße 12 · 48143 Münster</span><span>Mo–Fr · 09:00–18:00</span><a href="#siteContact">Route planen ↗</a></div></div></section>`);
    if (has('faq')) parts.push(`<section class="site-module" id="module-faq">${moduleHeading('GUT ZU WISSEN','Häufige Fragen')}
      <div class="module-faq-list"><details open><summary>Wie kann ich einen Termin buchen?</summary><p>Nutzen Sie unsere Online-Terminbuchung oder kontaktieren Sie uns direkt.</p></details><details><summary>Kann ich meinen Termin verschieben?</summary><p>Kontaktieren Sie uns rechtzeitig. Wir finden gemeinsam eine passende Lösung.</p></details><details><summary>Welche Zahlungsmöglichkeiten gibt es?</summary><p>Die verfügbaren Zahlungsarten erfahren Sie direkt bei Ihrem Besuch.</p></details></div></section>`);
    if (has('blog')) parts.push(`<section class="site-module" id="module-blog">${moduleHeading('NEUES AUS DEM STUDIO','Inspiration & Neuigkeiten')}
      <div class="module-blog-grid"><article class="blog-card"><div class="blog-art"></div><b>Die richtige Pflege für Ihren Look</b><small>Tipps aus unserem Studio</small></article><article class="blog-card"><div class="blog-art"></div><b>Neue Saison, neuer Stil</b><small>Inspiration & Trends</small></article><article class="blog-card"><div class="blog-art"></div><b>Unser Studio im Portrait</b><small>Ein Blick hinter die Kulissen</small></article></div></section>`);
    if (has('shop')) parts.push(`<section class="site-module" id="module-shop">${moduleHeading('SHOP','Lieblingsprodukte entdecken')}
      <div class="module-shop-grid"><article class="shop-card"><div class="shop-art"></div><b>Care Shampoo</b><small>Sanfte Pflege</small><strong>24 €</strong></article><article class="shop-card"><div class="shop-art"></div><b>Silk Conditioner</b><small>Glanz & Geschmeidigkeit</small><strong>29 €</strong></article><article class="shop-card"><div class="shop-art"></div><b>Studio Gutschein</b><small>Das passende Geschenk</small><strong>ab 30 €</strong></article></div></section>`);
    if (has('newsletter')) parts.push(`<section class="site-module module-newsletter" id="module-newsletter"><div class="newsletter-copy"><span class="module-kicker">STUDIO LETTER</span><h3>Post aus dem Studio.</h3><p>Neuigkeiten, Inspiration und besondere Angebote.</p></div><form class="newsletter-form"><input type="email" placeholder="Ihre E-Mail-Adresse"><button type="button">Anmelden ↗</button></form></section>`);
    if (has('contactPlus')) parts.push(`<section class="site-module" id="module-contact">${moduleHeading('KONTAKT','Schreiben Sie uns')}
      <form class="module-contact-form"><input placeholder="Ihr Name"><input placeholder="E-Mail-Adresse"><textarea placeholder="Ihre Nachricht"></textarea><button type="button">Nachricht vorbereiten ↗</button></form></section>`);
    $('siteModules').innerHTML = parts.join('');
    $('siteWhatsApp').hidden = !has('whatsapp');
    $('siteChatFloat').hidden = !has('chatbot');
    $('previewBrand').textContent = currentBrand();
    $('footerBrand').textContent = currentBrand();
    $('phoneBrand').textContent = currentBrand();
    $('siteChatFloat').hidden = !(has('chatbot') || has('whatsappBot'));
    if (has('chatbot') || has('whatsappBot')) {
      $('siteChatFloat').querySelector('b').textContent = has('chatbot') ? 'Fragen? Unser KI-Assistent hilft.' : 'Unser WhatsApp-Assistent ist da.';
    }
  }

  function currentBrand() {
    const company = $('contactForm').elements.contactCompany.value.trim();
    return (company || 'SÉLYS').toUpperCase().slice(0, 22);
  }

  function phoneCard(id, title, inner) {
    return `<section class="phone-module-card" id="phone-${id}"><b>${title}</b>${inner}</section>`;
  }

  function renderPhoneModules() {
    const parts = [];
    if (SELECTED.has('booking')) parts.push(phoneCard('booking','Termin buchen',`<small>Wählen Sie einen Service und Ihre Wunschzeit.</small><div class="phone-slot-list"><span>Haarschnitt</span><span>Balayage</span><span>Styling</span></div><div class="phone-slot-list"><span>Heute · 10:30</span><span>12:00</span><span>14:00</span></div>`));
    if (SELECTED.has('employeeManagement')) parts.push(phoneCard('team','Team & Termine',`<small>Heute · Mittwoch, 11. Juni</small><div class="phone-slot-list"><span>Anna · 09:00</span><span>Lukas · 10:30</span><span>Sophie · 12:00</span></div>`));
    if (SELECTED.has('whatsapp')) parts.push(phoneCard('whatsapp','WhatsApp-Kontakt',`<small>Direkt mit dem Studio schreiben.</small><div class="phone-slot-list"><span>Nachricht senden ↗</span></div>`));
    if (SELECTED.has('contactPlus')) parts.push(phoneCard('contact','Kontaktformular',`<small>Name</small><div class="phone-slot-list"><span>Ihre Nachricht …</span><span>Senden ↗</span></div>`));
    if (!parts.length) parts.push(`<span class="phone-module-empty">Wählen Sie rechts eine Funktion, um sie hier live zu sehen.</span>`);
    $('phoneLiveModule').innerHTML = parts.join('');
  }

  function renderSocial() {
    const chosen = SOCIAL.filter(item => SELECTED_SOCIAL.has(item.id));
    const handle = (currentBrand().toLowerCase().replace(/[^a-z0-9äöüß._-]/g,'') || 'ihr.studio').slice(0,22);
    $('socialHandle').textContent = handle;
    const names = chosen.map(item => `${item.symbol} ${item.name}`);
    $('socialNetworkLinks').innerHTML = names.length ? names.map(name => `<span>${escapeHTML(name)}</span>`).join('') : '<span>Noch keine Profile verknüpft</span>';
    $('socialConnection').querySelector('p').textContent = chosen.length ? `${chosen.length} Profil${chosen.length > 1 ? 'e' : ''} mit Ihrem Webauftritt verbunden.` : 'Wählen Sie rechts Ihre Social-Media-Profile.';
    $('socialPosts').style.opacity = (SELECTED.has('instagramFeed') || SELECTED_SOCIAL.has('instagram')) ? '1' : '.3';
  }

  function renderAI() {
    const bots = selectedItems().filter(item => categoryOf(item.id) === 'ai' || item.id === 'whatsappBot');
    const chosen = bots.map(item => item.name);
    const hasBot = SELECTED.has('chatbot') || SELECTED.has('whatsappBot');
    $('aiChatBody').innerHTML = hasBot
      ? `<div class="chat-time">HEUTE · 10:42</div><div class="chat-message bot">Hallo! Wie kann ich Ihnen helfen?</div><div class="chat-message user">Ich möchte einen Termin buchen.</div><div class="chat-message bot">Sehr gern. Ich zeige Ihnen die nächsten freien Zeiten.</div>`
      : `<div class="chat-time">VORSCHAU</div><div class="chat-message bot">So könnte ein digitaler Assistent mit Ihren Kunden kommunizieren.</div><div class="chat-message user">Welche Leistungen bieten Sie an?</div><div class="chat-message bot">Wählen Sie einen Chatbot, um diesen Ablauf zu aktivieren.</div>`;
    $('aiActiveLabel').textContent = chosen.length ? chosen.join(' · ') : 'Wählen Sie rechts eine Automatisierung.';
    const first = chosen[0] || 'Kundenanfrage';
    $('automationDemo').querySelector('.automation-active b').textContent = first;
    $('automationDemo').querySelector('.automation-active small').textContent = chosen.length > 1 ? `${chosen.length} Module ausgewählt` : 'Erkennen · Antworten · Sortieren';
  }

  function renderExtras() {
    const extras = selectedItems().filter(item => categoryOf(item.id) === 'extras');
    $('extrasActive').innerHTML = extras.length ? extras.map(item => `<span>${escapeHTML(item.name)} ✓</span>`).join('') : '<span>Keine Zusatzoption ausgewählt</span>';
    $('extrasVisual').classList.toggle('extras-seo-active', SELECTED.has('localSEO'));
    $('extrasVisual').classList.toggle('extras-language-active', SELECTED.has('multilingual'));
  }

  function updatePreview() {
    renderWebsiteModules();
    renderPhoneModules();
    renderSocial();
    renderAI();
    renderExtras();
  }

  function setScene(scene) {
    currentScene = scene;
    document.querySelectorAll('.scene').forEach(element => {
      const active = element.dataset.scene === scene;
      element.hidden = !active;
      element.classList.toggle('active', active);
    });
  }

  function scrollPreviewTo(targetId) {
    if (!targetId) return;
    requestAnimationFrame(() => {
      let target = $(targetId);
      if (!target) return;
      let scroller = null;
      if (targetId.startsWith('phone-')) scroller = $('phoneDevice').querySelector('.phone-screen');
      else if (targetId === 'aiChatDemo' || targetId === 'automationDemo') scroller = null;
      else if (target.closest('.demo-site')) scroller = $('siteViewport');
      else scroller = document.querySelector(`[data-scene="${currentScene}"]`);
      if (scroller && scroller.scrollTo) {
        const top = target.offsetTop - (scroller === $('siteViewport') ? 14 : 8);
        scroller.scrollTo({top:Math.max(0,top),behavior:'smooth'});
      }
      target.classList.remove('is-highlighted');
      void target.offsetWidth;
      target.classList.add('is-highlighted');
      window.setTimeout(() => target.classList.remove('is-highlighted'), 1700);
    });
  }

  function updatePrices() {
    const total = monthlyTotal();
    $('monthlyTotal').textContent = money(total);
    $('priceDialogTotal').textContent = `${money(total)} / Monat`;
    $('contactMonthly').textContent = `${money(total)} / Monat`;
    $('contactSelected').innerHTML = [
      `<span>Website, Hosting & Basis-Support · ${money(BASE_MONTHLY)}</span>`,
      ...selectedItems().map(item => `<span>${escapeHTML(item.name)} · ${item.price ? money(item.price) : 'inklusive'}</span>`)
    ].join('');
    const rows = [
      `<div class="price-breakdown-row"><span>Website, Hosting & Basis-Support<small>Nach der kostenlosen Testphase</small></span><b>${money(BASE_MONTHLY)} / Mon.</b></div>`,
      ...selectedItems().map(item => `<div class="price-breakdown-row"><span>${escapeHTML(item.name)}</span><b>${item.price ? `${money(item.price)} / Mon.` : 'Inklusive'}</b></div>`)
    ];
    $('priceBreakdown').innerHTML = rows.join('');
  }

  function refresh() {
    document.querySelectorAll('[data-feature]').forEach(row => {
      const active = SELECTED.has(row.dataset.feature);
      row.classList.toggle('selected', active);
      row.setAttribute('aria-checked', String(active));
    });
    document.querySelectorAll('[data-social]').forEach(row => {
      const active = SELECTED_SOCIAL.has(row.dataset.social);
      row.classList.toggle('selected', active);
      row.setAttribute('aria-checked', String(active));
    });
    updatePreview();
    updatePrices();
  }

  function alignRailToScene(scene) {
    const rail = $('optionsRail');
    const section = document.querySelector(`[data-scene-section="${scene}"]`);
    if (!rail || !section) return;
    const top = rail.scrollTop + section.getBoundingClientRect().top - rail.getBoundingClientRect().top;
    rail.scrollTo({top:Math.max(0, top), behavior:'smooth'});
  }

  function toggleFeature(id) {
    const item = byId(id);
    if (!item) return;
    if (SELECTED.has(id)) SELECTED.delete(id); else SELECTED.add(id);
    refresh();
    alignRailToScene(item.scene);
    setScene(item.scene);
    scrollPreviewTo(item.target);
  }

  function toggleSocial(id) {
    if (SELECTED_SOCIAL.has(id)) SELECTED_SOCIAL.delete(id); else SELECTED_SOCIAL.add(id);
    refresh();
    alignRailToScene('social');
    setScene('social');
    scrollPreviewTo('socialProfile');
  }

  function openInfo(id) {
    const item = byId(id);
    if (!item) return;
    currentInfoId = id;
    $('infoArt').innerHTML = illustration(item);
    $('infoTitle').textContent = item.name;
    $('infoDescription').textContent = item.detail;
    $('infoPrice').textContent = item.price ? `${money(item.price)} pro Monat · 2 Monate kostenlos testen` : 'Im Basisdienst enthalten';
    $('infoToggle').textContent = SELECTED.has(id) ? 'Aus Auswahl entfernen' : 'Hinzufügen';
    $('infoDialog').showModal();
  }

  function illustration(item) {
    const ink = '#282828', muted = '#bbb5aa', paper = '#fff', gold = '#b49e7a';
    const icon = {
      booking:`<rect x="24" y="22" width="152" height="142" rx="8" fill="${paper}" stroke="${muted}"/><path d="M24 52h152" stroke="${muted}" stroke-width="2"/><path d="M60 14v22M140 14v22" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><g fill="#eeeae3"><rect x="42" y="72" width="28" height="21" rx="3"/><rect x="86" y="72" width="28" height="21" rx="3"/><rect x="130" y="72" width="28" height="21" rx="3"/></g><rect x="86" y="112" width="28" height="21" rx="3" fill="${ink}"/><path d="M42 145h116" stroke="${muted}" stroke-width="4"/>`,
      maps:`<path d="m22 43 52-20 54 20 50-20v120l-50 20-54-20-52 20Z" fill="${paper}" stroke="${muted}" stroke-width="3"/><path d="M74 23v120M128 43v120" stroke="${muted}" stroke-width="3"/><path d="M105 52c-19 0-30 13-30 30 0 23 30 54 30 54s30-31 30-54c0-17-11-30-30-30Z" fill="${ink}"/><circle cx="105" cy="82" r="9" fill="${paper}"/>`,
      reviews:`<path d="m100 20 24 48 53 8-39 38 9 54-47-25-47 25 9-54-39-38 53-8Z" fill="${gold}"/><path d="M38 184h124" stroke="${muted}" stroke-width="7" stroke-linecap="round"/>`,
      seo:`<rect x="20" y="40" width="160" height="110" rx="9" fill="${paper}" stroke="${muted}"/><circle cx="50" cy="74" r="13" fill="none" stroke="${ink}" stroke-width="4"/><path d="m60 84 10 10" stroke="${ink}" stroke-width="4"/><path d="M87 67h70M87 86h54M38 119h118" stroke="${muted}" stroke-width="6" stroke-linecap="round"/>`,
      instagramFeed:`<rect x="30" y="22" width="140" height="160" rx="15" fill="${paper}" stroke="${muted}" stroke-width="3"/><circle cx="55" cy="47" r="11" fill="${gold}"/><path d="M80 43h65M80 54h40" stroke="${muted}" stroke-width="4" stroke-linecap="round"/><g><rect x="42" y="73" width="50" height="47" fill="#d1c5b5"/><rect x="101" y="73" width="50" height="47" fill="#9f9183"/><rect x="42" y="128" width="50" height="40" fill="#928579"/><rect x="101" y="128" width="50" height="40" fill="#d7cbbb"/></g>`,
      chatbot:`<rect x="25" y="30" width="150" height="142" rx="12" fill="${paper}" stroke="${muted}"/><path d="M25 64h150" stroke="${muted}"/><circle cx="48" cy="47" r="9" fill="${ink}"/><path d="M69 45h73" stroke="${muted}" stroke-width="5" stroke-linecap="round"/><rect x="39" y="82" width="94" height="24" rx="8" fill="#eeeae3"/><rect x="79" y="118" width="75" height="24" rx="8" fill="${ink}"/><path d="M41 155h112" stroke="${muted}" stroke-width="4" stroke-linecap="round"/>`
    };
    const body = icon[item.id] || `<rect x="25" y="25" width="150" height="150" rx="12" fill="${paper}" stroke="${muted}"/><path d="M55 80h90M55 105h65M55 130h78" stroke="${muted}" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="52" r="13" fill="${gold}"/>`;
    return `<svg viewBox="0 0 200 200" role="img" aria-label="Schematische Darstellung von ${escapeHTML(item.name)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  }

  function openIntro() {
    $('configuratorScreen').hidden = true;
    $('priceBar').hidden = true;
    $('introScreen').hidden = false;
  }

  function openConfigurator() {
    const selectedIndustry = document.querySelector('[data-industry].selected');
    const selectedWebsite = document.querySelector('[data-website].selected');
    industry = selectedIndustry?.dataset.industry || industry;
    websiteStatus = selectedWebsite?.dataset.website || websiteStatus;
    $('introScreen').hidden = true;
    $('configuratorScreen').hidden = false;
    $('priceBar').hidden = false;
    $('optionsRail').scrollTop = 0;
    setScene('website');
    refresh();
  }

  function activeRailScene() {
    const rail = $('optionsRail');
    const sections = [...document.querySelectorAll('.option-section[data-scene-section]')];
    if (!sections.length) return;
    // At the very end of the rail, the final category may not be able to
    // reach the top marker because the price bar reserves viewport space.
    if (rail.scrollTop + rail.clientHeight >= rail.scrollHeight - 4) {
      setScene(sections[sections.length - 1].dataset.sceneSection);
      return;
    }
    const marker = rail.getBoundingClientRect().top + Math.min(120, rail.clientHeight * .23);
    let best = sections[0], distance = Infinity;
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const d = marker < rect.top ? rect.top - marker : marker > rect.bottom ? marker - rect.bottom : 0;
      if (d < distance) {distance = d;best = section;}
    });
    if (best) setScene(best.dataset.sceneSection);
  }

  function getFormValue(name) {
    return String($('contactForm').elements[name]?.value || '').trim();
  }

  function buildPayload() {
    const selected = selectedItems();
    const group = key => FEATURES[key].filter(item => SELECTED.has(item.id)).map(item => ({id:item.id,name:item.name,monthlyPrice:item.price}));
    const businessName = getFormValue('contactCompany');
    return {
      source:'pimentaGROUP Website-Konfigurator',
      submittedAt:new Date().toISOString(),
      project:{
        type:projectType(),projectKey:websiteStatus === 'Keine Website' ? 'new' : websiteStatus.startsWith('Veraltet') ? 'refresh' : 'extend',
        industry,businessName,websiteStatus,
        features:group('website'),extrasFeatures:group('extras'),
        mobileFeatures:group('phone'),contactFeatures:group('phone').filter(item => ['whatsapp','whatsappBot','contactPlus'].includes(item.id)),
        aiFeatures:group('ai'),socialProfiles:[...SELECTED_SOCIAL],
        socialFeatures:group('social'),
        pricing:{setupPrice:0,baseMonthly:BASE_MONTHLY,addonsMonthly:moduleTotal(),monthlyAfterTrial:monthlyTotal(),freeTrialMonths:FREE_TRIAL_MONTHS,trialTotal:0,currency:'EUR',status:PRICE_STATUS,note:'Unverbindliche monatliche Richtwerte. Ein kostenpflichtiger Vertrag entsteht nur nach individuellem Angebot und ausdrücklicher Zustimmung.'},
        selectedFeatures:selected.map(item=>({id:item.id,name:item.name,category:categoryOf(item.id),monthlyPrice:item.price}))
      },
      contact:{name:getFormValue('contactName'),company:businessName,email:getFormValue('email'),phone:getFormValue('phone'),currentWebsite:'',message:getFormValue('message')},
      website:getFormValue('website')
    };
  }

  function downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `pimenta-konfiguration-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  function wireEvents() {
    document.querySelectorAll('[data-industry]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-industry]').forEach(item => item.classList.toggle('selected', item === button));
    }));
    document.querySelectorAll('[data-website]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-website]').forEach(item => item.classList.toggle('selected', item === button));
    }));
    $('startConfigurator').addEventListener('click', openConfigurator);

    $('optionsRail').addEventListener('click', event => {
      const info = event.target.closest('[data-info]');
      if (info) {event.stopPropagation();openInfo(info.dataset.info);return;}
      const row = event.target.closest('[data-feature]');
      if (row) toggleFeature(row.dataset.feature);
      const social = event.target.closest('[data-social]');
      if (social) toggleSocial(social.dataset.social);
    });
    $('optionsRail').addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-feature],[data-social]')) {
        event.preventDefault();
        if (event.target.dataset.feature) toggleFeature(event.target.dataset.feature);
        if (event.target.dataset.social) toggleSocial(event.target.dataset.social);
      }
    });
    $('optionsRail').addEventListener('scroll', () => {
      if (railFrame) return;
      railFrame = true;
      requestAnimationFrame(() => {activeRailScene();railFrame=false;});
    },{passive:true});

    $('infoToggle').addEventListener('click', () => {
      if (!currentInfoId) return;
      const id = currentInfoId;
      $('infoDialog').close();
      toggleFeature(id);
    });
    document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
    $('priceDetailsButton').addEventListener('click', () => $('priceDialog').showModal());
    $('requestButton').addEventListener('click', () => $('contactDialog').showModal());
    $('changeBasics').addEventListener('click', openIntro);
    $('contactForm').elements.contactCompany.addEventListener('input', () => {
      $('previewBrand').textContent = currentBrand();
      $('footerBrand').textContent = currentBrand();
      $('phoneBrand').textContent = currentBrand();
      $('socialHandle').textContent = currentBrand().toLowerCase().replace(/[^a-z0-9äöüß._-]/g,'').slice(0,22);
    });
    $('contactForm').addEventListener('submit', async event => {
      event.preventDefault();
      const form = $('contactForm');
      const error = $('contactError');
      error.textContent = '';
      if (!getFormValue('contactName') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getFormValue('email')) || !form.elements.contactConsent.checked) {
        error.textContent = 'Bitte geben Sie Ihren Namen, eine gültige E-Mail-Adresse und Ihre Zustimmung zur Kontaktaufnahme an.';
        return;
      }
      if (getFormValue('website')) return;
      const data = buildPayload();
      const button = $('contactSubmit');
      button.disabled = true;button.textContent = 'Wird vorbereitet …';
      try {
        if (CONFIG.FORM_ENDPOINT) {
          await fetch(CONFIG.FORM_ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});
          $('successMessage').textContent = 'Die Anfrage wurde vom Browser an den eingerichteten Empfang übermittelt. Bitte prüfen Sie die tatsächliche Speicherung im Google-Tabellenblatt.';
        } else {
          downloadJSON(data);
          $('successMessage').textContent = 'Ihre Konfiguration wurde als JSON-Datei exportiert. Der automatische Empfang bei pimentaGROUP ist noch nicht aktiviert.';
        }
        $('contactDialog').close();
        $('successDialog').showModal();
      } catch (err) {
        error.textContent = 'Die Anfrage konnte nicht vorbereitet werden. Bitte versuchen Sie es erneut.';
      } finally {
        button.disabled = false;button.innerHTML = 'Anfrage senden <span>↗</span>';
      }
    });
  }

  renderFeatureRows();
  refresh();
  wireEvents();
})();
