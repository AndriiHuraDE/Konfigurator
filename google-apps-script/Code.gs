/**
 * pimentaGROUP Website-Konfigurator
 * Speichert vollständige Konfigurationen in Google Sheets und sendet optional eine E-Mail.
 * Das Script muss an eine Google-Tabelle gebunden sein.
 */
const SETTINGS = {
  NOTIFICATION_EMAIL: '', // Empfangsadresse eintragen, z. B. kontakt@ihre-domain.de
  SHEET_NAME: 'Website-Anfragen'
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(raw);

    // Einfacher Honeypot-Spamschutz
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
      'Projektart', 'Basispreis EUR', 'Ziel', 'Design', 'Seiten', 'Zusatzseiten',
      'Website-Funktionen', 'KI-Funktionen', 'Betreuung', 'Einmalig gesamt EUR',
      'Monatlich EUR', 'Zeitrahmen', 'Bestehende Website', 'Beratung gewünscht',
      'Nachricht', 'Vollständige Anfrage (JSON)'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#27322d')
        .setFontColor('#ffffff');
      sheet.autoResizeColumns(1, headers.length);
    }

    const p = data.project || {};
    const c = data.contact || {};
    const features = (p.features || []).map(x => typeof x === 'string' ? x : `${x.name || x.id} (${x.price || 0} EUR)`);
    const aiFeatures = (p.aiFeatures || []).map(x => typeof x === 'string' ? x : `${x.name || x.id} (${x.setupPrice || 0} EUR)`);
    const care = p.carePlan || {};
    const pricing = p.pricing || {};

    const row = [
      new Date(), safeCell(c.name), safeCell(c.company), safeCell(c.email), safeCell(c.phone),
      safeCell(p.industry), safeCell(p.type), Number(p.basePrice || 0), safeCell(p.mainGoal),
      safeCell(p.designStyle), safeCell((p.pages || []).join(', ')), Number(p.extraPages || 0),
      safeCell(features.join(', ')), safeCell(aiFeatures.join(', ')), safeCell(care.name),
      Number(pricing.oneTimeTotal || 0), Number(pricing.monthlyTotal || 0),
      safeCell(c.timeframe), safeCell(c.currentWebsite), p.adviceRequested ? 'Ja' : 'Nein',
      safeCell(c.message), JSON.stringify(data)
    ];
    sheet.appendRow(row);

    // Benachrichtigung ist optional. Die Anfrage bleibt auch ohne E-Mail in der Tabelle gespeichert.
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

function sendNotification(data) {
  const p = data.project || {};
  const c = data.contact || {};
  const pricing = p.pricing || {};
  const care = p.carePlan || {};
  const featureLines = (p.features || []).map(x => `- ${x.name || x.id}: ${formatEuro(x.price || 0)} einmalig`);
  const aiLines = (p.aiFeatures || []).map(x => `- ${x.name || x.id}: ${formatEuro(x.setupPrice || 0)} einmalig`);

  const body = [
    'Eine neue Website-Konfiguration ist eingegangen.',
    '', 'KONTAKT',
    `Name: ${c.name || '-'}`,
    `Unternehmen: ${c.company || '-'}`,
    `E-Mail: ${c.email || '-'}`,
    `Telefon: ${c.phone || '-'}`,
    '', 'PROJEKT',
    `Projektart: ${p.type || '-'}`,
    `Branche: ${p.industry || '-'}`,
    `Ziel: ${p.mainGoal || '-'}`,
    `Design: ${p.designStyle || '-'}`,
    `Seiten: ${(p.pages || []).join(', ') || '-'}`,
    `Zusätzliche Seiten: ${p.extraPages || 0}`,
    '', 'WEBSITE-FUNKTIONEN',
    ...(featureLines.length ? featureLines : ['- Keine ausgewählt']),
    '', 'KI & AUTOMATISIERUNG',
    ...(aiLines.length ? aiLines : ['- Keine ausgewählt']),
    '', 'KOSTENÜBERSICHT',
    `Basispreis: ${formatEuro(p.basePrice || 0)}`,
    `Einmalig gesamt: ${formatEuro(pricing.oneTimeTotal || 0)}`,
    `Monatlich: ${formatEuro(pricing.monthlyTotal || 0)}`,
    `Betreuung: ${care.name || 'Keine'}`,
    '', 'WEITERE ANGABEN',
    `Zeitrahmen: ${c.timeframe || '-'}`,
    `Bestehende Website: ${c.currentWebsite || '-'}`,
    `Persönliche Beratung gewünscht: ${p.adviceRequested ? 'Ja' : 'Nein'}`,
    `Nachricht: ${c.message || '-'}`,
    '', 'Die vollständige Konfiguration ist im Google-Tabellenblatt gespeichert.'
  ].join('\n');

  MailApp.sendEmail({
    to: SETTINGS.NOTIFICATION_EMAIL,
    subject: `Neue Website-Anfrage: ${p.type || 'Projekt'} – ${c.name || 'Kontakt'}`,
    body: body,
    replyTo: c.email || undefined,
    name: 'pimentaGROUP Konfigurator'
  });
}

function safeCell(value) {
  const text = String(value == null ? '' : value);
  // Verhindert, dass Nutzereingaben in Google Sheets als Formel ausgeführt werden.
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
