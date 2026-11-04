# pimentaGROUP Website-Konfigurator

Tesla-inspirierter, deutschsprachiger Website-Konfigurator mit großem Live-Preview, unabhängig scrollender Optionsleiste, Abschnittsnavigation und fixer Preisleiste.

## Geschäftsmodell
- Individuelle Website-Erstellung: 0 €.
- Zwei Monate kostenlose Testphase für die vereinbarten Leistungen.
- Website, Hosting & Basis-Support: 35 €/Monat nach der Testphase; fest ausgewählt und nicht abwählbar.
- Zusätzliche Website-, KI- und Sichtbarkeitsmodule werden als monatliche Richtwerte ausgewiesen.
- Social-Media-Profil-Einrichtung: 5 € einmalig je ausgewähltem Profil.
- Instagram-Integration ist eine Website-Funktion: 4 €/Monat. Sie zeigt einen eigenen Instagram-Beitragsbereich auf Desktop und Smartphone.
- Kostenlose Mobiloptimierung ist fest ausgewählt und nicht abwählbar. Die Smartphone-Vorschau zeigt dieselben ausgewählten Inhalte und Module in einem responsiven Layout.
- Ein kostenpflichtiger Vertrag entsteht ausschließlich nach einem individuellen Angebot und ausdrücklicher Zustimmung.

Alle Preise sind vorläufige Orientierungswerte und müssen intern freigegeben werden. Externe Kosten für Hosting-Anbieter, Domains, Buchungssysteme, Telefonie, CRM, KI-APIs oder Plattformen können je nach Projekt zusätzlich anfallen.

## Interaktion und Vorschau
- Der Einstieg fragt nur Branche und aktuellen Website-Status ab.
- Website, Mobil, Social Media, KI sowie Sichtbarkeit & Sprachen sind über eine Abschnittsnavigation erreichbar.
- Die Live-Vorschau folgt der aktiven Position in der Optionsleiste; die Abschnitte werden per Scroll-Snap sauber angesteuert.
- Beim Hinzufügen eines Moduls scrollt die passende Vorschau langsam zum neuen Modul. Erst danach erhält genau dieses Modul einen expandierenden weißen Fokusrahmen.
- Die Scrollbewegung wird über eine einzelne `requestAnimationFrame`-Animation gesteuert. Währenddessen wird CSS-Smooth-Scrolling temporär deaktiviert, damit sich keine zweite Browseranimation darüberlegt.
- Der Fokusrahmen wird über eine CSS-Pseudoebene des Zielmoduls ausgelöst. Es wird kein zusätzliches Element über die Vorschau gelegt.
- Die Smartphone-Vorschau enthält einen eigenen Scrollbereich. Die untere Smartphone-Navigation bleibt außerhalb dieses Scrollbereichs fixiert; der sichtbare Scrollbalken gehört zum Smartphone selbst.
- Website-Chatbot und WhatsApp-Aktionen liegen innerhalb der Desktop- bzw. Smartphone-Vorschau und sind vertikal angeordnet, damit sie sich nicht überlappen.
- Social-Media-Profile verwenden eingebettete SVG-Markenlogos. Die Einrichtung kostet 5 € je ausgewähltem Profil einmalig.
- Die Schaltfläche „Empfohlene Auswahl“ lädt das Demo-Paket mit 120 €/Monat und 5 € einmaliger Instagram-Profil-Einrichtung.

## Lokale Vorschau
Projektstruktur beibehalten und `index.html` über einen lokalen Webserver öffnen:

```bash
python -m http.server 8000
```

Danach `http://localhost:8000` öffnen.

## Google Sheets und E-Mail
1. Neue Google-Tabelle erstellen.
2. Erweiterungen → Apps Script öffnen.
3. `google-apps-script/Code.gs` vollständig einfügen.
4. Optional `SETTINGS.NOTIFICATION_EMAIL` setzen.
5. Als Web-App bereitstellen und die `/exec`-URL kopieren.
6. Die URL in `js/configurator.js` bei `CONFIG.FORM_ENDPOINT` eintragen.
7. Eine Testanfrage senden und die Speicherung in Google Sheets sowie den E-Mail-Eingang prüfen.

Der Browser sendet an Apps Script im `no-cors`-Modus. Daher kann die Website die tatsächliche Speicherung nicht selbst bestätigen; die erste Testanfrage muss im Sheet kontrolliert werden. Ohne eingerichteten Endpunkt wird die vollständige Konfiguration als JSON-Datei exportiert.

## Preise bearbeiten
Alle Preiswerte befinden sich in `js/configurator.js`:
- `BASE_MONTHLY`
- `PROFILE_SETUP_ONCE`
- `FEATURES`
- `PRICE_STATUS`

## Dateien
- `index.html` – Einstieg, Vorschau-Szenen und Optionsleiste
- `css/styles.css` – responsives Design, Vorschau und Animationen
- `js/configurator.js` – Auswahl, Live-Preview, Preisberechnung, Navigation und Formular
- `google-apps-script/Code.gs` – optionaler Empfang in Google Sheets und per E-Mail

## Aktuelle UI-Korrekturen
- Instagram-Integration befindet sich unter Website und erscheint als eigener Website-Abschnitt auf Desktop und Smartphone.
- Social-Media-Profile kosten 5 € einmalig je ausgewähltem Profil; die Instagram-Website-Integration kostet separat 4 €/Monat.
- KI- und WhatsApp-Aktionen sind innerhalb der Desktop- bzw. Smartphone-Vorschau verankert und vertikal gestapelt.
- Die Smartphone-Aktionen liegen innerhalb des Gerätebildschirms; die untere Navigation bleibt fixiert.
- Die Vorschau nutzt pro Szene einen expliziten Scroll-Container. Nach dem langsamen Scrollen wird das neue Modul mit einem expandierenden weißen Fokusrahmen markiert.
- Die Abschnittsnavigation wird auch nach dem Ende einer Scrollbewegung aktualisiert.
- Die empfohlene Auswahl ergibt 120 €/Monat nach der kostenlosen Testphase sowie 5 € einmalig für das Instagram-Profil.
