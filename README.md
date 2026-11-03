# pimentaGROUP – Website-Konfigurator (Sales-Pipeline-Version)

Deutschsprachiger, responsiver Website-Konfigurator für Friseursalons, Nagelstudios und Massage-/Wellnessstudios in Deutschland.

## Geschäftsmodell laut Sales-Pipeline

- Individuelle Website-Erstellung: **0 €**.
- **2 Monate kostenlose Testphase** für alle vorab vereinbarten Funktionen.
- Nach der Testphase entscheidet der Kunde, ob er fortsetzen möchte.
- Keine automatische kostenpflichtige Verlängerung. Ein kostenpflichtiges Abonnement beginnt nur nach ausdrücklicher Vereinbarung.
- Abgerechnet wird monatlich für Website-Betrieb und ausgewählte Dienstleistungen, nicht als einmaliger Verkauf der Website.

## Preislogik – bitte intern freigeben

Die Pipeline nennt ca. **120 €/Monat** lediglich als vorläufigen Richtwert für ein mögliches Gesamtpaket. Sie enthält keine finalen Einzelpreise. Daher sind die im Konfigurator hinterlegten Modulpreise **Vorschlagswerte zur Aufteilung dieses Richtwerts**, keine genehmigte Preisliste und kein verbindliches Angebot.

Der Grunddienst ist im Vorschlag mit 35 €/Monat kalkuliert. Die Salon-Empfehlung wählt die im Pipeline-Konzept genannten Kernleistungen:

- Online-Terminbuchung: 19 €/Monat
- WhatsApp-Kontakt-Button: inklusive
- WhatsApp-Chatbot: 19 €/Monat
- Mitarbeiter- & Terminverwaltung: 15 €/Monat
- KI-Website-Chatbot: 19 €/Monat
- Lokale SEO-Grundlagen: 9 €/Monat
- Instagram-Integration: 4 €/Monat

Zusammen mit dem Basisdienst ergibt dies **120 €/Monat** nach der kostenlosen Testphase. Diese Einzelbeträge sind ein nachvollziehbarer Kalkulationsvorschlag und müssen von der Geschäftsführung bestätigt oder geändert werden.

Alle weiteren Module sind optionale Erweiterungen. Gebühren externer Anbieter (Buchungsplattform, WhatsApp/Meta, KI-API, Telefonie, CRM, Newsletter, Zahlungsabwicklung, Premium-Domains usw.) sind nicht pauschal enthalten und müssen vor Vertragsabschluss geprüft sowie separat ausgewiesen werden. Preisangaben netto/brutto sind ebenfalls im finalen Angebot festzulegen.

Preise zentral bearbeiten: `js/configurator.js` – `BASE_MONTHLY` und `FEATURES`.

## Projektstruktur

- `index.html` – Konfigurator und Live-Vorschau
- `css/styles.css` – Layout und Darstellung
- `js/configurator.js` – Auswahl, schematische Website-Vorschau, Richtpreis-Kalkulation, Anfrage-Payload
- `google-apps-script/Code.gs` – optionaler Google-Sheets- und E-Mail-Empfang
- `impressum.html` / `datenschutz.html` – rechtliche Informationen mit noch zu bestätigenden Betriebs-/Hostingangaben

## Lokal testen

`index.html` im Browser öffnen. Ohne eingerichteten Versand-Endpunkt wird beim Absenden eine JSON-Datei exportiert; die Anfrage wird dann **nicht automatisch** an pimentaGROUP übermittelt.

Optional:

```bash
python -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Google Sheets / Apps Script einrichten

1. Eine neue Google-Tabelle erstellen.
2. In dieser Tabelle **Erweiterungen → Apps Script** öffnen.
3. Den Inhalt aus `google-apps-script/Code.gs` einfügen.
4. In `SETTINGS.NOTIFICATION_EMAIL` die interne Empfangsadresse eintragen (optional).
5. **Bereitstellen → Neue Bereitstellung → Web-App** wählen; Ausführen als „Ich“. Zugriff entsprechend dem geplanten Einsatz festlegen.
6. Web-App bereitstellen, Berechtigungen erteilen und die URL mit `/exec` kopieren.
7. In `js/configurator.js` `CONFIG.FORM_ENDPOINT` mit dieser URL befüllen.
8. Eine Testanfrage absenden und im Blatt `Website-Anfragen` sowie im E-Mail-Postfach kontrollieren.

Technischer Hinweis: Der Browser nutzt `no-cors`, deshalb kann der Client die tatsächliche Serverantwort nicht auslesen. Eine Erfolgsmeldung bestätigt nicht die dauerhafte Speicherung; die erste Testanfrage muss manuell in Google Sheets kontrolliert werden.

## Rechtliche Freigabe vor öffentlichem Betrieb

Die Dateien enthalten die bisher gespeicherten Anbieterangaben und beschreiben die tatsächlich ausgelieferte, externe-ressourcenfreie Konfigurator-Fassung. Sie sind **keine anwaltlich geprüfte Freigabe**. Vor Veröffentlichung müssen insbesondere bestätigt bzw. ergänzt werden:

- Tatsächliche Rechtsperson und ggf. Rechtsform/Vertretung von pimentaGROUP.
- Tatsächlicher Hosting-Anbieter, Server-Logdaten, Speicher- und Löschfristen.
- Ob Google Apps Script tatsächlich aktiviert wird; falls ja: tatsächliche Google-Konfiguration, Datenempfänger, Auftragsverarbeitungsvereinbarung, Speicherfristen und ggf. Drittlandtransfer.
- Tatsächliche Netto-/Bruttopreis-Darstellung und externe Anbietergebühren.
- Welche Drittanbieter für Online-Terminbuchung, WhatsApp, KI, CRM, Newsletter, Karten oder sonstige Integrationen im Einzelfall eingesetzt werden.

Die rechtlichen Seiten bleiben deshalb zunächst `noindex`. Die Datenschutzerklärung darf nach Aktivierung zusätzlicher Dienste nicht unverändert weiterverwendet werden.
