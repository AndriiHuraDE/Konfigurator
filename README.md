# pimentaGROUP Website-Konfigurator

Deutschsprachiger Konfigurator mit großem Live-Preview, einer einzigen scrollbareren Funktionsleiste und einer festen Preisleiste nach dem Tesla-Prinzip.

## Dateien

- `index.html` – zwei kurze Einstiegsfragen und die Konfigurator-Oberfläche
- `css/styles.css` – Desktop-/Mobile-Layout, Preview-Szenen, Responsivität und Animationen
- `js/configurator.js` – Funktionsauswahl, Preislogik, Live-Preview, Kontaktformular und JSON-Export
- `google-apps-script/Code.gs` – optionaler Eingang in Google Sheets und E-Mail-Benachrichtigung

Im Paket sind bewusst keine Impressum- oder Datenschutzseiten enthalten. Diese werden separat an einer passenden Stelle ergänzt.

## Bedienung

1. Branche auswählen: Friseursalon/Barbershop, Nagelstudio, Massage/Wellness oder anderer Betrieb.
2. Angeben, ob bereits eine Website vorhanden ist.
3. Im Konfigurator rechts die gewünschten Funktionen auswählen. Die linke Preview wechselt passend zur Kategorie.
4. Der neu hinzugefügte Bereich wird in der Preview langsam angefahren und anschließend mit einem expandierenden Rahmen hervorgehoben.
5. Im Bereich Smartphone kann der sichtbare Scrollbalken direkt am Mockup gezogen werden; zusätzlich funktionieren Mausrad und Touch-Scroll.
6. Mit `i` lassen sich ausführliche Funktionsdetails öffnen.
7. Die feste untere Preisleiste zeigt die Gesamtsumme nach den zwei kostenlosen Monaten.
8. Über „Konfiguration anfragen“ öffnet sich das Kontaktformular als Dialog.

## Live-Preview

- **Website:** echte Inhaltsmodule, zum Beispiel Galerie, Bewertungen, Karte, FAQ, Blog, Shop und Newsletter.
- **Smartphone:** mobile Darstellung mit eigenen Modulen für Buchung, Team, WhatsApp-Kontakt und Formular.
- **Social Media:** getrennte Vorschauen für Instagram, Facebook, TikTok und LinkedIn. Die Markenlogos sind inline-SVGs; es findet keine Anmeldung bei den Plattformen statt.
- **KI & Automatisierung:** kompakte, einzelne Produktvorschauen für Website-Chatbot, WhatsApp-Bot, Anfrage-Assistent, E-Mail, CRM, Telefonie und Workflow.
- **Sichtbarkeit & Sprachen:** visuelle Beispiele für lokale SEO und Sprachumschaltung.

Die Social-Profile selbst können kostenlos als Links ausgewählt werden. Die monatlichen 4 € bei „Instagram-Integration“ beziehen sich auf die Darstellung ausgewählter Instagram-Beiträge auf der Website, nicht auf die laufende Betreuung des Social-Media-Kanals.

## Preislogik

- Erstellung der Website: **0 €**.
- Erste **2 Monate kostenlos** für die vereinbarten Funktionen.
- Fester Basis-Service „Website, Hosting & Basis-Support“: **35 €/Monat**, standardmäßig ausgewählt und nicht abwählbar.
- Weitere Module: monatliche Zusatzpreise gemäß Konfigurator.
- Die Preisangaben sind weiterhin vorläufige Richtwerte und noch nicht intern freigegeben. Ein kostenpflichtiger Vertrag entsteht ausschließlich nach einem individuellen Angebot und ausdrücklicher Zustimmung.

Preise und Module werden am Anfang von `js/configurator.js` verwaltet: `BASE_MONTHLY`, `FEATURES` und `PRICE_STATUS`.

## Anfrageempfang über Google Sheets

Ohne eingerichteten Endpunkt exportiert das Kontaktformular die vollständige Konfiguration als JSON-Datei. Es wird dann nichts automatisch an pimentaGROUP übermittelt.

Zum Einrichten:

1. Eine Google-Tabelle erstellen.
2. In der Tabelle **Erweiterungen → Apps Script** öffnen.
3. Den gesamten Inhalt aus `google-apps-script/Code.gs` einfügen.
4. Optional `SETTINGS.NOTIFICATION_EMAIL` auf eine Empfangsadresse setzen.
5. Als Web-App bereitstellen (Ausführen als: Ich; Zugriff: Jeder, soweit für das Konto verfügbar).
6. Die bereitgestellte `/exec`-URL in `js/configurator.js` bei `CONFIG.FORM_ENDPOINT` eintragen.
7. Eine Testanfrage absenden und Tabellenblatt sowie E-Mail-Eingang kontrollieren.

Der Browser nutzt `no-cors`; eine Client-Erfolgsmeldung ist kein Beweis für die Speicherung durch Google. Die erste Testanfrage muss im Tabellenblatt geprüft werden.

## Wichtige Grenzen

- Social-Media-Vorschauen sind Demo-Oberflächen ohne Live-Feed oder Plattform-Anmeldung.
- KI-Vorschauen zeigen beispielhafte Abläufe; es sind noch keine KI-Dienste verbunden.
- Externe Plattformgebühren, KI-API-Verbrauch, Telefonie-Minuten, WhatsApp-/Meta-Kosten, Hosting-Mehrkosten und CRM-Lizenzen sind nicht pauschal enthalten und werden projektbezogen geprüft.
- Das KI-Chat-Widget ist außerhalb des Demo-Footers an das sichtbare Preview-Fenster gebunden, damit es beim Zurückwechseln zur Website nicht in die Footer-Zeile rutscht.
