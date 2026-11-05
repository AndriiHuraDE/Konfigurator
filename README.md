# pimentaGROUP Website-Konfigurator – Version 14

Tesla-inspirierter Website-Konfigurator mit großer Live-Vorschau, unabhängig scrollender Optionsleiste, Abschnittsnavigation und fixer Preisleiste.

## Geschäftsmodell
- Individuelle Website-Erstellung: 0 €.
- Zwei Monate kostenlose Testphase für die vereinbarten Leistungen.
- Website, Hosting & Basis-Support: 35 €/Monat nach der Testphase; fest ausgewählt und nicht abwählbar.
- Zusätzliche Website-, KI- und Sichtbarkeitsmodule werden als monatliche Richtwerte ausgewiesen.
- Social-Media-Profil-Einrichtung: 5 € einmalig je ausgewähltem Profil.
- Instagram-Integration ist eine Website-Funktion: 4 €/Monat. Sie erscheint als eigener Beitragsbereich auf Desktop und Smartphone.
- Kostenlose Mobiloptimierung ist fest ausgewählt und nicht abwählbar. Die Smartphone-Vorschau zeigt dieselben Website-Module wie die Desktop-Vorschau in einem schmalen responsiven Layout.
- Ein kostenpflichtiger Vertrag entsteht ausschließlich nach einem individuellen Angebot und ausdrücklicher Zustimmung.

Alle Preise sind vorläufige Orientierungswerte und müssen intern freigegeben werden. Externe Kosten für Hosting-Anbieter, Domains, Buchungssysteme, Telefonie, CRM, KI-APIs oder Plattformen können je nach Projekt zusätzlich anfallen. Der Richtwert für die empfohlene Auswahl beträgt 120 €/Monat nach der Testphase; ein ausgewähltes Instagram-Profil kostet zusätzlich 5 € einmalig.

## Interaktion und Live-Vorschau
- Der Einstieg fragt nur nach Branche und aktuellem Website-Status.
- Website, Mobil, Social Media, KI sowie Sichtbarkeit & Sprachen sind über die Abschnittsnavigation erreichbar.
- Die Live-Vorschau folgt der aktiven Position in der Optionsleiste; die Optionen scrollen unabhängig vom Preview.
- Website-Module werden direkt als echte Vorschau-Abschnitte aufgebaut, nicht als bloße Funktionslabels.
- Die Smartphone-Ansicht übernimmt dieselben Desktop-Module aus dem DOM, versieht sie mit eigenen IDs und passt sie per CSS an die Gerätebreite an.
- Der Smartphone-Bildschirm hat einen eigenen Scrollbereich und einen sichtbaren, ziehbaren Scrollbalken. Die untere Smartphone-Navigation bleibt außerhalb des scrollenden Inhalts fixiert.
- Website-Chatbot und WhatsApp-Aktionen liegen in einem vertikalen Stack innerhalb des Preview-Fensters. Der Footer reserviert Platz für Social-Icons und überlappt die Floating-Aktionen nicht.
- WhatsApp-Links sind inklusive `:visited` und `:hover` explizit gestaltet, damit keine blauen Browser-Standardlinks erscheinen.
- Social-Media-Profile nutzen eingebettete SVG-Markenlogos. Die Einrichtung kostet 5 € je ausgewähltem Profil einmalig.
- Die Instagram-Website-Integration kostet separat 4 €/Monat und wird im Website-Bereich ausgewählt.

## Modul-Animationen
- Beim Hinzufügen wird das neue Modul mit einer kurzen Slide-in-/Fade-in-Animation von links eingeblendet.
- Bereits vorhandene Module verschieben sich mit einer FLIP-Animation an ihre neue Position, sodass das Layout weich Platz schafft.
- Nach dem Einfügen scrollt die Vorschau kontrolliert und langsam zum neuen Modul. Die Bewegung wird mit einer einzelnen `requestAnimationFrame`-Animation gesteuert; CSS-Smooth-Scrolling wird währenddessen temporär deaktiviert, damit keine zweite Scroll-Animation konkurriert.
- Beim Entfernen fährt das Modul nach links aus und blendet gleichzeitig aus. Anschließend rücken die verbleibenden Module weich zusammen.
- Die Animationen berücksichtigen `prefers-reduced-motion` bei der Scrollbewegung.

## Empfohlene Auswahl
Die Schaltfläche „Empfohlene Auswahl“ lädt das Demo-Paket mit 120 €/Monat und 5 € einmaliger Instagram-Profil-Einrichtung. Die Preise sind Richtwerte und kein verbindliches Angebot.

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

Impressum und Datenschutzerklärung sind in dieser Version absichtlich nicht enthalten.


## Version 12.0 – Korrekturen
- WhatsApp-Kontaktkarte und WhatsApp-Business-Demo erhalten ein vollständig gekapseltes Styling ohne blaue Browser-Links.
- Floating Chat-/WhatsApp-Aktionen werden als vertikaler Stack mit Abstand dargestellt; Social-Icons im Footer behalten eine eigene, freie Zone.
- Website-, AI- und SEO-Module verwenden einheitliche, langsamere Ein-/Ausblend- und FLIP-Bewegungen.
- Die Vorschau scrollt bei hinzugefügten Modulen mit einer längeren, kontrollierten Animation zum Ziel.

