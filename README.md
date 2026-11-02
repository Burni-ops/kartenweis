# Spasmitflaggen

Geografie-Spiel für den Browser — später Android. Länder werden nicht über Flaggen, sondern über ihre Orte, Landschaften und Rekorde entdeckt.

**Aktueller Stand: M1 (Vertical Slice).** Die Europa-Karte läuft im Browser, Länder und DACH-Regionen lassen sich antippen. Der Quiz-Modus ist spielbar: Multiple Choice, Drag-to-Map, Land antippen, Bundesland/Kanton antippen sowie Fragen zu Meeren und Meerengen. Fortschritt und Mastery werden lokal gespeichert.

![Europa-Karte mit ausgewähltem Deutschland](docs/m0-map.png)

Weitere Eindrücke: [Quiz-Run](docs/m1-run.png) · [Feedback](docs/m1-feedback.png) · [Meerengen-Frage](docs/m1-strait.png)

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
- Einwohner und Fläche aus World-Bank-/Wikidata-Referenzdaten (2023)
- 58 kuratierte Fakten für 10 Länder, inkl. Meere und Meerengen

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

## Nächste Schritte (M2)

- Länder-Atlas mit interaktiver Karte und Fakten-Details
- Mastery-Anzeige, Länder-Sterne und Erfolge
- Tages-Challenge
- Weitere Länder und Fakten (Europa komplett)

Der vollständige Plan steht in [`PLAN.md`](PLAN.md).
