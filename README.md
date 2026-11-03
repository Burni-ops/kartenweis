# Kartenweis

**Die Welt entdecken, Karte für Karte.**

Kartenweis ist ein Geografie-Lernspiel für Browser und Android. Statt Flaggen auswendig zu lernen, entdeckst du Länder über ihre Hauptstädte, Regionen, Städte, Flüsse, Seen, Meere, Meerengen, Nachbarn und Rekorde — direkt auf einer interaktiven Weltkarte.

## Status

**M5 (Welt + Android-Build).** Die Weltkarte läuft im Browser und als Android-App.

- **193 Länder** auf sechs Kontinenten
- **4.038 Regionen** für 187 Länder
- **1.162 Fakten** (58 kuratiert + 1.104 generiert)
- **620 Karten-Reveals** für Flüsse, Seen, Meere, Meerengen, Städte und Gipfel
- Quiz-Modus mit Multiple Choice, Drag-to-Map, Land- und Region-Antippen
- Länder-Atlas, Mastery, Erfolge, Tages-Challenge, Onboarding, Sound und Einstellungen
- Offline-fähige PWA und Android-App über Capacitor

![Weltkarte mit Kontinent-Auswahl](docs/m4-world.png)

Weitere Eindrücke: [Länder-Steckbrief China](docs/m4-country-china.png) · [Länder-Atlas China](docs/m4-atlas-china.png) · [Quiz-Run](docs/m4-quiz.png) · [Region-Frage](docs/m4-region.png) · [Region-Auflösung](docs/m4-region-reveal.png) · [Meer-Auflösung](docs/m4-sea-reveal.png) · [Sammlung](docs/m4-collection.png) · [Onboarding](docs/m3-onboarding.png) · [Einstellungen](docs/m3-settings.png)

## Lokal im Browser starten

Voraussetzung: **Node.js 22 oder neuer** und npm.

```bash
git clone https://github.com/Burni-ops/kartenweis.git
cd kartenweis
npm install
npm run dev
```

Öffne anschließend <http://localhost:5173>.

### Produktions-Build lokal testen

```bash
npm run build
npm run preview
```

Öffne <http://localhost:4173>. Der Build ist eine PWA und kann nach dem ersten Laden offline weiterlaufen.

## Alle npm-Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungs-Server mit Hot Reload starten |
| `npm run build` | TypeScript prüfen und Produktions-Build nach `dist/` erzeugen |
| `npm run preview` | Produktions-Build lokal testen |
| `npm run check` | TypeScript + Datenvalidierung + Unit-Tests |
| `npm run test` | Unit-Tests (Vitest) |
| `npm run e2e` | Browser-Tests (Playwright, benötigt Chrome) |
| `npm run validate` | Länder, Regionen, Fakten, Reveals und Flaggen prüfen |
| `npm run data` | Natural-Earth-Karten, Fakten und Reveals neu erzeugen |
| `npm run data:reference` | Wikidata- und Weltbank-Referenzdaten neu abrufen |
| `npm run data:flags` | Länderflaggen von flagcdn laden |
| `npm run android:sync` | Web-Build erzeugen und nach `android/` synchronisieren |
| `npm run android:build` | Debug-APK über Gradle bauen |
| `npm run docker:build` | Docker-Image lokal bauen |
| `npm run docker:up` | Docker-Compose-Stack starten |

## Android

Die App läuft über **Capacitor 7** in einer Android-WebView. Das native Projekt liegt in `android/`.

Voraussetzungen:

- **JDK 21** (`JAVA_HOME`)
- **Android SDK 35** mit Platform 35 und Build-Tools 35 (`ANDROID_HOME`)

```bash
npm run android:sync
npm run android:build
```

Das APK liegt danach unter:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Die Zurück-Taste schließt zuerst Dialoge, den Atlas, den Run oder die Länderauswahl, bevor sie die App verlässt. Safe Areas werden über `env(safe-area-inset-*)` berücksichtigt.

## Desktop (PWA)

Kartenweis wird als **PWA** auf dem Desktop installiert — dafür ist kein separates Electron-/Tauri-Bundle nötig. In Chrome oder Edge:

1. Kartenweis im Browser öffnen (lokal, GitHub Pages oder eigene Domain).
2. In der Adressleiste **Installieren** bzw. **App installieren** wählen.
3. Die App startet danach als eigenes Fenster, offline und mit eigenem Icon.

Updates kommen über den Service Worker (Web) bzw. als neues APK (Android). Beim Start prüft die App zusätzlich die neueste GitHub-Release und zeigt bei Bedarf einen Update-Hinweis.

## Docker / Homeserver

Für den Betrieb auf einem Homeserver liegt ein Multi-Stage-Dockerfile mit nginx bei.

```bash
docker compose up -d --build
```

Danach ist Kartenweis unter <http://localhost:8080> erreichbar. Das Image wird zusätzlich über GitHub Actions nach GHCR veröffentlicht:

