# PanelShelf 2.1 – automatischer Link-Import

Diese Version baut auf PanelShelf 2.0.1 auf und behält die bestehende Supabase-Verbindung.

## Neue Funktion
Im Formular gibt es jetzt **„Infos aus Link erkennen“**. PanelShelf versucht, Seitentitel, Coverbild und Kapitelnummer aus öffentlichen Seiten-Metadaten (Open Graph/Twitter Cards/HTML-Titel) und aus dem Link selbst zu lesen. Die erkannten Angaben werden in die Formularfelder eingesetzt und können vor dem Speichern geändert werden.

## Wichtige Einschränkungen
- Das ist ein Best-Effort-Import, keine Garantie für jede Leseseite.
- Seiten, die Login, JavaScript-Rendering, Anti-Bot-Schutz oder Scraping-Sperren verwenden, liefern oft keine Daten.
- Die Kapitelnummer wird nur erkannt, wenn sie im Link oder in den auslesbaren Seitentexten vorkommt.
- Die Funktion überwacht keine Seiten im Hintergrund und meldet keine neuen Kapitel automatisch.

## WICHTIG: Bereitstellung
**Diese Version enthält eine Netlify Function. Ein einfacher ZIP-Upload über Netlify Drop reicht für Functions nicht zuverlässig aus.** Die Website muss über ein mit Netlify verbundenes GitHub-Repository bereitgestellt werden (oder über Netlify CLI).

### Für die iPhone-Einrichtung (GitHub + Netlify)
1. Erstelle bei GitHub ein neues, leeres Repository.
2. Lade alle Inhalte dieses ZIP-Ordners in das Repository hoch. Achte darauf, dass `index.html`, `netlify.toml` und der Ordner `netlify/functions/import-metadata.js` im Hauptverzeichnis liegen.
3. In Netlify: **Add new project → Import an existing project → GitHub**, wähle dieses Repository.
4. Build command leer lassen; Publish directory `.` eintragen. Netlify erkennt die Function anhand von `netlify.toml`.
5. Verbinde das neue Projekt nicht als Ersatz, bevor es getestet wurde. Um die bestehende Website-Adresse zu behalten, muss anschließend die Domain `euphonious-dasik-4ebe69.netlify.app` in den Domain-Einstellungen des neuen Projekts zugewiesen werden. Eine Netlify-Adresse kann nur einem Projekt gleichzeitig zugeordnet sein.

Wenn du lieber das bestehende Projekt behalten willst, verbinde dessen Deploy-Einstellungen mit dem GitHub-Repository (Project configuration/Build & deploy/Continuous deployment). Bitte nicht parallel eine zweite Live-Seite als endgültige Lösung verwenden.

## Datenbank
Keine neue SQL-Migration erforderlich. Die vorhandene `manhua_entries`-Tabelle und die 2.0-Spalten bleiben unverändert.

## Sicherheit
Es wird kein Supabase-Service-Role-Schlüssel benötigt. Der Import-Endpunkt liest nur die vom Nutzer eingegebene öffentliche URL.
