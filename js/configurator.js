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
      {id:'baseService',name:'Website, Hosting & Basis-Support',price:35,glyph:'',scene:'website',target:'siteTop',mandatory:true,detail:'Die feste Basis für Ihren digitalen Auftritt: Bereitstellung der Website, Hosting und technischer Basis-Support. Dieser Service gehört immer zur Konfiguration und kann nicht abgewählt werden. Die ersten zwei Monate sind kostenlos; danach beträgt der vorläufige Richtwert 35 € pro Monat.'},
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
      {id:'whatsappBot',name:'WhatsApp-Chatbot',price:19,glyph:'◔',scene:'ai',target:'ai-preview-whatsappBot',detail:'Ein automatisierter Assistent beantwortet definierte häufige Fragen über WhatsApp und kann Anliegen vorsortieren. Die Anbindung an WhatsApp Business sowie mögliche Meta-, Plattform- und Nachrichtenkosten werden separat geprüft.'},
      {id:'chatbot',name:'KI-Website-Chatbot',price:19,glyph:'✳',scene:'ai',target:'ai-preview-chatbot',detail:'Ein Website-Assistent beantwortet wiederkehrende Fragen anhand freigegebener Unternehmensinformationen. Antwortgrenzen und die Übergabe an einen Menschen werden festgelegt. Laufende KI-API- und Nutzungsgebühren können zusätzlich anfallen.'},
      {id:'leadAssistant',name:'KI-Anfrage-Assistent',price:12,glyph:'⌁',scene:'ai',target:'ai-preview-leadAssistant',detail:'Der Assistent fragt wichtige Angaben ab und bereitet Kundenanfragen strukturiert für Ihr Team vor. Er trifft keine verbindlichen Geschäftsentscheidungen und verspricht keine Verfügbarkeit.'},
      {id:'emailAssistant',name:'KI-E-Mail-Assistent',price:9,glyph:'✉',scene:'ai',target:'ai-preview-emailAssistant',detail:'Unterstützt beim Sortieren und Erstellen von Antwortentwürfen für wiederkehrende Anfragen. Ein automatischer Versand erfolgt nur, wenn dieser Ablauf ausdrücklich vereinbart wurde.'},
      {id:'crm',name:'CRM-Verknüpfung',price:15,glyph:'⇄',scene:'ai',target:'ai-preview-crm',detail:'Anfragen können an ein ausgewähltes CRM übertragen werden. CRM-Lizenzen, zusätzliche Nutzer und API-Gebühren sind nicht enthalten.'},
      {id:'voice',name:'KI-Telefonassistent',price:29,glyph:'◖',scene:'ai',target:'ai-preview-voice',detail:'Ein Sprachassistent nimmt Anrufe entgegen und erfasst Anliegen oder Terminwünsche. Rufnummer, Telefonie-Minuten, Anbieter- und KI-Verbrauch werden separat kalkuliert.'},
      {id:'automation',name:'Prozess-Automatisierung',price:12,glyph:'⚙',scene:'ai',target:'ai-preview-automation',detail:'Verbindet ausgewählte Formulare, E-Mails und Tools zu einem definierten Ablauf. Der genaue Prozess und mögliche Drittanbieter-Lizenzen werden vorab festgelegt.'}
    ],
    visibility: [
      {id:'localSEO',name:'Lokale SEO-Grundlagen',price:9,glyph:'⌕',scene:'visibility',target:'visibility-seo',detail:'Grundlegende lokale SEO-Einrichtung: Seitenstruktur, Unternehmensinformationen, Metadaten und technische Basis. Das ist keine Garantie für bestimmte Rankings und keine laufende SEO-Kampagne.'},
      {id:'multilingual',name:'Mehrsprachigkeit',price:12,glyph:'文',scene:'visibility',target:'visibility-multilingual',detail:'Die vereinbarten Seiten werden in zusätzliche Sprachen übertragen und mit einer Sprachumschaltung versehen. Umfang und spätere Pflege werden im individuellen Angebot festgelegt.'}
    ],
    social: [
      {id:'instagramFeed',name:'Instagram-Integration',price:4,glyph:'◎',scene:'social',target:'social-integration-preview',detail:'Eine abgestimmte Instagram-Darstellung verbindet die Website mit Ihrem Profil. Ob ein Live-Feed technisch verfügbar ist, hängt von den aktuellen Plattform-Schnittstellen ab. Laufende Social-Media-Betreuung und die Erstellung von Beiträgen sind nicht enthalten.'}
    ]
  };

  const SOCIAL = [
    {id:'instagram',name:'Instagram'},
    {id:'facebook',name:'Facebook'},
    {id:'tiktok',name:'TikTok'},
    {id:'linkedin',name:'LinkedIn'}
  ];

  const SELECTED = new Set(['baseService']);
  const SELECTED_SOCIAL = new Set();
  let industry = 'Friseursalon / Barbershop';
  let websiteStatus = 'Keine Website';
  let currentInfoId = null;
  let currentScene = 'website';
  let railFrame = false;
  let previewScrollToken = 0;

  const allFeatures = Object.values(FEATURES).flat();
  const byId = id => allFeatures.find(item => item.id === id);
  const categoryOf = id => Object.keys(FEATURES).find(key => FEATURES[key].some(item => item.id === id));
  const selectedItems = () => allFeatures.filter(item => SELECTED.has(item.id));
  const monthlyTotal = () => selectedItems().reduce((sum, item) => sum + item.price, 0);
  const addonsTotal = () => selectedItems().filter(item => !item.mandatory).reduce((sum, item) => sum + item.price, 0);
  const projectType = () => websiteStatus === 'Keine Website' ? 'Neue Website' : websiteStatus.startsWith('Veraltet') ? 'Website erneuern' : 'Website erweitern';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const FEATURE_ICON_PATHS = {
    gallery:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    reviews:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    maps:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    faq:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.2 2c-1.1.8-1.7 1.3-1.7 2.7M12 17h.01"/>',
    blog:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    shop:'<path d="M3 3h2l2.2 12.2a2 2 0 0 0 2 1.8h8.6a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
    newsletter:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    booking:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M14 14h2M8 17h3"/>',
    employeeManagement:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M17 11h6"/>',
    whatsapp:'<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20l1.2-5.2A8.4 8.4 0 1 1 21 11.5Z"/><path d="M8.5 8.5c.7 3 2 4.3 5 5"/>',
    contactPlus:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h4M17 15v4M15 17h4"/>',
    whatsappBot:'<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 3v4M9 13h.01M15 13h.01M8 17h8M2 11v5M22 11v5"/>',
    chatbot:'<rect x="3" y="5" width="18" height="15" rx="4"/><path d="M8 10h.01M16 10h.01M8 15h8M12 2v3"/>',
    leadAssistant:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4M8 1v4M16 1v4"/>',
    emailAssistant:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6M16 16l2 2 4-4"/>',
    crm:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M10 6.5h2a2 2 0 0 1 2 2V14M14 17.5h-2a2 2 0 0 1-2-2V10"/>',
    voice:'<path d="M21 16.5v3a2 2 0 0 1-2.2 2A19 19 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7l.5 2.7a2 2 0 0 1-.6 1.8L8 10.9a15 15 0 0 0 5.1 5.1l1.7-1.9a2 2 0 0 1 1.8-.6l2.7.5a2 2 0 0 1 1.7 2.5Z"/>',
    automation:'<circle cx="6" cy="5" r="3"/><circle cx="18" cy="19" r="3"/><path d="M6 8v5a4 4 0 0 0 4 4h5M18 16v-5a4 4 0 0 0-4-4H9"/>',
    localSEO:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    multilingual:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    instagramFeed:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>'
  };
  const SOCIAL_ICON_PATHS = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M13.4 21v-8.1h2.8l.4-3.2h-3.2V7.6c0-.9.3-1.5 1.6-1.5h1.7V3.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.2H7.2v3.2H10V21h3.4Z" fill="currentColor" stroke="none"/>',
    tiktok: '<path d="M15.1 3h3c.2 2.1 1.4 3.7 3.4 4.1v3.1c-1.7-.1-3.2-.7-4.5-1.7v6.7a6.1 6.1 0 1 1-6.1-6.1c.4 0 .8 0 1.2.1v3.2a3 3 0 1 0 1.8 2.8V3h1.2Z" fill="currentColor" stroke="none"/>',
    linkedin: '<path d="M5.3 8.7H2.1V21h3.2V8.7ZM3.7 2.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM21.9 13.9c0-3.7-2-5.4-4.7-5.4-2.1 0-3.1 1.1-3.6 1.9V8.7h-3.2V21h3.2v-6.1c0-1.6.3-3.2 2.4-3.2s2.5 1.6 2.5 3.3V21h3.4v-7.1Z" fill="currentColor" stroke="none"/>'
  };

  function socialBrandIcon(id, extraClass = '') {
    const colorClass = `brand-${id}`;
    return `<svg class="social-brand-icon ${colorClass} ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${SOCIAL_ICON_PATHS[id] || ''}</svg>`;
  }

  function featureIcon(item) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${FEATURE_ICON_PATHS[item.id] || '<circle cx="12" cy="12" r="8"/>'}</svg>`;
  }

  function renderFeatureRows() {
    const map = {website:'listWebsite',phone:'listPhone',ai:'listAI',visibility:'listVisibility',social:'listSocial'};
    Object.entries(map).forEach(([category, containerId]) => {
      const container = $(containerId);
      container.innerHTML = FEATURES[category].map(item => {
        const active = SELECTED.has(item.id);
        const price = item.mandatory ? `${money(item.price)} / Mon.` : item.price ? `+ ${money(item.price)} / Mon.` : 'Kostenlos';
        const mandatory = item.mandatory ? ' mandatory' : '';
        return `<div class="feature-row${active ? ' selected' : ''}${mandatory}" role="checkbox" aria-checked="${active}" aria-disabled="${!!item.mandatory}" tabindex="0" data-feature="${item.id}">
          <div class="feature-main"><span class="feature-glyph" aria-hidden="true">${item.mandatory ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21H3Z"/><path d="M9 21v-7h6v7"/></svg>' : featureIcon(item)}</span><span class="feature-name">${item.name}</span></div>
          <div class="feature-end"><span class="feature-price">${price}</span><button type="button" class="feature-info" data-info="${item.id}" aria-label="Details zu ${item.name}" title="Details">i</button><span class="feature-check" aria-hidden="true">✓</span></div>
        </div>`;
      }).join('');
    });
    $('socialChoices').innerHTML = SOCIAL.map(item => {
      const active = SELECTED_SOCIAL.has(item.id);
      return `<div class="feature-row social-option-row${active ? ' selected' : ''}" role="checkbox" aria-checked="${active}" tabindex="0" data-social="${item.id}">
        <div class="feature-main"><span class="feature-glyph social-glyph" aria-hidden="true">${socialBrandIcon(item.id)}</span><span class="feature-name">${item.name}</span></div>
        <div class="feature-end"><span class="feature-price">Kostenlos</span><span class="feature-check" aria-hidden="true">✓</span></div>
      </div>`;
    }).join('');
  }

  function moduleHeading(eyebrow, title, subtitle = '') {
    return `<span class="module-kicker">${eyebrow}</span><h3 class="module-title">${title}</h3>${subtitle ? `<p class="module-subtitle">${subtitle}</p>` : ''}`;
  }

  function renderWebsiteModules() {
    const parts = [];
    const has = id => SELECTED.has(id);
    const theme = industryTheme();
    if (has('booking')) parts.push(`<section class="site-module module-booking" id="module-booking">${moduleHeading('ONLINE TERMIN','Ihren Termin auswählen','Wählen Sie Ihre gewünschte Leistung und einen passenden Zeitpunkt.')}
      <div class="booking-widget"><div class="booking-widget-head"><b>Was möchten Sie buchen?</b><small>01 / 03 · SERVICE</small></div><div class="booking-services">${theme.bookingPrices.map(label => `<span>${escapeHTML(label)}</span>`).join('')}</div><div class="booking-dates"><span>MO<br>09</span><span>DI<br>10</span><span>MI<br>11</span><span>DO<br>12</span><span>FR<br>13</span></div><div class="booking-times"><span>09:00</span><span>10:30</span><span>12:00</span><span>14:00</span></div></div></section>`);
    if (has('employeeManagement')) parts.push(`<section class="site-module" id="module-team-management">${moduleHeading('UNSER TEAM','Die Menschen für Ihren Look')}
      <div class="module-team-grid"><div class="module-team-person"><span class="module-team-avatar"></span><div><b>Anna Müller</b><small>Heute · 09:00–17:00</small></div></div><div class="module-team-person"><span class="module-team-avatar"></span><div><b>Lukas Schneider</b><small>Heute · 10:00–18:00</small></div></div><div class="module-team-person"><span class="module-team-avatar"></span><div><b>Sophie Weber</b><small>Heute · 09:00–16:00</small></div></div></div></section>`);
    if (has('gallery')) parts.push(`<section class="site-module" id="module-gallery">${moduleHeading('EINBLICKE',theme.galleryTitle,'Ein kleiner Einblick in unsere Arbeit und Atmosphäre.')}
      <div class="module-gallery-grid"><i></i><i></i><i></i></div></section>`);
    if (has('instagramFeed')) parts.push(`<section class="site-module" id="module-instagram">${moduleHeading('FOLLOW US','Einblicke auf Instagram','Ausgewählte Beiträge aus unserem Profil – direkt auf Ihrer Website.')}
      <div class="module-instagram-grid"><i></i><i></i><i></i><i></i></div></section>`);
    if (has('reviews')) parts.push(`<section class="site-module" id="module-reviews">${moduleHeading('KUNDENSTIMMEN','Das sagen unsere Kunden')}
      <div class="module-reviews-grid"><article class="review-card"><div class="review-stars">★★★★★</div><blockquote>„Ein wunderbares Studio. Ich habe mich vom ersten Moment an wohlgefühlt.“</blockquote><small>— Julia M. · Google-Bewertung</small></article><article class="review-card"><div class="review-stars">★★★★★</div><blockquote>„Tolle Beratung und ein Ergebnis, das einfach passt.“</blockquote><small>— Sarah K. · Google-Bewertung</small></article></div></section>`);
    if (has('maps')) parts.push(`<section class="site-module" id="module-maps">${moduleHeading('BESUCHEN SIE UNS','Wir freuen uns auf Sie.')}
      <div class="module-map-layout"><div class="map-art"><span class="map-park"></span><span class="map-water"></span><span class="map-pin"></span></div><div class="map-info"><b>Mitten in Münster.</b><span>Beispielstraße 12 · 48143 Münster</span><span>Mo–Fr · 09:00–18:00</span><a href="#siteContact">Route planen ↗</a></div></div></section>`);
    if (has('faq')) parts.push(`<section class="site-module" id="module-faq">${moduleHeading('GUT ZU WISSEN','Häufige Fragen')}
      <div class="module-faq-list"><details open><summary>Wie kann ich einen Termin buchen?</summary><p>Nutzen Sie unsere Online-Terminbuchung oder kontaktieren Sie uns direkt.</p></details><details><summary>Kann ich meinen Termin verschieben?</summary><p>Kontaktieren Sie uns rechtzeitig. Wir finden gemeinsam eine passende Lösung.</p></details><details><summary>Welche Zahlungsmöglichkeiten gibt es?</summary><p>Die verfügbaren Zahlungsarten erfahren Sie direkt bei Ihrem Besuch.</p></details></div></section>`);
    if (has('blog')) parts.push(`<section class="site-module" id="module-blog">${moduleHeading('NEUES AUS DEM STUDIO',theme.blogTitle)}
      <div class="module-blog-grid"><article class="blog-card"><div class="blog-art"></div><b>Die richtige Pflege für Ihren Look</b><small>Tipps aus unserem Studio</small></article><article class="blog-card"><div class="blog-art"></div><b>Neue Saison, neuer Stil</b><small>Inspiration & Trends</small></article><article class="blog-card"><div class="blog-art"></div><b>Unser Studio im Portrait</b><small>Ein Blick hinter die Kulissen</small></article></div></section>`);
    if (has('shop')) parts.push(`<section class="site-module" id="module-shop">${moduleHeading('SHOP',theme.shopTitle)}
      <div class="module-shop-grid"><article class="shop-card"><div class="shop-art"></div><b>Care Shampoo</b><small>Sanfte Pflege</small><strong>24 €</strong></article><article class="shop-card"><div class="shop-art"></div><b>Silk Conditioner</b><small>Glanz & Geschmeidigkeit</small><strong>29 €</strong></article><article class="shop-card"><div class="shop-art"></div><b>Studio Gutschein</b><small>Das passende Geschenk</small><strong>ab 30 €</strong></article></div></section>`);
    if (has('newsletter')) parts.push(`<section class="site-module module-newsletter" id="module-newsletter"><div class="newsletter-copy"><span class="module-kicker">STUDIO LETTER</span><h3>Post aus dem Studio.</h3><p>Neuigkeiten, Inspiration und besondere Angebote.</p></div><form class="newsletter-form"><input type="email" placeholder="Ihre E-Mail-Adresse"><button type="button">Anmelden ↗</button></form></section>`);
    if (has('contactPlus')) parts.push(`<section class="site-module" id="module-contact">${moduleHeading('KONTAKT','Schreiben Sie uns')}
      <form class="module-contact-form"><input placeholder="Ihr Name"><input placeholder="E-Mail-Adresse"><textarea placeholder="Ihre Nachricht"></textarea><button type="button">Nachricht vorbereiten ↗</button></form></section>`);
    $('siteModules').innerHTML = parts.join('');
    $('siteWhatsApp').hidden = !(has('whatsapp') || has('whatsappBot'));
    $('siteChatFloat').hidden = !has('chatbot');
    $('previewBrand').textContent = currentBrand();
    $('footerBrand').textContent = currentBrand();
    $('phoneBrand').textContent = currentBrand();
    applyIndustryTheme();
    $('siteChatFloat').hidden = !has('chatbot');
    if (has('chatbot')) $('siteChatFloat').querySelector('b').textContent = 'Fragen? Unser KI-Assistent hilft.';
  }

  function industryTheme() {
    if (/Nagelstudio/i.test(industry)) return {
      key:'nails',tagline:'NAILS & BEAUTY',eyebrow:'MÜNSTER · NAIL & BEAUTY STUDIO',heroTitle:'Details, die<br><em>begeistern.</em>',heroText:'Maniküre, Nail Art und gepflegte Hände – mit Liebe zum Detail.',
      servicesEyebrow:'UNSERE BEHANDLUNGEN',servicesTitle:'Perfekte Details.<br><em>Bis in die Fingerspitzen.</em>',
      services:[['Maniküre','Pflege und Form für schöne Hände.'],['Nail Art','Individuelle Designs und Farben.'],['Pediküre','Gepflegte Füße und kleine Auszeit.']],galleryTitle:'Unsere Nail Designs',blogTitle:'Pflege, Farben & Inspiration',shopTitle:'Pflege für Hände & Nägel',bookingPrices:['Maniküre · 35 €','Nail Art · ab 45 €','Pediküre · 39 €'],
      teamEyebrow:'KREATIVE HÄNDE',teamTitle:'Menschen für<br><em>Ihre schönsten Details.</em>',roles:['Nail Artist','Nail Designer','Beauty Expert'],phoneTitle:'Details, die<br><em>begeistern.</em>',phoneText:'Nail Art. Pflege. Ihr persönlicher Stil.' ,promise:'Schönheit bis ins Detail.',aboutEyebrow:'ÜBER DAS NAILSTUDIO',aboutTitle:'Kleine Details. Große Wirkung.',aboutText:'Maniküre, Nail Art und Pflege – individuell für Sie.'
    };
    if (/Massage|Wellness/i.test(industry)) return {
      key:'wellness',tagline:'WELLNESS & MASSAGE',eyebrow:'MÜNSTER · WELLNESS STUDIO',heroTitle:'Zeit für sich.<br><em>Zeit zum Loslassen.</em>',heroText:'Wohltuende Massagen und bewusste Momente für Ihr Wohlbefinden.',
      servicesEyebrow:'UNSERE ANWENDUNGEN',servicesTitle:'Ankommen und<br><em>durchatmen.</em>',
      services:[['Entspannungsmassage','Ruhe finden und loslassen.'],['Therapeutische Massage','Gezielte Behandlung nach Bedarf.'],['Wellness-Rituale','Zeit für Körper und Geist.']],galleryTitle:'Räume & Wohlfühlmomente',blogTitle:'Wissen für Ihr Wohlbefinden',shopTitle:'Wohlfühlprodukte entdecken',bookingPrices:['Entspannungsmassage · 59 €','Therapeutische Massage · 69 €','Wellness-Ritual · 79 €'],
      teamEyebrow:'IN GUTEN HÄNDEN',teamTitle:'Menschen für<br><em>Ihr Wohlbefinden.</em>',roles:['Massage Therapist','Wellness Expert','Bodywork Specialist'],phoneTitle:'Zeit für sich.<br><em>Zeit zum Loslassen.</em>',phoneText:'Ruhe. Achtsamkeit. Neue Energie.',promise:'Ein Ort zum Durchatmen.',aboutEyebrow:'ÜBER DAS STUDIO',aboutTitle:'Ankommen und loslassen.',aboutText:'Massagen, Ruhe und bewusste Zeit für Ihr Wohlbefinden.'
    };
    if (/Sonstiges/i.test(industry)) return {
      key:'other',tagline:'BUSINESS & SERVICES',eyebrow:'MÜNSTER · IHR UNTERNEHMEN',heroTitle:'Ihr Angebot.<br><em>Ihr digitaler Auftritt.</em>',heroText:'Ihre Leistungen, Ihr Team und alle wichtigen Informationen an einem Ort.',
      servicesEyebrow:'UNSERE LEISTUNGEN',servicesTitle:'Was uns ausmacht.<br><em>Auf einen Blick.</em>',
      services:[['Beratung','Persönlich und lösungsorientiert.'],['Unsere Leistungen','Passend zu Ihrem Bedarf.'],['Service & Support','Wir sind für Sie da.']],galleryTitle:'Einblicke in unsere Arbeit',blogTitle:'Neuigkeiten & Fachwissen',shopTitle:'Produkte & Angebote',bookingPrices:['Erstgespräch · kostenlos','Beratung · 45 €','Service · nach Aufwand'],
      teamEyebrow:'DAS TEAM',teamTitle:'Die Menschen hinter<br><em>Ihrem Unternehmen.</em>',roles:['Ansprechpartner','Fachkraft','Kundenservice'],phoneTitle:'Ihr Angebot.<br><em>Auf einen Blick.</em>',phoneText:'Informationen und Kontakt – jederzeit.',promise:'Persönlich. Klar. Zuverlässig.',aboutEyebrow:'ÜBER UNS',aboutTitle:'Das Wichtigste auf einen Blick.',aboutText:'Unser Team, unsere Leistungen und der direkte Kontakt.'
    };
    return {
      key:'hair',tagline:'HAIR & BEAUTY',eyebrow:'MÜNSTER · PREMIUM HAIR STUDIO',heroTitle:'Ihr Stil.<br><em>Ihr Moment.</em>',heroText:'Individuelle Looks, persönliche Beratung und ein gutes Gefühl bei jedem Besuch.',
      servicesEyebrow:'UNSERE LEISTUNGEN',servicesTitle:'Für Ihren ganz<br><em>eigenen Stil.</em>',
      services:[['Cut & Styling','Individuell. Präzise. Persönlich.'],['Color & Care','Farbe, die zu Ihnen passt.'],['Beauty Rituals','Zeit für Pflege und Wohlgefühl.']],galleryTitle:'Unsere Arbeiten',blogTitle:'Inspiration & Neuigkeiten',shopTitle:'Lieblingsprodukte entdecken',bookingPrices:['Damen Haarschnitt · 49 €','Balayage · ab 129 €','Herren Styling · 35 €'],
      teamEyebrow:'MIT LIEBE ZUM DETAIL',teamTitle:'Menschen hinter<br><em>dem Handwerk.</em>',roles:['Creative Director','Master Stylist','Color Expert'],phoneTitle:'Ihr Stil.<br><em>Ihr Moment.</em>',phoneText:'Persönlich. Modern. Für Sie.',promise:'Ein Ort für Ihren Stil.',aboutEyebrow:'ÜBER DAS STUDIO',aboutTitle:'Persönlich. Für Sie.',aboutText:'Leistungen, Menschen und ein guter erster Eindruck.'
    };
  }

  function applyIndustryTheme() {
    const t = industryTheme();
    const setHTML = (id, value) => { const el = $(id); if (el) el.innerHTML = value; };
    const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
    const demoSite = $('demoSite');
    if (demoSite) demoSite.className = `demo-site industry-${t.key || 'hair'}`;
    setText('phoneServicesEyebrow',t.servicesEyebrow);
    setText('phoneAboutEyebrow',t.aboutEyebrow || 'ÜBER DAS STUDIO');
    setText('phoneAboutTitle',t.aboutTitle || 'Persönlich. Für Sie.');
    setText('phoneAboutText',t.aboutText || 'Leistungen, Menschen und ein guter erster Eindruck.');
    setText('previewTagline',t.tagline);
    setText('footerTagline',`${t.tagline} · MÜNSTER`);
    setText('phoneTagline',t.tagline);
    setText('siteEyebrow',t.eyebrow);
    setHTML('siteHeroTitle',t.heroTitle);
    setText('siteHeroText',t.heroText);
    setText('servicesEyebrow',t.servicesEyebrow);
    setHTML('siteServicesTitle',t.servicesTitle);
    setText('teamEyebrow',t.teamEyebrow);
    setHTML('teamTitle',t.teamTitle);
    setText('serviceOneName',t.services[0][0]);setText('serviceOneDesc',t.services[0][1]);
    setText('serviceTwoName',t.services[1][0]);setText('serviceTwoDesc',t.services[1][1]);
    setText('serviceThreeName',t.services[2][0]);setText('serviceThreeDesc',t.services[2][1]);
    setText('teamRoleOne',t.roles[0]);setText('teamRoleTwo',t.roles[1]);setText('teamRoleThree',t.roles[2]);
    setHTML('phoneHeroTitle',t.phoneTitle);setText('phoneHeroText',t.phoneText);setText('footerPromise',t.promise);
  }

  function currentBrand() {
    const company = $('contactForm').elements.contactCompany.value.trim();
    return (company || 'DEMO').toUpperCase().slice(0, 22);
  }

  function phoneCard(id, title, inner) {
    return `<section class="phone-module-card" id="phone-${id}"><b>${title}</b>${inner}</section>`;
  }

  function renderPhoneModules() {
    const parts = [];
    const theme = industryTheme();
    if (SELECTED.has('booking')) parts.push(phoneCard('booking','Termin buchen',`<small>Wählen Sie einen Service und Ihre Wunschzeit.</small><div class="phone-slot-list"><span>${escapeHTML(theme.services[0][0])}</span><span>${escapeHTML(theme.services[1][0])}</span><span>${escapeHTML(theme.services[2][0])}</span></div><div class="phone-slot-list"><span>Heute · 10:30</span><span>12:00</span><span>14:00</span></div>`));
    if (SELECTED.has('employeeManagement')) parts.push(phoneCard('team','Team & Termine',`<small>Heute · Mittwoch, 11. Juni</small><div class="phone-slot-list"><span>Anna · 09:00</span><span>Lukas · 10:30</span><span>Sophie · 12:00</span></div>`));
    if (SELECTED.has('whatsapp')) parts.push(phoneCard('whatsapp','WhatsApp-Kontakt',`<small>Direkt mit dem Studio schreiben.</small><div class="phone-slot-list"><span>Nachricht senden ↗</span></div>`));
    if (SELECTED.has('contactPlus')) parts.push(phoneCard('contact','Kontaktformular',`<small>Name</small><div class="phone-slot-list"><span>Ihre Nachricht …</span><span>Senden ↗</span></div>`));
    if (!parts.length) parts.push(`<span class="phone-module-empty">Wählen Sie rechts eine Funktion, um sie hier live zu sehen.</span>`);
    $('phoneLiveModule').innerHTML = parts.join('');
    updatePhoneScrollbar();
  }

  function socialCard(item, handle) {
    const title = escapeHTML(item.name);
    const theme = industryTheme();
    if (item.id === 'instagram') return `<article class="network-card network-instagram" id="social-channel-instagram">
      <div class="network-card-top"><span class="network-mark">${socialBrandIcon('instagram')}</span><strong>INSTAGRAM</strong><span class="network-live">VERKNÜPFT</span></div>
      <div class="network-profile-row"><span class="network-avatar">${escapeHTML(handle.charAt(0).toUpperCase() || 'S')}</span><span><b>@${escapeHTML(handle)}</b><small>${escapeHTML(theme.tagline)} · Münster</small></span><button>Profil öffnen ↗</button></div>
      <div class="network-stats"><span><b>128</b> Beiträge</span><span><b>2,4 Tsd.</b> Follower</span><span><b>340</b> Gefolgt</span></div>
      <div class="network-post-grid"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    </article>`;
    if (item.id === 'facebook') return `<article class="network-card network-facebook" id="social-channel-facebook">
      <div class="network-card-top"><span class="network-mark">${socialBrandIcon('facebook')}</span><strong>FACEBOOK</strong><span class="network-live">VERKNÜPFT</span></div>
      <div class="facebook-cover"></div><div class="network-profile-row"><span class="network-avatar">${escapeHTML(handle.charAt(0).toUpperCase() || 'S')}</span><span><b>${escapeHTML(handle)}</b><small>Unternehmen · ${escapeHTML(theme.tagline)}</small></span><button>Nachricht</button></div>
      <div class="facebook-tabs"><span>Beiträge</span><span>Info</span><span>Fotos</span><span>Bewertungen</span></div>
      <div class="facebook-post"><b>${escapeHTML(handle)} · vor 2 Std.</b><p>Ein neuer Look beginnt mit einer guten Beratung. Wir freuen uns auf Ihren Besuch.</p><div class="facebook-post-art"></div><small>Gefällt mir　Kommentieren　Teilen</small></div>
    </article>`;
    if (item.id === 'tiktok') return `<article class="network-card network-tiktok" id="social-channel-tiktok">
      <div class="network-card-top"><span class="network-mark">${socialBrandIcon('tiktok')}</span><strong>TIKTOK</strong><span class="network-live">VERKNÜPFT</span></div>
      <div class="tiktok-profile"><span class="network-avatar">${escapeHTML(handle.charAt(0).toUpperCase() || 'S')}</span><b>@${escapeHTML(handle)}</b><small>${escapeHTML(theme.tagline)} · Studio</small><div><span><b>24</b> Folge ich</span><span><b>8,6 Tsd.</b> Follower</span><span><b>52 Tsd.</b> Likes</span></div><button>Folgen</button></div>
      <div class="tiktok-video-grid"><i><b>▶</b><small>Before / After</small></i><i><b>▶</b><small>Styling</small></i><i><b>▶</b><small>Studio Life</small></i></div>
    </article>`;
    return `<article class="network-card network-linkedin" id="social-channel-linkedin">
      <div class="network-card-top"><span class="network-mark">${socialBrandIcon('linkedin')}</span><strong>LINKEDIN</strong><span class="network-live">VERKNÜPFT</span></div>
      <div class="linkedin-cover"></div><div class="linkedin-company"><span class="linkedin-logo">${escapeHTML(handle.charAt(0).toUpperCase() || 'S')}</span><b>${escapeHTML(handle)}</b><small>${escapeHTML(theme.tagline)} · Münster</small><p>Persönlicher Service, moderne Leistungen und ein starkes Team.</p><div><b>1.248</b> Follower　·　Unternehmen</div><button>Folgen</button></div>
    </article>`;
  }

  function renderSocial() {
    const chosen = SOCIAL.filter(item => SELECTED_SOCIAL.has(item.id));
    const handle = (currentBrand().toLowerCase().replace(/[^a-z0-9äöüß._-]/g,'') || 'ihr.studio').slice(0,22);
    const cards = chosen.map(item => socialCard(item, handle));
    if (SELECTED.has('instagramFeed')) cards.push(`<article class="network-card network-integration" id="social-integration-preview"><div class="network-card-top"><span class="network-mark">${socialBrandIcon('instagram')}</span><strong>INSTAGRAM AUF IHRER WEBSITE</strong><span class="network-live">INTEGRATION</span></div><div class="integration-preview"><div><b>Einblicke aus dem Studio</b><small>Aktuelle Beiträge direkt auf Ihrer Website</small></div><div class="integration-post-grid"><i></i><i></i><i></i></div></div></article>`);
    $('socialPreviewContent').innerHTML = cards.length ? cards.join('') : `<div class="social-empty-preview"><div class="social-empty-symbol">${socialBrandIcon('instagram')}${socialBrandIcon('facebook')}${socialBrandIcon('tiktok')}${socialBrandIcon('linkedin')}</div><h3>Ihre Social-Media-Kanäle</h3><p>Wählen Sie rechts Instagram, Facebook, TikTok oder LinkedIn aus. Jeder gewählte Kanal erscheint hier mit einer eigenen Vorschau.</p></div>`;
    $('socialTargets').innerHTML = chosen.length ? chosen.map(item => `<span class="connection-node social-node social-node-${item.id}">${socialBrandIcon(item.id)}${escapeHTML(item.name)}</span>`).join('') : `<span class="connection-node social-node">Noch kein Kanal</span>`;
    $('socialConnectionText').textContent = chosen.length ? `${chosen.length} ausgewählte${chosen.length === 1 ? 'r Kanal' : ' Kanäle'} werden mit Ihrem Webauftritt verbunden.` : 'Wählen Sie Kanäle aus, um die Verbindung zu sehen.';
    const links = $('siteSocialLinks');
    links.innerHTML = chosen.map(item => `<span class="site-social-link site-social-${item.id}">${socialBrandIcon(item.id)}</span>`).join('');
    links.hidden = chosen.length === 0;
  }

  function aiCard(item, content, channel) {
    return `<article class="ai-service-card ai-card-${item.id}" id="ai-preview-${item.id}">
      <header class="ai-service-head"><span class="ai-service-icon">${item.glyph}</span><span><b>${escapeHTML(item.name)}</b><small>${channel}</small></span><i>AKTIV</i></header>
      <div class="ai-service-body">${content}</div>
    </article>`;
  }

  function renderAI() {
    const chosen = FEATURES.ai.filter(item => SELECTED.has(item.id));
    const handle = escapeHTML(currentBrand());
    const primaryService = escapeHTML(industryTheme().services[0][0]);
    const cards = chosen.map(item => {
      switch (item.id) {
        case 'chatbot': return aiCard(item, `<div class="ai-chat-mock"><div class="ai-chat-line bot">Hallo! Schön, dass Sie da sind. Wie kann ich helfen?</div><div class="ai-chat-line user">Haben Sie diese Woche noch Termine?</div><div class="ai-chat-line bot">Ja! Ich kann Ihnen freie Zeiten anzeigen oder eine Anfrage vorbereiten.</div><div class="ai-chat-compose"><span>Nachricht eingeben …</span><b>↑</b></div></div>`, 'WEBSITE-CHAT');
        case 'whatsappBot': return aiCard(item, `<div class="wa-chat-mock"><div class="wa-chat-header"><b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.3L3 20.5l1.3-5A8.4 8.4 0 1 1 20.5 11.8Z"/><path d="M8.5 8.3c.4 2.7 2.1 4.4 4.8 5.2l1.2-1.2 2.1 1c-.2 1.5-1.3 2.2-2.7 2.1-3.8-.4-7.1-3.8-7.3-7.4-.1-1.2.7-2.2 2-2.4l1 2.2-1.1.5Z"/></svg></b><span><strong>${handle}</strong><small>WhatsApp Business</small></span><i>⋮</i></div><div class="wa-chat-body"><div class="wa-bubble user">Hallo, kann ich einen Termin buchen?<small>10:41 ✓✓</small></div><div class="wa-bubble bot">Natürlich! Für welche Leistung interessieren Sie sich?<small>10:41</small></div><div class="wa-bubble bot">Ich kann Ihnen freie Zeiten zeigen oder Ihre Anfrage aufnehmen.<small>10:42</small></div></div><div class="wa-chat-compose">Nachricht　　＋　➤</div></div>`, 'WHATSAPP BUSINESS');
        case 'leadAssistant': return aiCard(item, `<div class="lead-flow"><div class="lead-progress"><i></i><i></i><i></i></div><b>Neue Kundenanfrage</b><small>Der Assistent sammelt die wichtigsten Angaben.</small><label>Gewünschte Leistung <strong>${primaryService}　⌄</strong></label><label>Wunschtermin <strong>Diese Woche　⌄</strong></label><label>Kontakt <strong>name@email.de</strong></label><div class="lead-summary"><span>✓</span><b>Anfrage strukturiert vorbereitet</b></div></div>`, 'ANFRAGEN-QUALIFIZIERUNG');
        case 'emailAssistant': return aiCard(item, `<div class="email-mock"><div class="email-toolbar"><span>Posteingang</span><b>Antwortentwurf</b><span>•••</span></div><div class="email-subject"><small>BETREFF</small><b>Ihre Terminanfrage</b></div><div class="email-text"><small>AN</small><b>kunde@example.de</b><p>Guten Tag, vielen Dank für Ihre Nachricht und Ihr Interesse an unserem Studio.</p><p>Gerne prüfen wir passende Termine und melden uns mit einer Auswahl zurück.</p></div><div class="email-ai-note">✳　Antwortentwurf vom KI-Assistenten</div><button class="email-action">Entwurf prüfen</button></div>`, 'E-MAIL-ENTWÜRFE');
        case 'crm': return aiCard(item, `<div class="crm-mock"><div class="crm-toolbar"><b>Kontakte</b><span>+ Neuer Kontakt</span></div><div class="crm-columns"><div><b>Neu <i>2</i></b><article><small>10:42</small><strong>Julia M.</strong><span>Online-Anfrage</span></article><article><small>09:18</small><strong>Sarah K.</strong><span>WhatsApp</span></article></div><div><b>In Bearbeitung <i>1</i></b><article><small>Gestern</small><strong>Laura B.</strong><span>Terminwunsch</span></article></div><div><b>Erledigt <i>1</i></b><article><small>Mo.</small><strong>Anna W.</strong><span>Rückmeldung</span></article></div></div></div>`, 'KUNDENÜBERSICHT');
        case 'voice': return aiCard(item, `<div class="voice-mock"><div class="voice-status"><span class="voice-orb">☎</span><b>Anruf wird angenommen</b><small>KI-Telefonassistent · Demo</small></div><div class="voice-wave">${Array.from({length:34},(_,i)=>`<i style="--h:${12+(i*17%32)}px"></i>`).join('')}</div><div class="voice-transcript"><small>LIVE-TRANSKRIPT</small><p><b>Kunde:</b> Ich würde gern einen Termin für Freitag vereinbaren.</p><p><b>Assistent:</b> Gerne. Für welche Behandlung darf ich Sie vormerken?</p></div><div class="voice-call-meta"><span>00:42</span><span>● Verbindung aktiv</span></div></div>`, 'TELEFONIE');
        case 'automation': return aiCard(item, `<div class="automation-flow"><div class="automation-node"><span>01</span><div><b>Kundenanfrage</b><small>Website / WhatsApp / E-Mail</small></div></div><div class="automation-arrow">↓</div><div class="automation-node automation-node-ai"><span>✳</span><div><b>KI verarbeitet</b><small>Erkennen · Sortieren · Vorbereiten</small></div></div><div class="automation-arrow">↓</div><div class="automation-node"><span>✓</span><div><b>Ihr Team</b><small>Fertige Aufgabe im Überblick</small></div></div></div>`, 'WORKFLOW');
        default: return '';
      }
    });
    $('aiPreviewContent').innerHTML = cards.length ? cards.join('') : `<div class="ai-empty-preview"><div class="ai-empty-orb">✳</div><h3>KI, die konkrete Aufgaben übernimmt.</h3><p>Wählen Sie einen KI-Baustein aus. Hier sehen Sie anschließend genau, wie er mit Ihren Kunden oder Ihrem Team arbeitet.</p><div class="ai-empty-flow"><span>Kundenanfrage</span><i>↓</i><span>KI-Assistent</span><i>↓</i><span>Ihr Team</span></div></div>`;
    $('aiActiveLabel').textContent = chosen.length ? `${chosen.length} KI-Baustein${chosen.length === 1 ? '' : 'e'} ausgewählt` : 'Noch keine KI-Funktion ausgewählt';
  }

  function renderVisibility() {
    const seo = SELECTED.has('localSEO');
    const languages = SELECTED.has('multilingual');
    const parts = [];
    const searchTerm = /Nagelstudio/i.test(industry) ? 'Nagelstudio' : /Massage|Wellness/i.test(industry) ? 'Massage & Wellness' : /Sonstiges/i.test(industry) ? 'Unternehmen' : 'Friseursalon';
    const resultTitle = /Nagelstudio/i.test(industry) ? 'Nails & Beauty' : /Massage|Wellness/i.test(industry) ? 'Massage & Wellness' : /Sonstiges/i.test(industry) ? 'Leistungen & Service' : 'Hair & Beauty';
    if (seo) parts.push(`<article class="visibility-card visibility-seo-card" id="visibility-seo"><div class="visibility-card-head"><span>⌕</span><div><b>Lokales Suchergebnis</b><small>GOOGLE-SUCHE · DEMO</small></div><i>✓</i></div><div class="search-query">${searchTerm} in Münster</div><div class="search-result"><small>www.ihr-studio.de</small><b>${escapeHTML(currentBrand())} – ${resultTitle} in Münster</b><div class="search-stars">★★★★★ <span>4,9 · Öffnungszeiten · Route</span></div><p>Leistungen, Standort und wichtige Informationen klar strukturiert.</p></div><div class="visibility-tags"><span>Lokale Angaben</span><span>Metadaten</span><span>Strukturierte Inhalte</span></div></article>`);
    if (languages) parts.push(`<article class="visibility-card visibility-language-card" id="visibility-multilingual"><div class="visibility-card-head"><span>文</span><div><b>Mehrsprachige Website</b><small>SPRACHUMSCHALTUNG</small></div><i>✓</i></div><div class="language-site-preview"><div class="language-preview-nav"><b>${escapeHTML(currentBrand())}</b><span>DE　⌄</span></div><div class="language-preview-copy"><small>WILLKOMMEN</small><strong>Ihr Stil.<br><em>Ihr Moment.</em></strong><p>Persönliche Beratung und individuelle Leistungen.</p></div><div class="language-switch-row"><span class="active">DE · Deutsch</span><span>EN · English</span><span>FR · Français</span></div></div></article>`);
    $('visibilityPreview').innerHTML = parts.length ? parts.join('') : `<div class="visibility-empty-preview"><div class="visibility-empty-icons"><span>⌕</span><span>文</span></div><h3>Mehr Sichtbarkeit. Mehr Möglichkeiten.</h3><p>Wählen Sie lokale SEO oder zusätzliche Sprachen, um die jeweilige Wirkung hier zu sehen.</p></div>`;
    $('visibilityActiveLabel').textContent = [seo ? 'Lokale SEO-Grundlagen' : '', languages ? 'Mehrsprachigkeit' : ''].filter(Boolean).join(' · ') || 'Noch keine Option ausgewählt';
  }

  function updatePreview() {
    renderWebsiteModules();
    renderPhoneModules();
    renderSocial();
    renderAI();
    renderVisibility();
  }

  function setScene(scene) {
    currentScene = scene;
    document.querySelectorAll('.scene').forEach(element => {
      const active = element.dataset.scene === scene;
      element.hidden = !active;
      element.classList.toggle('active', active);
    });
    if (scene === 'phone') requestAnimationFrame(updatePhoneScrollbar);
  }

  function animatePreviewScroll(scroller, destination, duration = 1350, token) {
    const start = scroller.scrollTop;
    const distance = destination - start;
    if (Math.abs(distance) < 3) return Promise.resolve();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scroller.scrollTop = destination;
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const started = performance.now();
      const frame = now => {
        if (token !== previewScrollToken) return resolve();
        const progress = Math.min(1, (now - started) / duration);
        const eased = progress < .5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        scroller.scrollTop = start + distance * eased;
        if (progress < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  function scrollPreviewTo(targetId) {
    if (!targetId) return;
    const token = ++previewScrollToken;
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      if (token !== previewScrollToken) return;
      const target = $(targetId);
      if (!target) return;
      let scroller = null;
      if (target.closest('.demo-site')) scroller = $('siteViewport');
      else if (target.closest('.phone-screen')) scroller = $('phoneScreen');
      else if (target.closest('.social-presentation')) scroller = document.querySelector('.social-presentation');
      else if (target.closest('.ai-presentation')) scroller = document.querySelector('.ai-presentation');
      else if (target.closest('.visibility-presentation')) scroller = document.querySelector('.visibility-presentation');
      if (scroller) {
        const targetRect = target.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        const top = scroller.scrollTop + targetRect.top - scrollerRect.top - Math.max(18, scroller.clientHeight * .12);
        scroller.style.scrollBehavior = 'auto';
        await animatePreviewScroll(scroller, Math.max(0, Math.min(top, scroller.scrollHeight - scroller.clientHeight)), 1750, token);
      }
      if (token !== previewScrollToken) return;
      target.classList.remove('is-highlighted');
      void target.offsetWidth;
      target.classList.add('is-highlighted');
      window.setTimeout(() => target.classList.remove('is-highlighted'), 2400);
    }));
  }

  function updatePhoneScrollbar() {
    const screen = $('phoneScreen');
    const track = $('phoneScrollbar');
    const thumb = $('phoneScrollbarThumb');
    if (!screen || !track || !thumb) return;
    const viewport = screen.clientHeight;
    const content = screen.scrollHeight;
    const maxScroll = Math.max(0, content - viewport);
    const trackHeight = track.clientHeight;
    const thumbHeight = Math.max(28, Math.min(trackHeight, trackHeight * viewport / Math.max(content, 1)));
    const travel = Math.max(0, trackHeight - thumbHeight);
    const top = maxScroll ? screen.scrollTop / maxScroll * travel : 0;
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${top}px)`;
    track.classList.toggle('has-overflow', maxScroll > 3);
  }

  function updatePrices() {
    const total = monthlyTotal();
    $('monthlyTotal').textContent = money(total);
    $('priceDialogTotal').textContent = `${money(total)} / Monat`;
    $('contactMonthly').textContent = `${money(total)} / Monat`;
    const addonsList = selectedItems().filter(item => !item.mandatory);
    $('contactSelected').innerHTML = [
      `<span>Website, Hosting & Basis-Support · ${money(BASE_MONTHLY)}</span>`,
      ...addonsList.map(item => `<span>${escapeHTML(item.name)} · ${item.price ? money(item.price) : 'kostenlos'}</span>`)
    ].join('');
    const rows = [
      `<div class="price-breakdown-row"><span>Website, Hosting & Basis-Support<small>Fester Basis-Service · nach 2 Freimonaten</small></span><b>${money(BASE_MONTHLY)} / Mon.</b></div>`,
      ...addonsList.map(item => `<div class="price-breakdown-row"><span>${escapeHTML(item.name)}</span><b>${item.price ? `${money(item.price)} / Mon.` : 'Kostenlos'}</b></div>`)
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
    if (!item || item.mandatory) return;
    if (SELECTED.has(id)) SELECTED.delete(id); else SELECTED.add(id);
    refresh();
    setScene(item.scene);
    scrollPreviewTo(item.target);
  }

  function toggleSocial(id) {
    if (SELECTED_SOCIAL.has(id)) SELECTED_SOCIAL.delete(id); else SELECTED_SOCIAL.add(id);
    refresh();
    setScene('social');
    const target = SELECTED_SOCIAL.has(id) ? `social-channel-${id}` : (SOCIAL.find(item => SELECTED_SOCIAL.has(item.id)) ? `social-channel-${SOCIAL.find(item => SELECTED_SOCIAL.has(item.id)).id}` : 'socialConnection');
    scrollPreviewTo(target);
  }

  function openInfo(id) {
    const item = byId(id);
    if (!item) return;
    currentInfoId = id;
    $('infoArt').innerHTML = illustration(item);
    $('infoTitle').textContent = item.name;
    $('infoDescription').textContent = item.detail;
    $('infoPrice').textContent = item.mandatory ? `${money(item.price)} pro Monat · fester Basis-Service · 2 Monate kostenlos testen` : item.price ? `${money(item.price)} pro Monat · 2 Monate kostenlos testen` : 'Ohne Aufpreis enthalten';
    $('infoToggle').textContent = item.mandatory ? 'Immer enthalten' : SELECTED.has(id) ? 'Aus Auswahl entfernen' : 'Hinzufügen';
    $('infoToggle').disabled = !!item.mandatory;
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
    requestAnimationFrame(() => $('optionsRail').dispatchEvent(new Event('scroll')));
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
        features:group('website'),visibilityFeatures:group('visibility'),
        mobileFeatures:group('phone'),contactFeatures:group('phone').filter(item => ['whatsapp','whatsappBot','contactPlus'].includes(item.id)),
        aiFeatures:group('ai'),socialProfiles:[...SELECTED_SOCIAL],
        socialFeatures:group('social'),
        pricing:{setupPrice:0,baseMonthly:BASE_MONTHLY,addonsMonthly:addonsTotal(),monthlyAfterTrial:monthlyTotal(),freeTrialMonths:FREE_TRIAL_MONTHS,trialTotal:0,currency:'EUR',status:PRICE_STATUS,note:'Unverbindliche monatliche Richtwerte. Ein kostenpflichtiger Vertrag entsteht nur nach individuellem Angebot und ausdrücklicher Zustimmung.'},
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
    const rail = $('optionsRail');
    const phoneScreen = $('phoneScreen');
    const phoneTrack = $('phoneScrollbar');
    const phoneThumb = $('phoneScrollbarThumb');
    let draggingPhoneThumb = false;
    const setPhoneScrollFromPointer = clientY => {
      const rect = phoneTrack.getBoundingClientRect();
      const thumbHeight = phoneThumb.offsetHeight;
      const travel = Math.max(1, rect.height - thumbHeight);
      const offset = Math.max(0, Math.min(travel, clientY - rect.top - thumbHeight / 2));
      const maxScroll = Math.max(0, phoneScreen.scrollHeight - phoneScreen.clientHeight);
      phoneScreen.scrollTop = maxScroll * offset / travel;
      updatePhoneScrollbar();
    };
    phoneTrack.addEventListener('pointerdown', event => {
      if (!phoneTrack.classList.contains('has-overflow')) return;
      event.preventDefault();
      draggingPhoneThumb = true;
      phoneTrack.setPointerCapture?.(event.pointerId);
      setPhoneScrollFromPointer(event.clientY);
    });
    phoneTrack.addEventListener('pointermove', event => {
      if (draggingPhoneThumb) setPhoneScrollFromPointer(event.clientY);
    });
    const stopPhoneThumbDrag = () => { draggingPhoneThumb = false; };
    phoneTrack.addEventListener('pointerup', stopPhoneThumbDrag);
    phoneTrack.addEventListener('pointercancel', stopPhoneThumbDrag);
    phoneScreen.addEventListener('scroll', updatePhoneScrollbar, {passive:true});
    window.addEventListener('resize', updatePhoneScrollbar, {passive:true});
    requestAnimationFrame(updatePhoneScrollbar);

    $('infoToggle').addEventListener('click', () => {
      if (!currentInfoId) return;
      const id = currentInfoId;
      const item = byId(id);
      if (item?.mandatory) return;
      $('infoDialog').close();
      toggleFeature(id);
    });
    document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
    $('priceDetailsButton').addEventListener('click', () => $('priceDialog').showModal());
    $('requestButton').addEventListener('click', () => $('contactDialog').showModal());
    $('changeBasics').addEventListener('click', openIntro);
    $('contactForm').elements.contactCompany.addEventListener('input', () => {
      refresh();
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