```bash
docker pull ghcr.io/burni-ops/kartenweis:latest
```

Für eine eigene Domain empfiehlt sich ein Reverse Proxy (Caddy, Traefik, nginx) mit HTTPS. Die App benötigt keine Datenbank und keine Server-Runtime.

## Update-Prüfung

Beim Start fragt Kartenweis die neueste GitHub-Release ab und zeigt einen Hinweis, wenn eine neuere Version verfügbar ist. Die Prüfung ist auf sechs Stunden gecacht und funktioniert nur, wenn das Repository öffentlich ist (die GitHub-API liefert bei privaten Repositories `404`).

Für private Repositories oder eigene Update-Feeds kann beim Build eine URL gesetzt werden:

```bash
VITE_UPDATE_FEED=https://example.com/kartenweis/latest.json npm run build
```

Format der Datei:

```json
{
  "version": "0.2.0",
  "url": "https://github.com/Burni-ops/kartenweis/releases/tag/v0.2.0",
  "notes": "Neue Fakten und Karten-Verbesserungen."
}
```

Der Repository-Name für die GitHub-Prüfung lässt sich ebenfalls überschreiben:

```bash
VITE_GITHUB_REPO=Burni-ops/kartenweis npm run build
```

## GitHub-Releases

Releases werden über einen Git-Tag ausgelöst:

```bash
git tag -a v0.1.0 -m "Kartenweis v0.1.0"
git push origin main --tags
```

Die GitHub-Action **Release** baut dann automatisch:

- den Web-Build als ZIP
- ein installierbares Android-APK
- die GitHub-Release-Seite mit Download-Links

Details und optionales Signing stehen in [`docs/RELEASING.md`](docs/RELEASING.md).

### Repository erstmalig verbinden

```bash
git remote add origin https://github.com/Burni-ops/kartenweis.git
git push -u origin main
```

Danach unter **Settings → Actions → General** sicherstellen, dass Workflows Schreibrechte für Releases haben. Für GitHub Pages zusätzlich **Settings → Pages → Source: GitHub Actions** wählen.

## GitHub Pages (optional)

Die Action **Deploy Web** veröffentlicht den Web-Build auf GitHub Pages. Aktiviere im Repository unter **Settings → Pages → Source** die Option **GitHub Actions**. Der Build berücksichtigt den Repository-Namen automatisch als Basis-Pfad.

## Daten & Lizenzen

- **Natural Earth 1:10m** (Public Domain): Länder, Regionen, Flüsse, Seen, Meere, Städte
- **Wikidata** (CC0): Hauptstädte und höchste Punkte
- **World Bank Open Data** (CC BY 4.0): Einwohner und Fläche
- **flagcdn.com**: Flaggen
- **MapLibre GL JS**, **React**, **Vite**, **Tailwind CSS**, **Capacitor**: Open Source

Die Datenpipeline liegt in `tools/`. Rohdaten werden nicht eingecheckt; die erzeugten Dateien liegen in `public/data/`. Details stehen in [`RESEARCH.md`](RESEARCH.md).

## Datenschutz

Kartenweis hat keine Konten, keine Werbung und kein Tracking. Fortschritt und Einstellungen werden ausschließlich lokal im Browser bzw. auf dem Gerät gespeichert. Weitere Informationen in [`PRIVACY.md`](PRIVACY.md).

## Projektstruktur

```text
src/
  app/          App-Shell, Runs, Modi
  components/   CountrySheet, QuestionCard, Atlas, Sammlung, Einstellungen
  map/          MapLibre-View, Layer, Interaktion, Reveals
  data/         Typen, Loader, Kontinent-Metadaten
  game/         QuestionEngine, Scoring, Atlas, Erfolge, Daily
public/
  data/         countries.json, world.geojson, world-regions.geojson, Fakten, Reveals
  flags/        SVG-Flaggen
tools/          Datenaufbau, Referenzdaten und -validierung
android/        Capacitor-Android-Projekt
deploy/         nginx-Konfiguration für Docker
e2e/            Playwright-Tests
docs/           Screenshots und Release-Dokumentation
.github/        CI-, Pages-, Docker- und Release-Workflows
```

## Roadmap

- [x] M0: Fundament, Karte, Datenpipeline
- [x] M1: Vertical Slice mit Quiz und Reveals
- [x] M2: Atlas, Mastery, Erfolge, Daily
- [x] M3: Europa komplett, Onboarding, Sound, Einstellungen
- [x] M4: Welt, 193 Länder, 4.038 Regionen, 1.162 Fakten
- [x] M5: Capacitor-Android-Build
- [ ] Playtest auf echten Geräten und Content-QA

Der vollständige Plan steht in [`PLAN.md`](PLAN.md).

## Lizenz

MIT — siehe [`LICENSE`](LICENSE).
