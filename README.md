# pimentaGROUP Website-Konfigurator

## Lokal starten

Im Projektordner `Konfigurator` einen lokalen Webserver starten:

```bash
python -m http.server 8000
```

Danach `http://localhost:8000` im Browser öffnen.

## Projektdateien

- `index.html` – Einstieg, Live-Vorschau, Optionsauswahl und Anfrageformular
- `css/styles.css` – Gestaltung und responsive Layouts
- `js/configurator.js` – Konfiguratorlogik, Auswahlzustand, Vorschau und Preise
- `img/` – lokal eingebundene Teamfotos
- `STOCK_PHOTO_LICENSES.md` – Quellen und Lizenzhinweise zu den verwendeten Stockfotos
- `google-apps-script/Code.gs` – optionaler Empfang von Anfragen über Google Apps Script

## Anfrageformular verbinden

In `js/configurator.js` die Konstante `CONFIG.FORM_ENDPOINT` mit der bereitgestellten Google-Apps-Script-Web-App-URL befüllen. Ohne Endpunkt wird die Konfiguration lokal als JSON-Datei exportiert.

## Preise anpassen

Die Preiswerte befinden sich in `js/configurator.js` (`BASE_MONTHLY`, `PROFILE_SETUP_ONCE` und `FEATURES`). Alle Beträge sind vorläufige Richtwerte und müssen vor Veröffentlichung intern bestätigt werden.
