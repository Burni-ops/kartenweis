# Contributing

Danke für dein Interesse an Kartenweis!

## Entwicklung

```bash
npm install
npm run dev
```

Vor einem Pull Request:

```bash
npm run check
npm run e2e
npm run build
```

## Daten ändern

- Karten- und Faktenlogik liegt in `tools/`.
- Neue kuratierte Fakten gehören in `public/data/facts/europe.json` (bestehendes Format).
- Generierte Daten werden mit `npm run data` neu erzeugt und sollten nicht manuell editiert werden.
- Quellen und Lizenzen in `RESEARCH.md` ergänzen.

## Code-Stil

- TypeScript strict, keine `any`-Umgehungen ohne Grund.
- Neue UI-Texte auf Deutsch, bestehende Begriffe konsistent halten.
- Kleine, fokussierte Commits.

## Fehler melden

Bitte Issue mit Repro-Schritten, Browser/Android-Version und Screenshot anlegen.
