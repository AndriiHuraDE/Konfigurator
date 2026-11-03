/**
 * pimentaGROUP Website-Konfigurator
 * Speichert Anfragen aus dem Website-Konfigurator in einer gebundenen Google-Tabelle.
 * Optional kann eine E-Mail-Benachrichtigung aktiviert werden.
 *
 * Vor dem Einsatz: SETTINGS.NOTIFICATION_EMAIL setzen, Script in der Tabelle
 * erstellen und als Web-App bereitstellen. Die URL kommt danach in configurator.js.
 */
const SETTINGS = {
  NOTIFICATION_EMAIL: '', // z. B. info@pimentagroup.de
  SHEET_NAME: 'Website-Anfragen'
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    if (raw.length > 100000) throw new Error('Anfrage ist zu groß.');
    const data = JSON.parse(raw);

    // Honeypot gegen einfache Bot-Einsendungen.
    if (data.website) return jsonResponse({ ok: true });
    if (!data.contact || !String(data.contact.name || '').trim() || !isValidEmail(data.contact.email)) {
      throw new Error('Pflichtangaben fehlen oder die E-Mail-Adresse ist ungültig.');
    }

    lock.waitLock(10000);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error('Keine gebundene Google-Tabelle gefunden.');

    let sheet = spreadsheet.getSheetByName(SETTINGS.SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(SETTINGS.SHEET_NAME);

    const headers = [
      'Eingang', 'Name', 'Unternehmen', 'E-Mail', 'Telefon', 'Branche',
      'Projektart', 'Website-Status', 'Teamgröße', 'Hauptziel', 'Design',
      'Website-Funktionen (monatlich)', 'Kontakt-Funktionen (monatlich)',
      'KI-Funktionen (monatlich)', 'Social-Profile', 'Erstellung einmalig EUR',
      'Basis monatlich EUR', 'Zusatzmodule monatlich EUR', 'Monatlich nach Test EUR',
      'Kostenlose Testmonate', 'Preisstatus', 'Bestehende Website', 'Nachricht',
      'Vollständige Anfrage (JSON)'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold').setBackground('#273b2e').setFontColor('#ffffff');
    } else {
      const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
      const missing = headers.filter(header => !existing.includes(header));
      if (missing.length) {
        const start = existing.length + 1;
        sheet.getRange(1, start, 1, missing.length).setValues([missing]);
        sheet.getRange(1, start, 1, missing.length)
          .setFontWeight('bold').setBackground('#273b2e').setFontColor('#ffffff');
      }
    }

    const p = data.project || {};
    const c = data.contact || {};
    const pricing = p.pricing || {};
    const webFeatures = (p.features || []).map(formatModule);
    const contactFeatures = (p.contactFeatures || []).map(formatModule);
    const aiFeatures = (p.aiFeatures || []).map(formatModule);

    const row = [
      new Date(), safeCell(c.name), safeCell(c.company), safeCell(c.email), safeCell(c.phone),
      safeCell(p.industry), safeCell(p.type), safeCell(p.websiteStatus), safeCell(p.employeeCount),
      safeCell(p.mainGoal), safeCell(p.designStyle), safeCell(webFeatures.join(', ')),
      safeCell(contactFeatures.join(', ')), safeCell(aiFeatures.join(', ')),
      safeCell((p.socialProfiles || []).join(', ')), Number(pricing.setupPrice || 0),
      Number(pricing.baseMonthly || 0), Number(pricing.addonsMonthly || 0),
      Number(pricing.monthlyAfterTrial || 0), Number(pricing.freeTrialMonths || 0),
      safeCell(pricing.status), safeCell(c.currentWebsite), safeCell(c.message), JSON.stringify(data)
    ];
    sheet.appendRow(row);

    if (SETTINGS.NOTIFICATION_EMAIL && isValidEmail(SETTINGS.NOTIFICATION_EMAIL)) {
      sendNotification(data);
    }
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function doGet() {
  return jsonResponse({ ok: true, service: 'pimentaGROUP Konfigurator-Endpunkt aktiv' });
}

function formatModule(item) {
  if (typeof item === 'string') return item;
  return `${item.name || item.id || 'Modul'} (${formatEuro(item.monthlyPrice || 0)}/Monat)`;
}

function sendNotification(data) {
  const p = data.project || {};
  const c = data.contact || {};
  const price = p.pricing || {};
  const moduleLines = (items) => items && items.length ? items.map(item => `- ${formatModule(item)}`) : ['- Keine ausgewählt'];
  const body = [
    'Eine neue Konfiguration ist eingegangen.',
    '', 'KONTAKT',
    `Name: ${c.name || '-'}`,
    `Unternehmen: ${c.company || '-'}`,
    `E-Mail: ${c.email || '-'}`,
    `Telefon: ${c.phone || '-'}`,
    '', 'BETRIEB & PROJEKT',
    `Branche: ${p.industry || '-'}`,
    `Projekt: ${p.type || '-'}`,
    `Website-Status: ${p.websiteStatus || '-'}`,
    `Teamgröße: ${p.employeeCount || '-'}`,
    `Hauptziel: ${p.mainGoal || '-'}`,
    `Design: ${p.designStyle || '-'}`,
    '', 'WEBSITE-FUNKTIONEN', ...moduleLines(p.features),
    '', 'KONTAKT-FUNKTIONEN', ...moduleLines(p.contactFeatures),
    '', 'KI & AUTOMATISIERUNG', ...moduleLines(p.aiFeatures),
    '', 'SOCIAL-PROFILE', (p.socialProfiles || []).join(', ') || '-',
    '', 'PREISORIENTIERUNG',
    `Website-Erstellung einmalig: ${formatEuro(price.setupPrice || 0)}`,
    `Basis pro Monat: ${formatEuro(price.baseMonthly || 0)}`,
    `Zusatzmodule pro Monat: ${formatEuro(price.addonsMonthly || 0)}`,
    `Monatlich nach ${price.freeTrialMonths || 0} kostenlosen Monaten: ${formatEuro(price.monthlyAfterTrial || 0)}`,
    `Status: ${price.status || 'Unverbindlich'}`,
    '', 'WEITERE ANGABEN',
    `Bestehende Website: ${c.currentWebsite || '-'}`,
    `Nachricht: ${c.message || '-'}`,
    '', 'Hinweis: Dies ist eine unverbindliche Anfrage. Eine kostenpflichtige Fortsetzung erfolgt nur nach ausdrücklicher Vereinbarung.',
    'Die vollständige Konfiguration ist im Tabellenblatt gespeichert.'
  ].join('\n');

  MailApp.sendEmail({
    to: SETTINGS.NOTIFICATION_EMAIL,
    subject: `Neue Website-Anfrage: ${p.businessName || p.type || 'Projekt'} – ${c.name || 'Kontakt'}`,
    body,
    replyTo: c.email || undefined,
    name: 'pimentaGROUP Konfigurator'
  });
}

function safeCell(value) {
  const text = String(value == null ? '' : value);
  // Nutzereingaben in Tabellenzellen dürfen nicht als Formeln ausgeführt werden.
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function formatEuro(value) {
  return Number(value || 0).toLocaleString('de-DE', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
}

function jsonResponse(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
