# Datenschutz

Kartenweis ist ein Offline-freundliches Lernspiel.

## Was gespeichert wird

- **Fortschritt:** beantwortete Fakten, Mastery, XP, Runs, Erfolge, Tages-Challenge und besuchte Länder.
- **Einstellungen:** Sound, reduzierte Bewegung, Schwierigkeit, Onboarding-Status.

Diese Daten werden ausschließlich lokal auf deinem Gerät gespeichert:

- im Browser über `localStorage`
- in der Android-App in der WebView-Datenablage der App
- in der Windows-App im lokalen Electron-Profil

## Was nicht gespeichert oder übertragen wird

- keine Namen, E-Mail-Adressen oder Konten
- keine Standortdaten
- keine Werbe- oder Analyse-IDs
- kein Tracking
- keine Übertragung des Fortschritts an einen Server

## Hosting und Server-Logs

Wenn Kartenweis über GitHub Pages oder einen eigenen Server/Docker-Container geöffnet wird, kann der Hosting-Anbieter technische Zugriffsdaten (z. B. IP-Adresse, Zeitpunkt, User-Agent) in Server-Logs verarbeiten. Das ist für den sicheren Betrieb erforderlich und unabhängig von Kartenweis. Es werden keine Analyse- oder Werbedienste eingebunden.

Die Android- und Windows-App bündeln die Spieldaten lokal und benötigen für den Betrieb keinen eigenen Kartenweis-Server.

## Externe Ressourcen

Beim ersten Laden werden Karten-, Fakten- und Flaggen-Daten von der Webseite geladen, von der du Kartenweis öffnest. Die Android- und Windows-App bündeln diese Daten lokal. Es werden keine personenbezogenen Daten an Dritte gesendet.

Beim Start prüft Kartenweis optional die neueste GitHub-Release-Version. Dabei wird lediglich die öffentliche GitHub-API (`api.github.com`) abgefragt; es werden keine Fortschritts- oder Gerätedaten übertragen. Bei einem privaten Repository wird die Prüfung übersprungen.

## KI-Unterstützung

Teile der Code- und Datenaufbereitung wurden mit KI-Unterstützung erstellt und anschließend geprüft. Die App erzeugt keine KI-Bilder, -Stimmen oder -Videos. Inhalte sind eigenständig formuliert; Angaben ohne Gewähr.

## Löschen

Der Fortschritt kann in der App unter **Sammlung → Fortschritt löschen** zurückgesetzt werden. Beim Löschen der App-Daten bzw. der Browser-Website-Daten werden alle lokal gespeicherten Informationen entfernt.

## Kontakt

Für Fragen oder Fehlerberichte nutze bitte die Issues im GitHub-Repository.
