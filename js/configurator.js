(() => {
  'use strict';

  // Erst nach Bereitstellung der Google-Apps-Script-Web-App ausfüllen.
  const CONFIG = { FORM_ENDPOINT: '' };
  const BASE_MONTHLY = 35;
  const FREE_TRIAL_MONTHS = 2;
  const PROFILE_SETUP_ONCE = 5;
  const PRICE_STATUS = 'Vorläufige Preisorientierung – monatliche Einzelpreise noch intern freizugeben';
  const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const money = value => euro.format(Number(value || 0));
  const $ = id => document.getElementById(id);

  const FEATURES = {
    website: [
      {id:'baseService',name:'Website, Hosting & Basis-Support',price:35,glyph:'',scene:'website',target:'siteTop',mandatory:true,detail:'Die feste Grundlage für Ihren digitalen Auftritt: Website-Bereitstellung, Hosting und technischer Basis-Support. Dieser Service gehört immer zur Konfiguration und kann nicht abgewählt werden. Die ersten zwei Monate sind kostenlos; danach beträgt der vorläufige Richtwert 35 € pro Monat.'},
      {id:'booking',name:'Online-Terminbuchung',price:19,glyph:'▦',scene:'website',target:'module-booking',detail:'Kunden wählen Leistungen, Wunschtermin und freie Uhrzeiten direkt auf Ihrer Website. Der Buchungsbereich erscheint auf der Website und in der mobilen Ansicht. Mögliche Plattformlizenzen werden vor dem Start geklärt.'},
      {id:'employeeManagement',name:'Mitarbeiter- & Terminverwaltung',price:15,glyph:'♙',scene:'website',target:'module-team-management',detail:'Mitarbeiter, Arbeitszeiten und Terminübersichten werden zentral verwaltet. Die Vorschau zeigt eine Team- und Tagesübersicht. Der genaue Funktionsumfang hängt von der gewählten Buchungslösung ab.'},
      {id:'whatsapp',name:'WhatsApp-Kontakt',price:0,glyph:'◔',scene:'website',target:'module-whatsapp',detail:'Ein WhatsApp-Kontakt öffnet eine Nachricht an Ihre WhatsApp-Business-Nummer. Das ist ein direkter Kontaktweg und noch kein automatischer Chatbot.'},
      {id:'contactPlus',name:'Erweitertes Kontaktformular',price:2,glyph:'▤',scene:'website',target:'module-contact',detail:'Ein Formular mit zusätzlichen Feldern und Auswahlmöglichkeiten hilft, Anfragen strukturiert zu erfassen. Empfänger, Versandweg und Spam-Schutz werden passend eingerichtet.'},
      {id:'gallery',name:'Galerie & Portfolio',price:3,glyph:'▧',scene:'website',target:'module-gallery',detail:'Eine große, bildorientierte Galerie für Arbeiten, Referenzen oder Räume. Die Vorschau zeigt einen echten Bildbereich mit mehreren Formaten. Fotos und Nutzungsrechte werden vom Betrieb bereitgestellt bzw. vorab geklärt.'},
      {id:'instagramFeed',name:'Instagram-Integration',price:4,glyph:'◎',scene:'website',target:'module-instagram',detail:'Ausgewählte Instagram-Beiträge werden als eigener Bereich direkt in Ihre Website eingebunden. Die Vorschau zeigt ein Beitragsraster auf Ihrer Website. Dafür fallen 4 € pro Monat an. Einrichtung und Verknüpfung des Instagram-Profils sind davon getrennt und kosten einmalig 5 € pro ausgewähltem Profil. Keine laufende Social-Media-Betreuung.'},
      {id:'reviews',name:'Google-Bewertungen',price:3,glyph:'★',scene:'website',target:'module-reviews',detail:'Ein Bewertungsbereich mit ausgewählten Kundenstimmen und einer Verknüpfung zum Bewertungsprofil. Eine automatische Live-Synchronisierung hängt von einer verfügbaren Schnittstelle ab.'},
      {id:'maps',name:'Karte & Öffnungszeiten',price:0,glyph:'⌖',scene:'website',target:'module-maps',detail:'Ein sichtbarer Standortbereich mit einer grafischen Karte, Adresse, Öffnungszeiten und einem Link zur Routenplanung. Eine externe Karten-Einbettung wird erst nach technischer und datenschutzrechtlicher Prüfung aktiviert.'},
      {id:'faq',name:'FAQ-Bereich',price:0,glyph:'＋',scene:'website',target:'module-faq',detail:'Ein aufklappbarer Fragenbereich. Besucher können Antworten direkt auf der Website öffnen, ohne erst anrufen zu müssen.'},
      {id:'blog',name:'Blog & Neuigkeiten',price:5,glyph:'▤',scene:'website',target:'module-blog',detail:'Ein redaktioneller Bereich für Neuigkeiten, Tipps und Beiträge. Die Vorschau zeigt einen echten Artikelaufbau mit Titel, Bild und Kurztext.'},
      {id:'shop',name:'Produktverkauf / Mini-Shop',price:25,glyph:'◇',scene:'website',target:'module-shop',detail:'Ein kleiner Produkt- oder Gutscheinbereich mit Produktkarten, Preisen und Bestellaufruf. Zahlungsanbieter, Transaktionsgebühren und rechtliche Shop-Pflichten werden separat geprüft.'},
      {id:'newsletter',name:'Newsletter-Anmeldung',price:4,glyph:'✉',scene:'website',target:'module-newsletter',detail:'Ein sichtbares Anmeldeformular für Neuigkeiten und Angebote. Newsletter-Anbieter, Double-Opt-in und mögliche Lizenzgebühren werden vor der Aktivierung geprüft.'}
    ],
    phone: [
      {id:'mobileOptimization',name:'Mobile Website-Ansicht',price:0,glyph:'▯',scene:'phone',target:'phoneSiteTop',mandatory:true,detail:'Ihre vollständige Website wird automatisch an Smartphone-Bildschirme angepasst. Alle ausgewählten Website-Bausteine bleiben enthalten und werden für die schmale Ansicht neu angeordnet. Die mobile Darstellung ist fester Bestandteil der Website.'}
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
    social: [],
    visibility: [
      {id:'localSEO',name:'Lokale SEO-Grundlagen',price:9,glyph:'⌕',scene:'visibility',target:'visibility-seo',detail:'Grundlegende lokale SEO-Einrichtung: Seitenstruktur, Unternehmensinformationen, Metadaten und technische Basis. Das ist keine Garantie für bestimmte Rankings und keine laufende SEO-Kampagne.'},
      {id:'multilingual',name:'Mehrsprachigkeit',price:12,glyph:'文',scene:'visibility',target:'visibility-multilingual',detail:'Die vereinbarten Seiten werden in zusätzliche Sprachen übertragen und mit einer Sprachumschaltung versehen. Umfang und spätere Pflege werden im individuellen Angebot festgelegt.'}
    ]
  };

  const SOCIAL = [
    {id:'instagram',name:'Instagram'},
    {id:'facebook',name:'Facebook'},
    {id:'tiktok',name:'TikTok'},
    {id:'linkedin',name:'LinkedIn'}
  ];

  const SELECTED = new Set(['baseService','mobileOptimization']);
  const SELECTED_SOCIAL = new Set();
  let industry = 'Friseursalon / Barbershop';
  let websiteStatus = 'Keine Website';
  let currentInfoId = null;
  let currentScene = 'website';
  let railFrame = false;
  let previewScrollToken = 0;
  let activePreviewScrollCancel = null;
  let previewUserIntentVersion = 0;
  let railNavigationTarget = null;

  const allFeatures = Object.values(FEATURES).flat();
  const byId = id => allFeatures.find(item => item.id === id);
  const categoryOf = id => Object.keys(FEATURES).find(key => FEATURES[key].some(item => item.id === id));
  const selectedItems = () => allFeatures.filter(item => SELECTED.has(item.id));
  const monthlyTotal = () => selectedItems().reduce((sum, item) => sum + item.price, 0);
  const profileSetupTotal = () => SELECTED_SOCIAL.size * PROFILE_SETUP_ONCE;
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
    mobileOptimization:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
    instagramFeed:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>'
  };
  const SOCIAL_BRANDS = {
    instagram: { width:448, height:512, path:"M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" },
    facebook: { width:320, height:512, path:"M80 299.3V512H196V299.3h86.5l18-97.8H196V166.9c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4 .4 37 1.2V7.9C291.4 4 256.4 0 236.2 0C129.3 0 80 50.5 80 159.4v42.1H14v97.8H80z" },
    tiktok: { width:448, height:512, path:"M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" },
    linkedin: { width:448, height:512, path:"M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" },
    whatsapp: { width:448, height:512, path:"M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" }
  };

  function socialBrandIcon(id, extraClass = '') {
    const brand = SOCIAL_BRANDS[id];
    if (!brand) return '';
    return `<svg class="social-brand-icon brand-${id} ${extraClass}" viewBox="0 0 ${brand.width} ${brand.height}" aria-hidden="true" focusable="false"><path d="${brand.path}" fill="currentColor"/></svg>`;
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
        const price = item.mandatory ? (item.price ? `${money(item.price)}/Mon.` : 'Immer enthalten') : item.price ? `+ ${money(item.price)}/Mon.` : '0 €';
        const mandatory = item.mandatory ? ' mandatory' : '';
        const rowIcon = item.id === 'baseService' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21H3Z"/><path d="M9 21v-7h6v7"/></svg>' : featureIcon(item);
        return `<div class="feature-row${active ? ' selected' : ''}${mandatory}" role="checkbox" aria-checked="${active}" aria-disabled="${!!item.mandatory}" tabindex="0" data-feature="${item.id}">
          <div class="feature-main"><span class="feature-glyph" aria-hidden="true">${rowIcon}</span><span class="feature-name">${item.name}</span></div>
          <div class="feature-end"><span class="feature-price">${price}</span><button type="button" class="feature-info" data-info="${item.id}" aria-label="Details zu ${item.name}" title="Details">i</button><span class="feature-check" aria-hidden="true">✓</span></div>
        </div>`;
      }).join('');
    });
    $('socialChoices').innerHTML = SOCIAL.map(item => {
      const active = SELECTED_SOCIAL.has(item.id);
      return `<div class="feature-row social-option-row${active ? ' selected' : ''}" role="checkbox" aria-checked="${active}" tabindex="0" data-social="${item.id}">
        <div class="feature-main"><span class="feature-glyph social-glyph" aria-hidden="true">${socialBrandIcon(item.id)}</span><span class="feature-name">${item.name}</span></div>
        <div class="feature-end"><span class="feature-price">${money(PROFILE_SETUP_ONCE)} einmalig</span><span class="feature-check" aria-hidden="true">✓</span></div>
      </div>`;
    }).join('');
  }

  // Update a preview container without destroying unchanged module elements.
  // Keeping node identity is essential for reliable FLIP reflow animations.
  function syncDirectChildren(host, markup) {
    if (!host) return;
    const template = document.createElement('template');
    template.innerHTML = String(markup || '').trim();
    const currentById = new Map([...host.children].filter(node => node.id).map(node => [node.id, node]));
    const nextNodes = [...template.content.children].map(nextNode => {
      const currentNode = nextNode.id ? currentById.get(nextNode.id) : null;
      if (!currentNode || currentNode.tagName !== nextNode.tagName) return nextNode;

      // Keep the outer element (and its measured position), while refreshing its contents.
      for (const attribute of [...currentNode.attributes]) {
        if (!nextNode.hasAttribute(attribute.name)) currentNode.removeAttribute(attribute.name);
      }
      for (const attribute of [...nextNode.attributes]) {
        currentNode.setAttribute(attribute.name, attribute.value);
      }
      if (currentNode.innerHTML !== nextNode.innerHTML) currentNode.innerHTML = nextNode.innerHTML;
      return currentNode;
    });
    host.replaceChildren(...nextNodes);
  }

  function moduleHeading(eyebrow, title, subtitle = '') {
    return `<span class="module-kicker">${eyebrow}</span><h3 class="module-title">${title}</h3>${subtitle ? `<p class="module-subtitle">${subtitle}</p>` : ''}`;
  }

  function positionSiteFloatingActions() {
    const shell = document.querySelector('.website-preview-shell');
    const site = $('demoSite');
    const viewport = $('siteViewport');
    const actions = $('siteFloatingActions');
    if (!shell || !site || !viewport || !actions) return;
    const shellRect = shell.getBoundingClientRect();
    const siteRect = site.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    if (!shellRect.width || !siteRect.width || !viewportRect.height) return;
    const right = Math.max(8, shellRect.right - siteRect.right + 18);
    const bottom = Math.max(8, shellRect.bottom - viewportRect.bottom + 18);
    actions.style.setProperty('right', `${right}px`, 'important');
    actions.style.setProperty('bottom', `${bottom}px`, 'important');
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
    if (has('whatsapp')) parts.push(`<section class="site-module module-whatsapp" id="module-whatsapp">${moduleHeading('DIREKT ERREICHBAR','Schreiben Sie uns auf WhatsApp','Ein persönlicher Kontaktweg – ohne Warteformular.')}<a class="module-whatsapp-link" href="#siteContact"><span class="module-whatsapp-mark">${socialBrandIcon('whatsapp')}</span><span><b>WhatsApp-Nachricht senden</b><small>Wir freuen uns auf Ihre Nachricht.</small></span><i>↗</i></a></section>`);
    if (has('contactPlus')) parts.push(`<section class="site-module" id="module-contact">${moduleHeading('KONTAKT','Schreiben Sie uns')}
      <form class="module-contact-form"><input placeholder="Ihr Name"><input placeholder="E-Mail-Adresse"><textarea placeholder="Ihre Nachricht"></textarea><button type="button">Nachricht vorbereiten ↗</button></form></section>`);
    syncDirectChildren($('siteModules'), parts.join(''));
    $('siteWhatsApp').hidden = !(has('whatsapp') || has('whatsappBot'));
    $('siteChatFloat').hidden = !has('chatbot');
    $('siteFloatingActions').hidden = !has('chatbot') && !has('whatsapp') && !has('whatsappBot');
    $('previewBrand').textContent = currentBrand();
    $('footerBrand').textContent = currentBrand();
    $('phoneBrand').textContent = currentBrand();
    applyIndustryTheme();
    $('siteChatFloat').hidden = !has('chatbot');
    requestAnimationFrame(positionSiteFloatingActions);
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
    const phoneScreen = $('phoneScreen');
    if (phoneScreen) phoneScreen.className = `phone-screen industry-${t.key || 'hair'}`;
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
    // The mobile demo is the same website, not a reduced feature catalogue.
    // Clone the desktop modules and prefix IDs so both previews can coexist in the DOM.
    const desktopModules = $('siteModules').innerHTML.trim();
    const phoneModules = desktopModules
      .replace(/\bid="module-([^\"]+)"/g, 'id="phone-module-$1"')
      .replace(/href="#module-([^\"]+)"/g, 'href="#phone-module-$1"');
    $('phoneLiveModule').innerHTML = phoneModules ||
      `<div class="phone-module-empty">Zusätzliche Website-Funktionen erscheinen hier.</div>`;

    const phoneLinks = $('phoneSocialLinks');
    const chosenSocial = SOCIAL.filter(item => SELECTED_SOCIAL.has(item.id));
    phoneLinks.innerHTML = chosenSocial.map(item =>
      `<span class="phone-social-link" aria-label="${escapeHTML(item.name)}">${socialBrandIcon(item.id)}</span>`
    ).join('');
    phoneLinks.hidden = chosenSocial.length === 0;

    const floating = [];
    if (SELECTED.has('chatbot')) floating.push(
      `<span class="phone-ai-action phone-ai-chat"><i>✳</i><b>KI-Chat</b></span>`
    );
    if (SELECTED.has('whatsappBot')) floating.push(
      `<span class="phone-ai-action phone-ai-whatsapp">${socialBrandIcon('whatsapp')}<b>WhatsApp</b></span>`
    );
    else if (SELECTED.has('whatsapp')) floating.push(
      `<span class="phone-ai-action phone-ai-whatsapp">${socialBrandIcon('whatsapp')}<b>Nachricht</b></span>`
    );
    const phoneActions = $('phoneFloatingActions');
    phoneActions.innerHTML = floating.join('');
    phoneActions.hidden = floating.length === 0;
    $('phoneScreen').classList.toggle('has-phone-actions', floating.length > 0);
    requestAnimationFrame(() => requestAnimationFrame(updatePhoneScrollbar));
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
    syncDirectChildren($('socialPreviewContent'), cards.length ? cards.join('') : `<div class="social-empty-preview"><div class="social-empty-symbol">${socialBrandIcon('instagram')}${socialBrandIcon('facebook')}${socialBrandIcon('tiktok')}${socialBrandIcon('linkedin')}</div><h3>Ihre Social-Media-Kanäle</h3><p>Wählen Sie rechts Instagram, Facebook, TikTok oder LinkedIn aus. Jeder gewählte Kanal erscheint hier mit einer eigenen Vorschau.</p></div>`);
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
    syncDirectChildren($('aiPreviewContent'), cards.length ? cards.join('') : `<div class="ai-empty-preview"><div class="ai-empty-orb">✳</div><h3>KI, die konkrete Aufgaben übernimmt.</h3><p>Wählen Sie einen KI-Baustein aus. Hier sehen Sie anschließend genau, wie er mit Ihren Kunden oder Ihrem Team arbeitet.</p><div class="ai-empty-flow"><span>Kundenanfrage</span><i>↓</i><span>KI-Assistent</span><i>↓</i><span>Ihr Team</span></div></div>`);
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
    syncDirectChildren($('visibilityPreview'), parts.length ? parts.join('') : `<div class="visibility-empty-preview"><div class="visibility-empty-icons"><span>⌕</span><span>文</span></div><h3>Mehr Sichtbarkeit. Mehr Möglichkeiten.</h3><p>Wählen Sie lokale SEO oder zusätzliche Sprachen, um die jeweilige Wirkung hier zu sehen.</p></div>`);
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
    const changed = currentScene !== scene;
    if (changed && activePreviewScrollCancel) activePreviewScrollCancel();
    currentScene = scene;
    document.querySelectorAll('[data-jump-scene]').forEach(button => {
      const active = button.dataset.jumpScene === scene;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    if (!changed) {
      if (scene === 'phone') requestAnimationFrame(updatePhoneScrollbar);
      return;
    }
    document.querySelectorAll('.scene').forEach(element => {
      const active = element.dataset.scene === scene;
      element.hidden = !active;
      element.classList.toggle('active', active);
    });
    if (scene === 'phone') requestAnimationFrame(updatePhoneScrollbar);
    if (scene === 'website') requestAnimationFrame(positionSiteFloatingActions);
  }

  function nextPaint() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function waitForSceneTransition(scene) {
    await nextPaint();
    const element = document.querySelector(`.scene[data-scene="${scene}"]`);
    if (!element?.getAnimations) return;
    const animations = element.getAnimations();
    if (animations.length) await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
  }

  function animatePreviewScroll(scroller, destination, duration = 900, token) {
    if (!scroller) return Promise.resolve({ cancelled:false });
    if (activePreviewScrollCancel) activePreviewScrollCancel();

    const previousValue = scroller.style.getPropertyValue('scroll-behavior');
    const previousPriority = scroller.style.getPropertyPriority('scroll-behavior');
    scroller.style.setProperty('scroll-behavior', 'auto', 'important');
    const start = scroller.scrollTop;
    const distance = destination - start;
    if (Math.abs(distance) < 2) {
      if (previousValue) scroller.style.setProperty('scroll-behavior', previousValue, previousPriority);
      else scroller.style.removeProperty('scroll-behavior');
      return Promise.resolve({ cancelled:false });
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scroller.scrollTop = destination;
      if (previousValue) scroller.style.setProperty('scroll-behavior', previousValue, previousPriority);
      else scroller.style.removeProperty('scroll-behavior');
      return Promise.resolve({ cancelled:false });
    }

    return new Promise(resolve => {
      const started = performance.now();
      let settled = false;
      let frameId = 0;
      const cleanup = () => {
        scroller.removeEventListener('wheel', cancelFromUser);
        scroller.removeEventListener('touchstart', cancelFromUser);
        scroller.removeEventListener('pointerdown', cancelFromUser);
        if (frameId) cancelAnimationFrame(frameId);
        if (previousValue) scroller.style.setProperty('scroll-behavior', previousValue, previousPriority);
        else scroller.style.removeProperty('scroll-behavior');
        if (activePreviewScrollCancel === cancel) activePreviewScrollCancel = null;
      };
      const finish = cancelled => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({ cancelled });
      };
      const cancel = () => finish(true);
      const cancelFromUser = () => finish(true);
      activePreviewScrollCancel = cancel;
      scroller.addEventListener('wheel', cancelFromUser, { passive:true });
      scroller.addEventListener('touchstart', cancelFromUser, { passive:true });
      scroller.addEventListener('pointerdown', cancelFromUser, { passive:true });

      const frame = now => {
        if (token !== previewScrollToken) { finish(true); return; }
        const progress = Math.min(1, (now - started) / duration);
        const eased = progress < .5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        scroller.scrollTop = start + distance * eased;
        if (progress < 1) frameId = requestAnimationFrame(frame);
        else {
          scroller.scrollTop = destination;
          finish(false);
        }
      };
      frameId = requestAnimationFrame(frame);
    });
  }

  function previewHost(scene) {
    return ({
      website: $('siteModules'),
      social: $('socialPreviewContent'),
      ai: $('aiPreviewContent'),
      visibility: $('visibilityPreview')
    })[scene] || null;
  }

  function captureLayout(host, coordinateMode = 'viewport') {
    if (!host) return new Map();
    const scroller = findPreviewScroller(host);
    const scrollTop = scroller?.scrollTop || 0;
    const scrollLeft = scroller?.scrollLeft || 0;
    return new Map([...host.children].map((element, index) => {
      const rect = element.getBoundingClientRect();
      const viewport = { left:rect.left, top:rect.top };
      const content = { left:rect.left + scrollLeft, top:rect.top + scrollTop };
      return [element.id || `__child_${index}`, {
        // Adds use content coordinates because scrolling finishes before FLIP starts.
        // Removes use viewport coordinates so browser scrollTop clamping is included
        // and siblings keep their exact visual position at the start of the collapse.
        rect:coordinateMode === 'content' ? content : viewport,
        index
      }];
    }));
  }

  function playAndRelease(element, keyframes, options, scroller = null) {
    if (!element?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
    element.getAnimations?.().forEach(animation => animation.cancel());
    const animation = element.animate(keyframes, { ...options, fill:'both' });
    const cancelFromUser = () => animation.cancel();
    if (scroller) {
      // Manual movement always wins over a scripted layout transition.
      scroller.addEventListener('wheel', cancelFromUser, {passive:true});
      scroller.addEventListener('touchstart', cancelFromUser, {passive:true});
      scroller.addEventListener('pointerdown', cancelFromUser, {passive:true});
    }
    return animation.finished.catch(() => {}).then(() => {
      if (scroller) {
        scroller.removeEventListener('wheel', cancelFromUser);
        scroller.removeEventListener('touchstart', cancelFromUser);
        scroller.removeEventListener('pointerdown', cancelFromUser);
      }
      // Release the WAAPI effect after its final frame so later FLIP passes start cleanly.
      try { animation.cancel(); } catch (_) {}
    });
  }

  function animateLayout(host, before, enteringId = '', coordinateMode = 'viewport') {
    if (!host || !before) return Promise.resolve();
    const jobs = [];
    const enterDuration = 460;
    const reflowDuration = 720;

    [...host.children].forEach((element, index) => {
      const key = element.id || `__child_${index}`;
      const previous = before.get(key);
      if (!previous) {
        const isEmptyState = element.matches('.ai-empty-preview,.social-empty-preview,.visibility-empty-preview');
        if (element.id === enteringId || (!enteringId && isEmptyState)) {
          // Exact reverse of the removal: the element returns from the left while fading in.
          jobs.push(playAndRelease(element, [
            { opacity:0, transform:'translate3d(-48px,0,0)' },
            { opacity:1, transform:'translate3d(0,0,0)' }
          ], { duration:enterDuration, easing:'cubic-bezier(.2,.65,.6,1)' }, findPreviewScroller(host)));
        }
        return;
      }

      const current = element.getBoundingClientRect();
      const scroller = findPreviewScroller(host);
      const currentLeft = current.left + (coordinateMode === 'content' ? (scroller?.scrollLeft || 0) : 0);
      const currentTop = current.top + (coordinateMode === 'content' ? (scroller?.scrollTop || 0) : 0);
      const dx = previous.rect.left - currentLeft;
      const dy = previous.rect.top - currentTop;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        jobs.push(playAndRelease(element, [
          { transform:`translate3d(${dx}px, ${dy}px, 0)` },
          { transform:'translate3d(0,0,0)' }
        ], { duration:reflowDuration, easing:'cubic-bezier(.4,0,.2,1)' }, scroller));
      }
    });
    return Promise.all(jobs);
  }

  async function animateRemoval(target) {
    if (!target || !target.isConnected || !target.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    await playAndRelease(target, [
      { opacity:1, transform:'translate3d(0,0,0)' },
      { opacity:0, transform:'translate3d(-48px,0,0)' }
    ], { duration:460, easing:'cubic-bezier(.4,0,.8,.35)' }, findPreviewScroller(target));
  }

  function findPreviewScroller(target) {
    if (target.closest('[data-scene="website"]')) return $('siteViewport');
    if (target.closest('[data-scene="phone"]')) return $('phoneContent');
    if (target.closest('[data-scene="social"]')) return document.querySelector('.social-presentation');
    if (target.closest('[data-scene="ai"]')) return document.querySelector('.ai-presentation');
    if (target.closest('[data-scene="visibility"]')) return document.querySelector('.visibility-presentation');
    return null;
  }

  function scrollPreviewTo(targetId, expectedIntentVersion) {
    if (!targetId || (expectedIntentVersion !== undefined && expectedIntentVersion !== previewUserIntentVersion)) return Promise.resolve();
    const token = ++previewScrollToken;
    return new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(async () => {
        if (token !== previewScrollToken || (expectedIntentVersion !== undefined && expectedIntentVersion !== previewUserIntentVersion)) { resolve(); return; }
        const target = $(targetId);
        if (!target || !target.isConnected || !target.getClientRects().length) { resolve(); return; }
        // Scroll the preview's own viewport (website / phone / social / AI), never the options rail.
        const scroller = findPreviewScroller(target);
        if (!scroller) { resolve(); return; }
        const targetRect = target.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        const topInset = Math.max(22, Math.min(54, scroller.clientHeight * .075));
        const destination = scroller.scrollTop + targetRect.top - scrollerRect.top - topInset;
        const boundedDestination = Math.max(0, Math.min(destination, scroller.scrollHeight - scroller.clientHeight));
        const distance = Math.abs(boundedDestination - scroller.scrollTop);
        const duration = Math.min(1120, Math.max(460, distance * .72));
        await animatePreviewScroll(scroller, boundedDestination, duration, token);
        resolve();
      }));
    });
  }

  function updatePhoneScrollbar() {
    const screen = $('phoneContent');
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
    const oneTime = profileSetupTotal();
    $('monthlyTotal').textContent = money(total);
    $('oneTimeTotal').textContent = money(oneTime);
    $('priceDialogTotal').textContent = `${money(total)} / Monat`;
    $('priceDialogOnce').textContent = money(oneTime);
    $('contactMonthly').textContent = `${money(total)} / Monat`;
    $('contactOnce').textContent = money(oneTime);
    const addonsList = selectedItems().filter(item => !item.mandatory);
    const selectedProfiles = SOCIAL.filter(item => SELECTED_SOCIAL.has(item.id));
    $('contactSelected').innerHTML = [
      `<span>Website, Hosting & Basis-Support · ${money(BASE_MONTHLY)} / Monat</span>`,
      ...addonsList.map(item => `<span>${escapeHTML(item.name)} · ${item.price ? `${money(item.price)} / Monat` : '0 €'}</span>`),
      ...selectedProfiles.map(item => `<span>${escapeHTML(item.name)}-Profil einrichten · ${money(PROFILE_SETUP_ONCE)} einmalig</span>`)
    ].join('');
    const rows = [
      `<div class="price-breakdown-row"><span>Website, Hosting & Basis-Support<small>Fester Basis-Service · nach 2 Freimonaten</small></span><b>${money(BASE_MONTHLY)} / Mon.</b></div>`,
      ...addonsList.map(item => `<div class="price-breakdown-row"><span>${escapeHTML(item.name)}</span><b>${item.price ? `${money(item.price)} / Mon.` : '0 €'}</b></div>`),
      ...(selectedProfiles.length ? [`<div class="price-breakdown-caption">Einmalige Einrichtung der Social-Media-Profile</div>`, ...selectedProfiles.map(item => `<div class="price-breakdown-row"><span>${escapeHTML(item.name)}-Profil einrichten</span><b>${money(PROFILE_SETUP_ONCE)} einmalig</b></div>`)] : [])
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
    railNavigationTarget = scene;
    setScene(scene);
    const toolsHeight = rail.querySelector('.rail-tools')?.getBoundingClientRect().height || 0;
    const top = rail.scrollTop + section.getBoundingClientRect().top - rail.getBoundingClientRect().top - toolsHeight + 6;
    rail.scrollTo({top:Math.max(0, top), behavior:'smooth'});
  }

  const pendingChanges = new Set();
  let previewChangeQueue = Promise.resolve();

  async function toggleFeature(id) {
    const item = byId(id);
    if (!item || item.mandatory || pendingChanges.has(id)) return;
    pendingChanges.add(id);
    const intentVersion = previewUserIntentVersion;
    const operation = previewChangeQueue.then(async () => {
      setScene(item.scene);
      await waitForSceneTransition(item.scene);
      const adding = !SELECTED.has(id);
      const host = previewHost(item.scene);

      if (!adding) {
        const target = $(item.target);
        // First bring the block into view. Capture only after scrolling settles,
        // and compare content coordinates so scroll clamping cannot fake movement.
        if (target && target.isConnected) await scrollPreviewTo(item.target, intentVersion);
        const before = captureLayout(host);
        if (target && target.isConnected) await animateRemoval(target);
        SELECTED.delete(id);
        refresh();
        await nextPaint();
        await animateLayout(host, before);
        return;
      }

      // Scroll to the new module before playing its entrance/reflow. Content-space
      // measurements keep the FLIP deltas independent of the completed scroll.
      const before = captureLayout(host, 'content');
      SELECTED.add(id);
      refresh();
      await nextPaint();
      await scrollPreviewTo(item.target, intentVersion);
      await animateLayout(host, before, item.target, 'content');
    });
    previewChangeQueue = operation.catch(() => {});
    try { await operation; }
    finally { pendingChanges.delete(id); }
  }

  async function toggleSocial(id) {
    const lockId = `social:${id}`;
    if (pendingChanges.has(lockId)) return;
    pendingChanges.add(lockId);
    const intentVersion = previewUserIntentVersion;
    const operation = previewChangeQueue.then(async () => {
      setScene('social');
      await waitForSceneTransition('social');
      const adding = !SELECTED_SOCIAL.has(id);
      const host = previewHost('social');
      const targetId = `social-channel-${id}`;

      if (!adding) {
        const target = $(targetId);
        if (target && target.isConnected) await scrollPreviewTo(targetId, intentVersion);
        const before = captureLayout(host);
        if (target && target.isConnected) await animateRemoval(target);
        SELECTED_SOCIAL.delete(id);
        refresh();
        await nextPaint();
        await animateLayout(host, before);
        return;
      }

      const before = captureLayout(host, 'content');
      SELECTED_SOCIAL.add(id);
      refresh();
      await nextPaint();
      await scrollPreviewTo(targetId, intentVersion);
      await animateLayout(host, before, targetId, 'content');
    });
    previewChangeQueue = operation.catch(() => {});
    try { await operation; }
    finally { pendingChanges.delete(lockId); }
  }

  function applyRecommendedPreset() {
    if (pendingChanges.size) return;
    SELECTED.clear();
    ['baseService','mobileOptimization','booking','employeeManagement','whatsapp','whatsappBot','chatbot','localSEO','instagramFeed'].forEach(id => SELECTED.add(id));
    SELECTED_SOCIAL.clear();
    SELECTED_SOCIAL.add('instagram');
    refresh();
    setScene('website');
    alignRailToScene('website');
    scrollPreviewTo('module-booking');
  }

  function openInfo(id) {
    const item = byId(id);
    if (!item) return;
    currentInfoId = id;
    $('infoArt').innerHTML = illustration(item);
    $('infoTitle').textContent = item.name;
    $('infoDescription').textContent = item.detail;
    $('infoPrice').textContent = item.id === 'mobileOptimization' ? 'Immer enthalten · keine Zusatzkosten' : item.mandatory ? `${money(item.price)} pro Monat · fester Basis-Service · 2 Monate kostenlos testen` : item.price ? `${money(item.price)} pro Monat · 2 Monate kostenlos testen` : '0 € · keine laufenden Zusatzkosten';
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
    if (!rail || !sections.length) return;
    const railRect = rail.getBoundingClientRect();
    const toolsHeight = document.querySelector('.rail-tools')?.getBoundingClientRect().height || 0;
    const activationLine = railRect.top + toolsHeight + 10;

    // During a tab-triggered smooth scroll, do not flash through intermediate scenes.
    // The target is finalized by the rail's scrollend handler.
    if (railNavigationTarget) return;

    let active = sections[0];
    if (rail.scrollTop + rail.clientHeight >= rail.scrollHeight - 4) {
      active = sections[sections.length - 1];
    } else {
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= activationLine) active = section;
      }
    }
    setScene(active.dataset.sceneSection);
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
        mobileFeatures:group('phone'),contactFeatures:group('website').filter(item => ['whatsapp','contactPlus'].includes(item.id)),
        aiFeatures:group('ai'),socialProfiles:SOCIAL.filter(item=>SELECTED_SOCIAL.has(item.id)).map(item=>({id:item.id,name:item.name,setupPrice:PROFILE_SETUP_ONCE})),
        socialFeatures:[],
        pricing:{setupPrice:0,profileSetupOnce:profileSetupTotal(),oneTimeTotal:profileSetupTotal(),baseMonthly:BASE_MONTHLY,addonsMonthly:addonsTotal(),monthlyAfterTrial:monthlyTotal(),freeTrialMonths:FREE_TRIAL_MONTHS,trialTotal:0,currency:'EUR',status:PRICE_STATUS,note:'Unverbindliche monatliche Richtwerte. Die Profileinrichtung wird einmalig mit 5 € je ausgewähltem Profil berechnet. Ein kostenpflichtiger Vertrag entsteht nur nach individuellem Angebot und ausdrücklicher Zustimmung.'},
        selectedFeatures:selected.map(item=>({id:item.id,name:item.name,category:categoryOf(item.id),monthlyPrice:item.price})),
        socialProfileSetup:{profiles:SOCIAL.filter(item=>SELECTED_SOCIAL.has(item.id)).map(item=>item.name),pricePerProfile:PROFILE_SETUP_ONCE,totalOnce:profileSetupTotal()}
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
    document.querySelectorAll('[data-jump-scene]').forEach(button => button.addEventListener('click', () => {
      // Open the requested preview immediately; the rail then scrolls without
      // flashing through the intermediate categories it passes on the way.
      alignRailToScene(button.dataset.jumpScene);
    }));
    $('recommendPreset').addEventListener('click', applyRecommendedPreset);

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
    window.addEventListener('resize', positionSiteFloatingActions, {passive:true});
    const rail = $('optionsRail');
    $('optionsRail').addEventListener('scroll', () => {
      if (railFrame) return;
      railFrame = true;
      requestAnimationFrame(() => {activeRailScene();railFrame=false;});
    },{passive:true});
    ['wheel','touchstart','pointerdown'].forEach(type => rail.addEventListener(type, () => { railNavigationTarget = null; }, {passive:true}));
    // Remember direct user intent on each preview scroller so an automatic
    // post-animation jump never overrides a manual scroll gesture.
    [ $('siteViewport'), document.querySelector('.social-presentation'), document.querySelector('.ai-presentation'), document.querySelector('.visibility-presentation') ]
      .filter(Boolean).forEach(scroller => ['wheel','touchstart','pointerdown'].forEach(type =>
        scroller.addEventListener(type, () => { previewUserIntentVersion += 1; }, {passive:true})
      ));
    $('optionsRail').addEventListener('scrollend', () => {
      if (railNavigationTarget) {
        const destination = railNavigationTarget;
        railNavigationTarget = null;
        setScene(destination);
      } else {
        activeRailScene();
      }
    }, {passive:true});
    rail.addEventListener('keydown', event => {
      if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) railNavigationTarget = null;
    });
    const phoneScreen = $('phoneContent');
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
