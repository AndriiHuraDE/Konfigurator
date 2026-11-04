/**
 * pimentaGROUP Website-Konfigurator
 * Speichert Konfigurationen in einer gebundenen Google-Tabelle.
 * Optional wird eine Benachrichtigung per E-Mail versendet.
 *
 * Einrichtung:
 * 1. Google Sheet erstellen und Erweiterungen > Apps Script öffnen.
 * 2. Dieses Script vollständig einfügen.
 * 3. SETTINGS.NOTIFICATION_EMAIL optional setzen.
 * 4. Als Web-App bereitstellen und die /exec-URL in js/configurator.js eintragen.
 */
const SETTINGS = {
  NOTIFICATION_EMAIL: '',
  SHEET_NAME: 'Website-Anfragen'
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    if (raw.length > 100000) throw new Error('Anfrage ist zu groß.');
    const data = JSON.parse(raw);
    if (data.website) return jsonResponse({ ok: true }); // Honeypot

    const contact = data.contact || {};
    if (!String(contact.name || '').trim() || !isValidEmail(contact.email)) {
      throw new Error('Pflichtangaben fehlen oder die E-Mail-Adresse ist ungültig.');
    }

    lock.waitLock(10000);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error('Keine gebundene Google-Tabelle gefunden.');

    let sheet = spreadsheet.getSheetByName(SETTINGS.SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(SETTINGS.SHEET_NAME);

    const headers = [
      'Eingang', 'Name', 'Unternehmen', 'E-Mail', 'Telefon', 'Branche',
      'Projektart', 'Website-Status', 'Website-Funktionen', 'Smartphone-Funktionen',
      'Social-Profile', 'Social-Funktionen', 'KI-Funktionen', 'Zubehör / Hintergrundfunktionen',
      'Erstellung einmalig EUR', 'Basis monatlich EUR', 'Zusatzmodule monatlich EUR',
      'Monatlich nach Test EUR', 'Kostenlose Testmonate', 'Preisstatus', 'Nachricht',
      'Vollständige Anfrage (JSON)'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold').setBackground('#242424').setFontColor('#ffffff');
    } else {
      const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
      const missing = headers.filter(header => !existing.includes(header));
      if (missing.length) {
        const start = existing.length + 1;
        sheet.getRange(1, start, 1, missing.length).setValues([missing]);
        sheet.getRange(1, start, 1, missing.length)
          .setFontWeight('bold').setBackground('#242424').setFontColor('#ffffff');
      }
    }

    const project = data.project || {};
    const pricing = project.pricing || {};
    const formatList = items => (items || []).map(formatModule).join(', ');
    const row = [
      new Date(), safeCell(contact.name), safeCell(contact.company), safeCell(contact.email),
      safeCell(contact.phone), safeCell(project.industry), safeCell(project.type), safeCell(project.websiteStatus),
      safeCell(formatList(project.features)), safeCell(formatList(project.mobileFeatures)),
      safeCell((project.socialProfiles || []).join(', ')), safeCell(formatList(project.socialFeatures)),
      safeCell(formatList(project.aiFeatures)), safeCell(formatList(project.extrasFeatures)),
      Number(pricing.setupPrice || 0), Number(pricing.baseMonthly || 0),
      Number(pricing.addonsMonthly || 0), Number(pricing.monthlyAfterTrial || 0),
      Number(pricing.freeTrialMonths || 0), safeCell(pricing.status), safeCell(contact.message), JSON.stringify(data)
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
  const project = data.project || {};
  const contact = data.contact || {};
  const price = project.pricing || {};
  const list = items => items && items.length ? items.map(item => `- ${formatModule(item)}`) : ['- Keine ausgewählt'];
  const body = [
    'Eine neue Konfiguration ist eingegangen.',
    '', 'KONTAKT',
    `Name: ${contact.name || '-'}`,
    `Unternehmen: ${contact.company || '-'}`,
    `E-Mail: ${contact.email || '-'}`,
    `Telefon: ${contact.phone || '-'}`,
    '', 'BETRIEB',
    `Branche: ${project.industry || '-'}`,
    `Projekt: ${project.type || '-'}`,
    `Website-Status: ${project.websiteStatus || '-'}`,
    '', 'WEBSITE', ...list(project.features),
    '', 'SMARTPHONE', ...list(project.mobileFeatures),
    '', 'SOCIAL-PROFILE', (project.socialProfiles || []).join(', ') || '-',
    '', 'SOCIAL-FUNKTIONEN', ...list(project.socialFeatures),
    '', 'KI & AUTOMATISIERUNG', ...list(project.aiFeatures),
    '', 'ZUBEHÖR', ...list(project.extrasFeatures),
    '', 'PREISORIENTIERUNG',
    `Erstellung einmalig: ${formatEuro(price.setupPrice || 0)}`,
    `Basis pro Monat: ${formatEuro(price.baseMonthly || 0)}`,
    `Zusatzmodule pro Monat: ${formatEuro(price.addonsMonthly || 0)}`,
    `Monatlich nach ${price.freeTrialMonths || 0} kostenlosen Monaten: ${formatEuro(price.monthlyAfterTrial || 0)}`,
    `Status: ${price.status || 'Unverbindlich'}`,
    '', 'NACHRICHT', contact.message || '-',
    '', 'Hinweis: Dies ist eine unverbindliche Anfrage. Die kostenpflichtige Nutzung beginnt nur nach ausdrücklicher Vereinbarung.'
  ].join('\n');

  MailApp.sendEmail({
    to: SETTINGS.NOTIFICATION_EMAIL,
    subject: `Neue Website-Konfiguration: ${contact.company || project.industry || 'Projekt'} – ${contact.name || 'Kontakt'}`,
    body,
    replyTo: contact.email || undefined,
    name: 'pimentaGROUP Konfigurator'
  });
}

function safeCell(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function formatEuro(value) {
  return Number(value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function jsonResponse(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