## Version 12 – Korrekturen
- WhatsApp- und Chat-Widget respektieren jetzt zuverlässig das `hidden`-Attribut. Bei ausgewähltem WhatsApp-Kontakt erscheint ausschließlich das WhatsApp-Symbol; das Chat-Widget bleibt dem KI-Website-Chat vorbehalten.
- Hinzufügen und Entfernen scrollt gezielt im jeweiligen Vorschaufenster zum betroffenen Baustein. Beim Entfernen erfolgt das Scrollen, solange der Baustein noch vorhanden ist.
- Das Scrollen in der Vorschau dauert jetzt 1,55 Sekunden; die Verschiebung der übrigen Website-Bausteine wurde auf 860 ms verlängert.
- KI-Karten erscheinen mit der umgekehrten Links-und-Ausblenden-Animation der bestehenden Löschbewegung.
- Der leere Social-Media-Zustand zeigt die vier Plattform-Icons nebeneinander in einer stabilen, zentrierten Reihe.
- Die obligatorische Smartphone-Darstellung heißt jetzt „Mobile Website-Ansicht“. Die Desktop-Bausteine werden weiterhin vollständig in die mobile Website übernommen; die Option wird als „Immer enthalten“ statt mit wiederholten Kostenlos-Labels dargestellt.


## Version 13 – Reflow, WhatsApp und Responsive-Feinschliff

- Preview-Module behalten beim Aktualisieren ihre DOM-Elemente; dadurch werden Positionsänderungen aller betroffenen Geschwister zuverlässig per FLIP animiert.
- Entfernte Module erhalten nur die eigene Links-/Fade-out-Animation. Die verbleibenden Module schließen den freien Platz über eine einzelne Positionsanimation; es gibt keine zusätzliche Höhen-/Skalierungsanimation des Containers.
- Der WhatsApp-Floating-Button verwendet ein einzelnes gefülltes WhatsApp-Markenzeichen, ist exakt zentriert und wird unabhängig vom Website-Chatbot ein- bzw. ausgeblendet.
- Die Floating-Actions werden anhand der tatsächlichen Kanten der Demo-Website positioniert, nicht anhand des äußeren Preview-Rahmens.
- Kostenlose Zusatzfunktionen werden in der Optionsliste mit „0 €“ ausgewiesen.
- Kleine Displays erhalten verbesserte Mindestgrößen und lesbarere Options-/Preiszeilen.


## Version 14 – Animationen, Scroll-Verhalten und Responsive-Feinschliff

- Das Optionspanel verwendet kein verpflichtendes Scroll-Snap mehr. Lange Funktionslisten – insbesondere im ersten Website-Abschnitt – lassen sich vollständig innerhalb des Panels durchscrollen, ohne ungewollt zum nächsten Abschnitt zu springen.
- Die Navigation per Abschnittsschaltfläche wechselt die Vorschau sofort zum Zielbereich. Beim programmgesteuerten Scrollen durch dazwischenliegende Abschnitte wird die Vorschau nicht mehr kurzzeitig auf jede Zwischenkategorie umgeschaltet.
- Vorschau-Scrollbewegungen werden einzeln per `requestAnimationFrame` ausgeführt und bei manueller Bedienung (Mausrad, Touch oder Pointer) sofort abgebrochen.
- Das FLIP-Verfahren verwendet beim Hinzufügen Inhaltskoordinaten und beim Entfernen sichtbare Viewport-Koordinaten. Dadurch werden Scrollbewegungen nicht als Layoutverschiebung fehlinterpretiert; insbesondere wird ein browserseitiges Begrenzen von `scrollTop` nach dem Entfernen berücksichtigt.
- Beim Hinzufügen wird zuerst die Vorschau zum neuen Modul bewegt; erst danach laufen Slide-in und die gleichzeitige Positionsänderung betroffener Module. So ist die Einblendung auch bei tiefer liegenden Modulen sichtbar.
- Layoutverschiebungen laufen mit 720 ms und einer ruhigeren Ease-in-out-Kurve. Die eigenständige Links-/Fade-out-Animation des entfernten Moduls bleibt erhalten.
- KI-Karten werden in einer stabilen einspaltigen Vorschau dargestellt. Mehrfach schnelle Auswahlklicks werden nacheinander verarbeitet, statt während einer laufenden Animation verloren zu gehen.
- Social-, Website- und Sichtbarkeitsvorschau verwenden dieselbe scrollsichere Übergangslogik.
- Doppelte Scroll-Listener am Smartphone-Bildschirm wurden entfernt. `prefers-reduced-motion` wird bei den JavaScript-Animationen berücksichtigt.
- Getestet in Chromium bei 320, 360, 390, 768, 1024 und 1440 px Breite: kein horizontaler Seitenüberlauf. Zusätzlich wurden schnelles Hinzufügen, Entfernen mittlerer Elemente, manuelles Unterbrechen des automatischen Scrollens und reduzierte Bewegung geprüft.
