# Spasmitflaggen

Geografie-Spiel für den Browser — später Android. Länder werden nicht über Flaggen, sondern über ihre Orte, Landschaften und Rekorde entdeckt.

**Aktueller Stand: M0 (Fundament).** Die Europa-Karte läuft im Browser, Länder lassen sich antippen, DACH-Regionen (Bundesländer/Kantone) werden angezeigt und hervorgehoben. Der Quiz-Modus folgt in M1.

![Europa-Karte mit ausgewähltem Deutschland](docs/m0-map.png)

## Schnellstart

```bash
npm install
npm run dev
```

Öffne <http://localhost:5173>.

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Vite-Dev-Server starten |
| `npm run build` | TypeScript prüfen und Produktions-Build erzeugen |
| `npm run preview` | Produktions-Build lokal testen |
| `npm run data` | Kartendaten aus Natural Earth neu erzeugen |
| `npm run validate` | Datenbestand prüfen (Länder, Regionen, Flaggen) |
| `npm run test` | Unit-Tests (Vitest) |
| `npm run e2e` | Browser-Tests (Playwright, systemweites Chrome) |
| `npm run check` | TypeScript + Datenvalidierung + Unit-Tests |

## Stack

- **React 19 + TypeScript + Vite**
- **MapLibre GL JS** für interaktive Vektorkarten
- **Tailwind CSS 4** für das UI
- **Vitest + Playwright** für Tests
- **Capacitor** ist für die spätere Android-Hülle vorgesehen

## Daten

Die Karten und Basisdaten werden aus **Natural Earth 1:10m** (Public Domain) erzeugt:

- Länderpolygone (Europa, 45 Länder inkl. Kosovo)
- Admin-1-Regionen für Deutschland, Österreich und die Schweiz
- Hauptstädte aus dem Natural-Earth-Layer „Populated Places“
- Einwohner und Fläche aus den Natural-Earth-Attributen bzw. der Geometrie

Die Pipeline liegt in `tools/build-data.ts` und wird mit `npm run data` ausgeführt. Rohdaten liegen in `data/raw/` (nicht im Repo), die erzeugten Dateien in `public/data/`.

Flaggen: [flagcdn.com](https://flagcdn.com/) (freie Nutzung, Attribution im Credits-Screen vorgesehen).

## Projektstruktur

```
src/
  app/          App-Shell und Datenladen
  components/   CountrySheet, spätere QuestionCard, HUD, …
  map/          MapLibre-View, Layer, Interaktion
  data/         Typen und Loader
  game/         Geo-Mathematik, später QuestionEngine/Scoring
public/
  data/         countries.json, Europa-GeoJSON, DACH-Regionen
  flags/        SVG-Flaggen
tools/          Datenaufbau und -validierung
e2e/            Playwright-Tests
docs/           Screenshots
```

## Nächste Schritte (M1)

- QuestionEngine: Multiple Choice, Drag-to-Map, Tap-the-Country, **Tap-the-Region (Bundesland/Kanton)**
- Run-Screen mit 10 Fragen, Punkte, Streak, Feedback
- Erste 10 Länder mit geprüften Fakten
- Speichern von Fortschritt und Mastery

Der vollständige Plan steht in [`PLAN.md`](PLAN.md).
