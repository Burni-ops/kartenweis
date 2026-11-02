# Spasmitflaggen — Detailplan (v0.1)

> **Arbeitstitel:** „Spasmitflaggen“ (der Ordnername passt nicht mehr, weil es nicht um Flaggen geht).
> **Status:** Plan zur Abstimmung — es wurde noch kein Spielcode geschrieben.
> **Ziel:** Ein Geografie-Spiel für den Browser (Desktop + Smartphone), später als native Android-App.

---

## 0. In einem Satz

Ein Geografie-Spiel, das Länder nicht über Flaggen, sondern über ihre **Orte, Landschaften und Rekorde** erlebbar macht: Im **Geo-Run** beantwortet man endlos generierte Fragen und zieht Symbole an die richtige Stelle auf der Karte; im **Länder-Atlas** entdeckt man alle Fakten eines Landes auf einer interaktiven Karte.

---

## 1. Vision

Geografie-Lernspiele sind oft entweder trocken (Karte + Beschriftung) oder reine Flaggen-Quizze. Dieses Spiel soll die **räumliche Neugier** in den Mittelpunkt stellen:

- „Wo ist der höchste Berg von Deutschland?“ → Berg-Symbol auf die Zugspitze ziehen.
- „Welcher Fluss ist der längste in Frankreich?“ → 4 Antworten, danach zeigt die Karte den Fluss.
- „Welches Land grenzt nicht an Österreich?“ → 4 Länder, danach leuchtet die Grenze auf.
- „Was gibt es in Portugal zu entdecken?“ → interaktive Länderkarte mit Städten, Flüssen, Bergen und Wahrzeichen.

**Das Spiel soll sich wie ein Quiz anfühlen, aber wie ein Atlas lehren.**

---

## 2. Design-Prinzipien

1. **Die Karte ist das Interface.** Jede Frage hat einen räumlichen Bezug; jede Auflösung zeigt etwas auf der Karte.
2. **Lernen durch Spielen.** Nach jeder Antwort gibt es einen kurzen „Wusstest du?“-Fakt und die richtige Position.
3. **Endlos, aber nicht zufällig.** Fragen werden aus einem geprüften Faktenpool generiert und an den Lernstand angepasst.
4. **Kurze Sessions.** Ein Standard-Run dauert ca. 2 Minuten und passt in eine Busfahrt.
5. **Sofort verständlich.** Kein Login, kein langes Tutorial, keine Strafe für Neugier.
6. **Fair bleibt fair.** Kartenfragen geben genug Kontext (Nachbarn, Flüsse, Relief), damit man raten *kann*, aber nicht raten *muss*.
7. **Schön, aber schnell.** Klare Vektorkarten, weiche Animationen, keine überladenen Screens.

---

## 3. Zielgruppe & Rahmen

- **Zielgruppe:** Geografie-Interessierte, Familien, Schülerinnen und Schüler, Quizfans. Kein Fachwissen nötig.
- **Alter:** ca. 10+; keine Gewalt, keine Werbung, keine Accounts in v1.
- **Plattformen:**
  - **v1:** Browser (Chrome/Firefox/Safari/Edge), Desktop + Mobile, Touch + Maus.
  - **v2:** Android (gleiche Codebasis), später ggf. iOS.
- **Session-Länge:** Run 1–3 Minuten; Atlas-Besuch 2–10 Minuten.
- **Sprache:** Deutsch zuerst; alle Texte mehrsprachig strukturiert (EN später).
- **Offline:** Nach dem ersten Laden im Browser offline spielbar (PWA/Service Worker); Android komplett offline.

---

## 4. Die zwei Spielmodi

### 4.1 Modus A: „Geo-Run“ (Hauptmodus)

**Idee:** Wie „Flaggen aller Länder“, aber mit geografischen Fakten und einer echten Karte.

#### Ablauf

1. **Kontinent wählen** (Europa, später Asien, Afrika, Nordamerika, Südamerika, Ozeanien).
2. **Run startet** mit 10 Fragen (Standard) oder Endlosmodus.
3. **Frage beantworten** — je nach Typ: 4 Antworten, Symbol ziehen, Land/Region antippen, Marker wählen.
4. **Sofortiges Feedback:** richtig/falsch, Punkte, Streak, Karte zoomt zum Ort, Mini-Fakt.
5. **Ergebnis:** Punktzahl, Trefferquote, beste Serie, neu gelernte Fakten, XP, Länder-Fortschritt.
6. **Buttons:** „Nochmal“, „Anderer Kontinent“, „Fakten ansehen“.

#### Fragetypen (Version 1)

| Typ | Interaktion | Beispiel | Besonderheit |
|---|---|---|---|
| **Multiple Choice** | 4 Antwort-Buttons | „Was ist der längste Flussabschnitt in Deutschland?“ → Rhein / Donau / Elbe / Main | Schnell, gut für Fakten ohne eindeutigen Kartenpunkt |
| **Drag-to-Map** | Symbol auf Karte ziehen | „Wo liegt die Zugspitze?“ → Berg-Symbol | Präzisionswertung nach Distanz, Toleranz je nach Maßstab |
| **Tap-the-Country** | Land auf Kontinentkarte antippen | „Wo liegt Portugal?“ | Wie im Flaggen-Spiel, aber mit Länderform statt Flagge |
| **Tap-the-Region** | Bundesland/Kanton/Region auf der Länderkarte antippen | „Wo liegt Bayern?“ | Regionen ohne Beschriftung; Treffer wird hervorgehoben |
| **Marker wählen** | 4 Marker auf der Karte | „Welcher Marker zeigt den höchsten Berg Österreichs?“ | Kein Ziehen, gut für kleine Displays |
| **Vergleich / Reihenfolge** *(v1.1)* | 2 Antworten oder Sortieren | „Welcher Fluss ist länger: Loire oder Donau?“ | Endlos-Variante aus Zahlenwerten |

#### Beispiel-Fragen pro Kategorie

- **Hauptstadt:** „Wie heißt die Hauptstadt von Deutschland?“ / „Ziehe Berlin an die richtige Stelle.“
- **Städte:** „Welche ist die größte Stadt der Schweiz?“ → Zürich (nicht Bern).
- **Flüsse:** „Welcher Fluss fließt nicht durch Deutschland?“ → Donau / Rhein / Elbe / **Po**.
- **Berge:** „Wie heißt der höchste Berg Österreichs?“ → Großglockner.
- **Seen:** „Welcher See liegt in Italien?“ → Gardasee.
- **Sehenswürdigkeiten:** „Wo steht das Brandenburger Tor?“ → Berlin ziehen.
- **Extreme:** „Wo liegt der tiefste Punkt Deutschlands?“ → Neuendorf-Sachsenbande.
- **Nachbarn:** „Welches Land grenzt nicht an Österreich?“ → Schweiz / Italien / **Frankreich** / Ungarn.
- **Bundesländer & Regionen:** „Wo liegt Bayern?“ → auf der Deutschlandkarte antippen; „Welches Bundesland ist markiert?“ → 4 Namen.
- **Meere:** „Welches Meer liegt zwischen Europa und Afrika?“ → Mittelmeer; „An welches Meer grenzt Polen?“ → Ostsee.
- **Meerengen:** „Welche Meerenge trennt Spanien von Marokko?“ → Straße von Gibraltar; „Welche Meerenge liegt in Istanbul?“ → Bosporus.
- **Verkehr:** „Wie lang ist die A7 ungefähr?“ → ca. 960 km.
- **Vergleich:** „Welcher Berg ist höher: Zugspitze oder Großglockner?“

> Hinweis: Bei mehrdeutigen Fakten (z. B. „längster Fluss Deutschlands“) wird die Frage präzise formuliert („längster Flussabschnitt innerhalb Deutschlands“) und die Quelle angezeigt.

#### Punkte, Streak & Feedback

- **Basis:** 100 Punkte × Schwierigkeit (1–4).
- **Streak:** ab 3 richtigen Antworten Multiplikator bis ×2,0; Anzeige als Flamme.
- **Präzision (Drag):** Perfekt / Sehr gut / Knapp / Daneben — abhängig von der Distanz in km, skaliert mit der Landesgröße.
- **Tempo:** kleiner Bonus, aber kein Zeitdruck im Standardmodus.
- **Feedback:** 1,5–2 Sekunden Overlay mit richtiger Antwort, Distanz („Du warst 87 km daneben“), Mini-Fakt und Karten-Zoom.
- **Interaktive Karten-Auflösung:** Nach jeder Antwort wird das Ziel sichtbar: Punkt (Stadt/Berg/Wahrzeichen), Linie (Fluss), Fläche (See/Meer/Meerenge), Region oder Land. Die Karte zoomt kurz zum Objekt, zeigt ein Label und lässt die Markierung bis „Weiter“ stehen.
- **Kein Leben-Verlust im Standard-Run.** Fehler kosten nur Punkte und Streak, nicht den Run.
- **Endlosmodus:** 3 Leben, steigende Schwierigkeit, Highscore.

#### Run-Formate

| Format | Länge | Regeln | Zweck |
|---|---|---|---|
| **Standard-Run** | 10 Fragen | Keine Leben, Streak, Punktzahl | Einstieg & Lernen |
| **Endlos** | offen | 3 Leben, steigende Schwierigkeit | Herausforderung & Highscore |
| **Tages-Challenge** | 10 Fragen | Gleicher Seed für alle, 1 Versuch pro Tag | Retention, Vergleich |
| **Länder-Run** *(später)* | 10 Fragen | Nur ein Land | Gezieltes Üben |

---

### 4.2 Modus B: „Länder-Atlas“ (Lernmodus)

**Idee:** Ein interaktiver Länder-Steckbrief — alles, was man über ein Land geografisch wissen kann, an einem Ort.

#### Ablauf

1. **Kontinent wählen** → Länderliste oder Kontinentkarte.
2. **Land wählen** → Länderkarte + Steckbrief.
3. **Layer umschalten:** Städte, Flüsse, Seen, Berge, Sehenswürdigkeiten, Nachbarn.
4. **Marker antippen** → Detailkarte mit Name, Fakten, „Wusstest du?“, Quelle.
5. **Kategorien durchblättern** → alle Fakten als Karten.
6. **„Dieses Land üben“** → startet einen Länder-Run.

#### Inhalte einer Länder-Seite

- **Kopf:** Flagge, Name, Kontinent, Einwohner, Fläche, Hauptstadt, Sprachen, Währung.
- **Interaktive Karte:** Länderform, Nachbarländer, Flüsse, Seen, Berge, Städte, Sehenswürdigkeiten.
- **Schnellfakten:** höchster Berg, längster Fluss, größter See, längste Küste, größte Stadt, tiefster Punkt.
- **Kategorien-Tabs:**
  - Steckbrief
  - Städte
  - Flüsse & Seen
  - Berge & Gebirge
  - Sehenswürdigkeiten
  - Natur & Extreme
  - Nachbarn & Grenzen
  - Regionen (nur wo sinnvoll, z. B. Bundesländer/Kantone)
- **Lernfortschritt:** Gesehene Fakten werden markiert; „gelernt“ nach mehreren richtigen Antworten.
- **Mini-Karte:** zeigt das Land auf dem Kontinent.

#### Warum das wichtig ist

Der Atlas ist nicht nur Nachschlagewerk, sondern **die Belohnung für den Quiz**: Wer eine Frage falsch hatte, kann sie hier nachschauen. Wer ein Land „meistern“ will, lernt die Fakten im Atlas und übt sie im Run.

---

## 5. Fakten- & Fragen-System

### 5.1 Kategorien (Vorschlag zur Abstimmung)

| # | Kategorie | Beispielfragen | Datenquelle (geplant) | v1-Priorität |
|---|---|---|---|---|
| A | **Steckbrief / Basisdaten** | Hauptstadt, Einwohner, Fläche, Sprachen, Währung, Kontinent | UN, World Bank, Wikidata | **P0** |
| B | **Städte** | Hauptstadt, größte Stadt, Top-5-Städte | Natural Earth, Wikidata | **P0** |
| C | **Flüsse** | längster Flussabschnitt, Quelle/Mündung, Nebenflüsse | Natural Earth, Wikidata, Wikipedia | **P0** |
| D | **Berge & Gebirge** | höchster Berg, höchster Vulkan, bekannteste Gebirge, tiefster Punkt | Natural Earth Peaks, Wikidata | **P0** |
| E | **Seen, Küsten & Inseln** | größter See, tiefster See, längste Küste, größte Insel | Natural Earth Lakes, Wikidata | **P1** |
| M | **Meere & Meerengen** | „Welches Meer liegt zwischen Europa und Afrika?“, „Welche Meerenge trennt Spanien von Marokko?“ | Natural Earth Marine, kuratiert | **P0/P1** |
| F | **Sehenswürdigkeiten** | Wahrzeichen, UNESCO-Stätten, Naturwunder | kuratiert + Wikipedia | **P0/P1** |
| G | **Natur & Extreme** | größte Wüste, längster Strand, heißester/kältester Ort | kuratiert | **P1** |
| H | **Nachbarn & Grenzen** | Anzahl Nachbarn, längste/kürzeste Grenze, „grenzt nicht an“ | Natural Earth, Wikidata | **P0** |
| I | **Verkehr & Infrastruktur** | längste Autobahn, größter Flughafen, längste Brücke | kuratiert | **P2** |
| J | **Bundesländer & Regionen** | „Wo liegt Bayern?“, „Welches Bundesland ist markiert?“, Kantone, Provinzen | Natural Earth Admin-1, Wikidata | **P0 für DACH**, danach P1 |
| K | **Flagge** | Farben, Symbolik | Wikipedia/Wikidata | **P2** (Bonus) |
| L | **Geschichte & Kultur** | Unabhängigkeit, berühmte Persönlichkeit | Wikipedia | **P3** (optional) |

**Vorschlag für v1:** A, B, C, D, F, H vollständig; J für DACH (Deutschland, Österreich, Schweiz) als neuer Tap-Fragetyp; M für Meere & Meerengen; E und G als „Extras“ pro Land; I, K, L später.

### 5.2 Frage-Generator

Fragen werden nicht als fertige Sätze gespeichert, sondern zur Laufzeit aus **Fakten + Templates** gebaut:

```
Fakt (z. B. „Zugspitze, 2962 m, DE, Kategorie Berge“)
  + Template („Wo liegt {Berg}?“)
  + Interaktion (Drag)
  + Distraktoren (andere Berge im selben Land/Kontinent)
  → konkrete Frage
```

**Vorteile:**

- Ein Fakt erzeugt viele Fragevarianten (direkt, rückwärts, Vergleich, Karte, „Welches Land?“).
- Distraktoren werden dynamisch und plausibel gewählt.
- Neue Länder brauchen nur Fakten, keine handgeschriebenen Fragen.
- Später leicht übersetzbar.

**Frage-Familien (geplant):**

1. **Direkt:** „Wie heißt die Hauptstadt von {Land}?“
2. **Rückwärts:** „{Stadt} ist die Hauptstadt von …?“
3. **Karte:** „Wo liegt {Ort}?“ (Drag/Tap)
4. **Länder-Identifikation:** „Welches Land ist markiert?“ (Tap)
5. **Region finden:** „Wo liegt {Bundesland/Kanton}?“ (Tap-Region)
6. **Region identifizieren:** „Welches Bundesland ist markiert?“ (4 Antworten)
7. **Vergleich:** „Welcher Berg ist höher: {A} oder {B}?“
8. **Ausschluss:** „Welcher dieser Flüsse fließt nicht durch {Land}?“
9. **Reihenfolge:** „Sortiere diese Flüsse nach Länge.“
10. **Richtig/Falsch:** „{Aussage}“ — mit generierten wahren/falschen Varianten.
11. **Welches Land:** „In welchem Land liegt {Berg/See/Wahrzeichen}?“
12. **Nachbarn:** „Welches Land grenzt nicht an {Land}?“

### 5.3 „Unendlich“ — wie das funktioniert

- **Fakt-Basis:** Ziel ca. 25–40 Fakten pro Land. Bei 195 Ländern ≈ 5.000–8.000 Fakten.
- **Varianten:** 12 Frage-Familien × 2–4 Interaktionen × wechselnde Distraktoren.
- **Kombinatorik:** Vergleichs- und Ausschlussfragen entstehen aus der Datenbank selbst und sind nahezu unbegrenzt.
- **Adaptive Auswahl:** ungesehene und häufig falsch beantwortete Fakten kommen öfter; beherrschte Fakten seltener.
- **Ehrliche Einordnung:** „Unendlich“ heißt hier „faktisch unendlich viele Fragezusammenstellungen“ — der inhaltliche Pool wächst mit jedem Kontinent-Update. Innerhalb eines Runs wiederholt sich keine Frage.

### 5.4 Schwierigkeit & Fairness

- **Fakt-Schwierigkeit 1–4:** Hauptstadt = 1; längster Fluss = 2; höchster Berg / Wahrzeichen = 3; seltene Extreme = 4.
- **Adaptive Auswahl:** ca. 60 % auf/über dem Spielerniveau, 20 % Wiederholung, 20 % neu.
- **Distraktoren-Regeln:**
  - gleiche Kategorie und gleicher Kontinent,
  - plausible Größenordnung (Einwohner 0,3–3×, Höhe ±1.500 m, Länge ±50 %),
  - nie die richtige Antwort, keine Duplikate, keine offensichtlich absurden Optionen.
- **Drag-Fairness:**
  - Karte zeigt Nachbarländer, Flüsse, Seen und sanftes Relief,
  - keine Beschriftung der gesuchten Position,
  - Toleranz abhängig von Landesgröße und Zoom,
  - nach der Antwort wird die exakte Position gezeigt.
- **Regionen-Fairness:**
  - Regionsgrenzen sind sichtbar, aber die gesuchte Region ist nicht beschriftet,
  - kleine Regionen (z. B. Berlin, Hamburg, Bremen) bekommen eine größere Trefferfläche,
  - nach der Antwort wird die Region eingefärbt, benannt und ihr Verwaltungssitz gezeigt.
- **Keine Fangfragen:** mehrdeutige Fakten werden präzise formuliert oder mit Hinweis versehen.

### 5.5 Lernen & Mastery

- Pro Fakt wird gespeichert: gesehen, richtig, falsch, Mastery-Stufe 0–5.
- **Richtig:** +1 (max. 5); **falsch:** −1 (min. 0).
- **Gewichtung für die Auswahl:** `1 + (5 − Mastery) × 2`; zuletzt falsch beantwortete Fakten zusätzlich ×1,5.
- **Länder-Fortschritt:** Anteil der Fakten mit Mastery ≥ 4.
- **Kontinent-Fortschritt:** Durchschnitt der Länder.
- **Atlas:** zeigt pro Fakt ein Häkchen, wenn es mindestens einmal richtig beantwortet wurde.

---

## 6. Karten-System

### 6.1 Karten & Layer

**Drei Kartentypen:**

1. **Weltkarte** — Kontinent-Auswahl, Überblick, spätere „Alle Kontinente“-Runs.
2. **Kontinentkarte** — Länder antippen, Länder-Runs, Atlas-Einstieg.
3. **Länderkarte** — Quiz-Drag-Ziele und Atlas-Detailansicht.

**Layer:**

| Layer | Inhalt | Quiz | Atlas |
|---|---|---|---|
| Landfläche | Länderpolygone, farblich nach Kontinent/Land | ✓ | ✓ |
| Nachbarländer | graue Flächen + Namen | ✓ | ✓ |
| Regionen | Bundesländer/Kantone/Provinzen als Flächen, ohne Beschriftung im Quiz | ✓ (Tap) | ✓ |
| Grenzen | Linien, Hervorhebung bei Antwort | ✓ | ✓ |
| Relief | sanfte Höhenschattierung (Natural Earth) | ✓ (dezent) | ✓ |
| Flüsse | Linienzüge, wichtige Namen | ✓ | ✓ |
| Seen | Flächen | ✓ | ✓ |
| Meere & Meerengen | Meeresflächen, Meerengen-Linien und Namen | ✓ | ✓ |
| Berge | Gipfel-Marker + Höhe | ✓ | ✓ |
| Städte | Punkte + Namen, Hauptstadt besonders | ✓ | ✓ |
| Sehenswürdigkeiten | Icon-Marker | ✓ | ✓ |
| Marker | interaktive Ziele, Pins, Distanzlinien | ✓ | ✓ |

### 6.2 Interaktion

- **Pan & Zoom:** Mausrad, Ziehen, Pinch-to-Zoom, Doppeltipp; Trägheit; begrenzt auf die Karten-Bounding-Box.
- **Hit-Testing:** Punkt-in-Polygon für Länder und Regionen; nächster Treffer innerhalb einer Pixel-Toleranz für Flüsse/Städte/Berge.
- **Drag & Drop:** Symbol folgt dem Finger; beim Loslassen wird die Position in Längen-/Breitengrad umgerechnet und die Distanz zum Ziel per Haversine berechnet.
- **Karten-Feedback:** Ziel pulsiert, Distanzlinie, „Du warst hier“-Pin, automatischer Zoom auf die richtige Stelle.
- **Labels:** nur bei ausreichendem Zoom, Kollisionsvermeidung, keine Labels, die die Antwort verraten.
- **Touch-Ziele:** mindestens 44 × 44 px; Drag-Symbole größer als der sichtbare Icon.

### 6.3 Datenpipeline

**Prinzip:** Keine ungeprüften Rohdaten und keine riesigen GeoJSON-Dateien im Startpaket. Die Daten werden beim Build vorbereitet, vereinfacht und pro Kontinent/Land lazy geladen.

```
Natural Earth (Shapefiles)
        │
        ▼
Node/TypeScript-Build-Skript
  ├─ Länder auswählen / ISO-Codes normalisieren
  ├─ Admin-1-Regionen (Bundesländer, Kantone, Provinzen) zuordnen
  ├─ Polygone mit mapshaper vereinfachen (Toleranz je Zoomstufe)
  ├─ Löcher, Inseln und Mehrfachpolygone behandeln
  ├─ Bounding-Boxen, Zentroide, Label-Punkte berechnen
  ├─ Flüsse/Seen/Berge/Städte zuordnen
  ├─ optional: PMTiles für die Welt-/Kontinentkarte
  └─ pro Land + Kontinent eine kompakte GeoJSON-Datei
        │
        ▼
App lädt GeoJSON per fetch (lazy) in MapLibre GL JS
```

**Geplante Dateien:**

- `public/data/countries.json` — Stammdaten aller Länder.
- `public/data/maps/world.geojson` — Weltkarte (vereinfacht).
- `public/data/maps/{continent}.geojson` — Kontinentkarte.
- `public/data/maps/country/{code}.geojson` — Länderkarte mit Layern.
- `public/data/facts/{continent}.json` — Fakten, nach Kontinent gruppiert (lazy load).
- `public/fonts/glyphs/` — lokal erzeugte MapLibre-Glyphen (Latein + Umlaute).

**Größenziele:**

- Kontinentkarte: < 500 KB (gzip).
- Länderkarte: < 150 KB (gzip).
- Initiales JS/CSS ohne Kartendaten: < 500 KB (gzip); Kartendaten kommen lazy dazu.
- Web-Start: < 3 s auf 4G, < 1 s aus dem Service-Worker-Cache.

### 6.4 Gestaltung

- **Grundlook:** moderner Atlas — warmes Papier, tiefes Marineblau, frische Akzente (Türkis, Koralle, Gold).
- **Karte:** weiche Länderfarben, klare Grenzen, dezentes Relief, keine unnötigen Linien.
- **Icons:** einheitliches Linien-Icon-Set (Berg, Fluss, Stadt, See, Wahrzeichen, Grenze, Flagge).
- **Typografie:** eine karakterstarke Display-Schrift für Überschriften, eine gut lesbare UI-Schrift (beide OFL-lizenziert).
- **Animation:** Pin-Drop, Puls am Ziel, Konfetti bei Serie, sanfter Karten-Zoom, Kartenwechsel.
- **Sound:** 6–8 dezente SFX (Tick, Erfolg, Fehler, Serie, Run-Ende); Musik optional und standardmäßig leise/aus.

---

## 7. Fortschritt & Metagame

| Element | Beschreibung |
|---|---|
| **XP & Level** | XP für Runs und richtige Antworten; kosmetische Titel (Entdecker → Kartograf → Globetrotter). |
| **Länder-Mastery** | 0–3 Sterne pro Land, abhängig vom Anteil gemeisterter Fakten. |
| **Kontinent-Fortschritt** | Prozentanzeige auf der Kontinent-Auswahl. |
| **Streak** | Tages-Streak (Tage in Folge gespielt) + Run-Streak (richtige Antworten in Folge). |
| **Erfolge** | ca. 20 zum Start, z. B. „Perfekte Runde“, „10er-Serie“, „Zugspitze gefunden“, „Europa entdeckt“. |
| **Sammlung** | Alle Länder als Atlas; noch nicht besuchte Länder als Silhouette. |
| **Tages-Challenge** | Täglicher Seed, gleiche Fragen für alle; lokal gespeichert, später Leaderboard. |
| **Bestenliste** | v1 lokal; online erst mit Backend (nicht v1). |

**Bewusst nicht in v1:** Accounts, Cloud-Sync, Werbung, In-App-Käufe, soziale Features, Online-Multiplayer.

---

## 8. UX & Screens

### Screen-Flow

```
Boot
 └─ Hauptmenü
     ├─ Spielen
     │   ├─ Kontinent wählen
     │   │   └─ Run (10 Fragen)
     │   │       └─ Ergebnis → Nochmal / Atlas / Menü
     │   ├─ Tages-Challenge
     │   └─ Endlos
     ├─ Lernen
     │   ├─ Kontinent → Länderliste
     │   │   └─ Land → Atlas
     │   │       ├─ Layer wechseln
     │   │       ├─ Marker → Detail
     │   │       ├─ Kategorien
     │   │       └─ „Land üben“ → Run
     │   └─ Suche
     ├─ Sammlung (Erfolge, Statistik, Mastery)
     └─ Einstellungen (Sprache, Sound, Bewegung, Schwierigkeit, Reset, Credits)
```

### Screen-Beschreibungen

1. **Boot:** Logo, Ladebalken, Datenmigration, „Tippen zum Start“ (Audio freischalten).
2. **Hauptmenü:** große Karte „Spielen“, daneben „Lernen“; Tages-Challenge-Banner; XP/Level; Zahnrad.
3. **Kontinent-Auswahl:** Weltkarte oder Kontinent-Karten mit Fortschritt und Länderzahl.
4. **Run:** Karte im oberen 60 %, Fragekarte unten; HUD mit Fortschritt, Punkten, Streak; Pause.
5. **Feedback-Overlay:** richtig/falsch, Punkte, Distanz, Mini-Fakt, Karten-Zoom.
6. **Ergebnis:** Punktzahl, Trefferquote, beste Serie, neue Fakten, Mastery-Zuwachs; „Nochmal“ / „Atlas“ / „Menü“.
7. **Atlas Kontinent:** Kontinentkarte + Länderliste; Suche; Fortschritt pro Land.
8. **Atlas Land:** Hero mit Flagge/Name/Quick-Stats; interaktive Karte; Layer-Chips; Kategorien; „Land üben“.
9. **Fakt-Detail:** Bottom-Sheet mit Name, Kategorie, Text, Quelle, „Auf Karte zeigen“.
10. **Sammlung:** Erfolge, Statistiken, Länder-Mastery, gelernte Fakten.
11. **Einstellungen:** Sprache, Sound/Musik, reduzierte Bewegung, Schwierigkeit, Fortschritt zurücksetzen, Credits.
12. **Credits:** Datenquellen, Lizenzen, Mitwirkende, Datenschutz.

### Onboarding

- Beim ersten Start: 2–3 kurze Hinweise („Ziehe das Symbol an die richtige Stelle“, „Tippe die richtige Antwort“), überspringbar.
- Erster Run mit kontextuellen Tooltips statt Textwand.
- Kein erzwungenes Tutorial; wer will, startet sofort.

### Barrierefreiheit

- Farben **und** Formen/Symbole zur Unterscheidung (richtig/falsch).
- Große Touchziele, gut lesbare Schrift, Textskalierung.
- „Reduzierte Bewegung“-Option.
- Hoher Kontrast, keine rein farbcodierten Karteninformationen.
- Tastaturbedienung im Browser (Tab/Enter, Escape).

---

## 9. Technische Architektur

### 9.1 Stack-Entscheidung (Vorschlag)

**Web-nativ mit TypeScript.** Keine Game-Engine, sondern eine normale Web-App — das passt besser zu einer Karten-/UI-lastigen Anwendung und hält den Download klein.

| Baustein | Wahl | Zweck |
|---|---|---|
| Sprache | TypeScript (strict) | Typsicherheit, wartbarer Code |
| Build | Vite | schneller Dev-Server, kleiner Produktions-Build |
| UI | React | Screens, Komponenten, großes Ökosystem |
| Karte | **MapLibre GL JS** | Vektorkarten, Pan/Zoom, Labels, Hit-Testing, WebGL |
| Styling | Tailwind CSS + CSS-Variablen | konsistentes, schnelles UI |
| Animation | Framer Motion | Übergänge, Feedback, Konfetti |
| State | Zustand | Run-, Fortschritts- und Einstellungs-State |
| Persistenz | localStorage + IndexedDB | Save, Karten-Cache |
| i18n | i18next | Deutsch zuerst, Englisch später |
| Audio | Howler.js | SFX, Mobile-Audio-Unlock |
| Tests | Vitest + Testing Library + Playwright | Logik + E2E |
| PWA | vite-plugin-pwa | offline, installierbar |
| Android | Capacitor | Web-App in nativer Hülle (WebView) |

**Warum MapLibre GL JS:**

- Open Source, kein API-Token, keine Vendor-Bindung.
- WebGL-Rendering: flüssiges Pan/Zoom auf Desktop und Mobile.
- GeoJSON-Quellen für Länder, Flüsse, Seen, Gipfel und Städte.
- `queryRenderedFeatures` für Tap/Hit-Testing, `project`/`unproject` für Drag & Drop.
- Datengetriebene Styles, Labels mit Kollisionsvermeidung, Relief/Hillshade.
- Später PMTiles/Offline-Karten und 3D-Terrain möglich.

**Warum React + Vite:**

- Schnelle Iteration und gute Testbarkeit.
- Klare Trennung: MapLibre rendert die Karte, React steuert UI und Spielzustand.
- Große Auswahl an erprobten Bibliotheken für Animationen, i18n und Persistenz.

**Android:**

- Capacitor verpackt die Web-App in eine native Hülle.
- Plugins für Statusbar, Safe Areas, Zurück-Taste, Haptik und Preferences.
- Falls WebGL im Android-WebView nicht reicht: MapLibre Native als späterer Pfad (nicht v1).

**Alternativen:**

- **SvelteKit:** leichter, sehr gute Animationen; kleineres Ökosystem.
- **Leaflet:** einfacher, aber SVG/DOM-Rendering und weniger flüssige Karten.
- **D3-geo + Canvas:** maximale Kontrolle, aber Pan/Zoom/Hit-Testing/Labels selbst bauen.
- **PixiJS/Phaser:** stark für Spieleffekte, aber Kartenlogik und UI aufwendiger.

### 9.2 Architektur & Projektstruktur

```
spasmitflaggen/
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ index.html
├─ opencode.jsonc            # MCP-Server für die Entwicklung
├─ src/
│  ├─ main.tsx
│  ├─ app/App.tsx             # Router, Layout, Boot
│  ├─ screens/                # MainMenu, ContinentSelect, Run, Result, Atlas, ...
│  ├─ components/             # QuestionCard, AnswerButton, Hud, BottomSheet, Confetti, ...
│  ├─ map/                    # MapView, style.ts, layers.ts, hit-testing.ts
│  ├─ game/                   # QuestionEngine, scoring, mastery, runState
│  ├─ data/                   # Typen, Loader, Validierung
│  ├─ store/                  # Zustand-Stores
│  ├─ i18n/                   # de/en-Texte
│  └─ styles/
├─ public/
│  ├─ data/                   # countries.json, facts/, maps/
│  ├─ icons/
│  ├─ flags/
│  ├─ fonts/
│  └─ sfx/
├─ tools/                     # Node/TS: build_maps, build_facts, validate_data
├─ tests/                     # Vitest
├─ e2e/                       # Playwright
├─ android/                   # Capacitor (später)
└─ PLAN.md
```

**Zentrale Module:**

- `map/MapView` — MapLibre-Instanz, Pan/Zoom, Layer, Marker, Drag & Drop.
- `map/layers` — Länder, Grenzen, Flüsse, Seen, Gipfel, Städte, Labels.
- `game/QuestionEngine` — generiert Runs und Fragen.
- `game/scoring` — Punkte, Streak, Präzision.
- `game/mastery` — Lernstand pro Fakt.
- `store/progress` — Save/Load, Migration, Erfolge.
- `data/loader` — lädt und validiert JSON/GeoJSON lazy.
- `components/QuestionCard` — Frage, Antwort-UI, Feedback.
- `components/BottomSheet` — Fakten-Details im Atlas.
- `components/Hud` — Punkte, Streak, Fortschritt.
- `components/Confetti`, `Toast`, `ProgressRing`.

### 9.3 Datenmodelle (Entwurf)

**Land:**

```json
{
  "code": "DE",
  "name": {"de": "Deutschland", "en": "Germany"},
  "continent": "europe",
  "capital": "Berlin",
  "bbox": [5.87, 47.27, 15.04, 55.06],
  "center": [10.45, 51.16],
  "neighbors": ["AT", "BE", "CH", "CZ", "DK", "FR", "LU", "NL", "PL"],
  "population": 83200000,
  "area": 357588,
  "flag": "/flags/de.svg",
  "map": "/data/maps/country/de.geojson"
}
```

**Fakt:**

```json
{
  "id": "de-highest-peak",
  "country": "DE",
  "category": "mountains",
  "kind": "highest_peak",
  "difficulty": 2,
  "answer": {
    "text": {"de": "Zugspitze", "en": "Zugspitze"},
    "point": [10.986, 47.421],
    "value": 2962,
    "unit": "m"
  },
  "fact": {
    "de": "Die Zugspitze ist 2.962 m hoch und liegt an der Grenze zu Österreich."
  },
  "source": {
    "url": "https://www.wikidata.org/wiki/Q3375",
    "license": "CC0",
    "retrieved": "2026-11-02"
  },
  "interactions": ["mc", "drag", "tap_country"],
  "map": {"layer": "peaks", "zoom": 7}
}
```

**Frage (zur Laufzeit):**

```json
{
  "type": "drag",
  "prompt": "Wo liegt die Zugspitze?",
  "fact_id": "de-highest-peak",
  "answers": null,
  "target": [10.986, 47.421],
  "tolerance_km": 25,
  "map_focus": {"country": "DE", "bbox": [9.5, 46.8, 12.5, 48.2]},
  "points": 200
}
```

### 9.4 Persistenz

- **Web:** `localStorage` für Save/Einstellungen, `IndexedDB` für größere Caches (Karten, Glyphen).
- **Android:** Capacitor Preferences (async) über eine gemeinsame Storage-Abstraktion.
- **Format:** `save.json`, versioniert, mit Migration.
- **Speicherzeitpunkt:** nach jeder Antwort (debounced), nach Run-Ende, bei Einstellungsänderung.
- **Inhalt:** Einstellungen, XP, Mastery pro Fakt, Länder-Fortschritt, Tages-Streak, Erfolge, letzte Runs.
- **Export/Import:** Save-Datei als JSON herunterladen/laden (Bonus, gut für Support).
- **Reset:** „Fortschritt löschen“ mit Bestätigung.

### 9.5 Performance & Offline

- **Ziele:** 60 FPS auf Desktop, ≥ 30 FPS auf mittleren Android-Geräten; Web-Start < 3 s auf 4G, < 1 s aus dem Cache.
- **Karten:** MapLibre + vereinfachte GeoJSON-Daten; Lazy Loading pro Kontinent/Land; optional PMTiles.
- **Code-Splitting:** Karten-Screen und Atlas als eigene Chunks; Startseite lädt keine Kartendaten.
- **Assets:** SVG-Icons, lokale Glyphen, kleine SFX; keine ungenutzten Daten im Startpaket.
- **Web:** PWA-Manifest + Service Worker für Offline-Cache; Audio erst nach Nutzerinteraktion.
- **Android:** Safe-Area-Unterstützung, Zurück-Taste, keine Berechtigungen, komplett offline.
- **Messung:** Lighthouse, Chrome DevTools Performance-Trace (MCP), echte Geräte.

### 9.6 Tests & Qualität

- **Unit-Tests (Vitest):** Fragegenerierung, Distraktoren, Scoring, Distanzberechnung, Mastery.
- **Komponenten-Tests (Testing Library):** QuestionCard, HUD, Ergebnis, Einstellungen.
- **E2E (Playwright):** Hauptmenü → Run → Ergebnis; Atlas → Land → Fakt; Persistenz nach Reload.
- **Daten-Validator:** jedes Fakt hat Quelle, gültige Koordinaten, plausible Antwort, keine Duplikate; Länderabdeckung pro Kategorie.
- **Performance:** Chrome-DevTools-Trace für Karten-Interaktion und Speicherverbrauch.
- **Manuell:** Chrome/Firefox/Safari, Android Chrome/WebView, 360×640 bis 1920×1080, Touch + Maus, offline.
- **Playtest:** 5–10 Personen nach dem Vertical Slice; beobachten, wo sie hängen, was Spaß macht.

---

## 10. Inhalte, Quellen, Lizenzen

### 10.1 Datenquellen

| Quelle | Nutzung | Lizenz | Hinweis |
|---|---|---|---|
| **Natural Earth 1:10m** | Länder, Grenzen, **Admin-1-Regionen**, Flüsse, Seen, **Meeresflächen**, Städte, Gipfel, Relief | Public Domain | Hauptquelle für Karten |
| **Wikidata** | Fakten, Koordinaten, Höhen, Einwohner | CC0 | SPARQL; Stand speichern |
| **Wikipedia** | Verifikation, Sehenswürdigkeiten | CC BY-SA | Attribution; keine Textübernahme |
| **UN / World Bank** | Einwohner, Fläche | CC BY 4.0 / UN-Terms | Jahr angeben, prüfen |
| **OpenStreetMap** | Detailkarten (später) | ODbL | Attribution, Share-Alike |
| **GeoNames** | Ortsnamen (Fallback) | CC BY | prüfen |

**Grundsatz:** Public Domain und CC0 zuerst; alles andere nur mit sauberer Attribution im Credits-Screen.

### 10.2 Redaktionsprozess

1. **Automatisch erzeugen:** Kandidaten aus Natural Earth + Wikidata (höchster Berg, längster Fluss, größter See, Einwohner, Fläche, Nachbarn).
2. **Prüfen:** Top-Kandidaten gegen Wikipedia/offizielle Quellen abgleichen; bei Abweichung kuratierter Override.
3. **Anreichern:** Sehenswürdigkeiten, Extreme und Infrastruktur manuell kuratieren.
4. **Validieren:** Quelle, Koordinaten, Einheiten, Jahr, Eindeutigkeit.
5. **Kennzeichnen:** Fakten mit Unsicherheit als „Beta“ markieren und im Atlas erklären.

**Grundsatz:** Lieber 20 verlässliche Fakten pro Land als 50 ungeprüfte.

### 10.3 Umfang & Phasen

| Phase | Inhalt | Ziel |
|---|---|---|
| **P1** | Europa: alle Länder antippbar, 10 Länder mit tiefen Fakten, DACH-Regionen, Meere & Meerengen | Vertical Slice |
| **P2** | Europa komplett: alle Länder mit Kernfakten (A–D, F, H, M für DACH) | Spielbare Vollversion Europa |
| **P3** | Europa vertiefen: Seen, Extreme, Infrastruktur, Regionen für alle Länder | Content-Politur |
| **P4** | Asien, Afrika, Nord-/Südamerika, Ozeanien | Weltumspannend |
| **P5** | Englisch, Tages-Leaderboard, weitere Fragetypen | Ausbau |

**Länderumfang:** Ausgangspunkt 195 UN-Staaten; Sonderfälle (Kosovo, Taiwan, Westsahara, Gebiete) werden in der Recherchephase neutral und transparent festgelegt. Transkontinentale Länder (Russland, Türkei, Kasachstan, Georgien, Armenien, Aserbaidschan, Zypern) bekommen eine klare Kontinent-Zuordnung mit Hinweis.

---

## 11. Roadmap / Meilensteine

> Reihenfolge und Aufwand sind eine Schätzung; nach dem Vertical Slice wird anhand von Playtests neu priorisiert.

### M0 — Fundament (Technik-Risiko abbauen)

- Git-Repo, Vite/React/TypeScript-Projekt, PWA-Grundgerüst.
- Europa-Karte aus Natural Earth mit MapLibre rendern (Pan/Zoom/Tap).
- Datenpipeline v0 für 5 Länder (Node/TS + mapshaper).
- Messen: Bundle-Größe, Ladezeit, FPS auf Desktop und Android-WebView.
- **Abnahme:** Europa im Browser bedienbar; ein Land antippbar; Build reproduzierbar.

### M1 — Vertical Slice (Spielgefühl prüfen)

- Run mit 10 Fragen: Multiple Choice + Drag-to-Map + Tap-the-Country + **Tap-the-Region (DACH)** + **Meere & Meerengen**.
- **Interaktive Auflösung:** Flüsse, Seen, Meere, Meerengen, Berge und Regionen werden nach der Antwort auf der Karte markiert.
- 10 europäische Länder mit geprüften Fakten.
- Punkte, Streak, Feedback, Ergebnis, Speichern.
- **Abnahme:** Ein kompletter Run ist von Anfang bis Ende spielbar, ohne tote Enden; Fakten haben Quellen; Bundesland-Fragen funktionieren auf der Deutschlandkarte.

### M2 — Atlas & Fortschritt

- Länder-Atlas für 5 Länder (Deutschland, Frankreich, Italien, Spanien, Vereinigtes Königreich).
- Atlas-Layer für Bundesländer/Kantone/Regionen (DACH) mit Namen und Verwaltungssitz.
- Mastery, Länder-Sterne, Erfolge, Tages-Seed.
- **Abnahme:** Atlas zeigt alle v1-Kategorien; Fortschritt bleibt nach Neustart erhalten.

### M3 — Europa komplett & Politur

- Alle europäischen Länder mit Kernfakten.
- Regionen für weitere europäische Länder (Frankreich, Italien, Spanien, Polen, ...).
- Onboarding, Sound, Animationen, Einstellungen, Credits.
- Content-QA, Mobile-Playtest, Bugfixes.
- **Abnahme:** Europa-Run und Atlas fühlen sich vollständig an; keine kritischen Bugs.

### M4 — Android

- Capacitor einrichten, Android-Studio-Build, Safe Areas, Zurück-Taste, Performance, Signing, Icon/Splash.
- **Abnahme:** APK läuft auf einem mittleren Gerät mit ≥ 30 FPS, offline, ohne Berechtigungen.

### M5 — Ausbau

- Weitere Kontinente, Englisch, Tages-Leaderboard, zusätzliche Fragetypen.
- Optional: Online-Backend, Cloud-Sync, iOS.

---

## 12. Risiken & Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Kartendetail vs. Dateigröße | lange Ladezeiten, Ruckeln | M0-Prototyp, Vereinfachung, Lazy Loading, GeoJSON/PMTiles |
| MapLibre im Android-WebView | Performance-/Kompatibilitätsprobleme | früh auf echtem Gerät testen; Fallback: MapLibre Native |
| Label-/Glyphen-Pipeline | fehlende Umlaute, hässliche Labels | lokale Glyphen generieren, Latin-Range testen |
| Faktenqualität | Vertrauensverlust | Quellenpflicht, Stichprobenprüfung, „Beta“-Kennzeichnung, kuratierte Overrides |
| Scope-Explosion (195 Länder) | nie fertig | kontinentweise, Kernfakten zuerst, Vertical Slice |
| „Endlos“ fühlt sich repetitiv an | Langzeitmotivation sinkt | viele Frage-Familien, adaptive Auswahl, Content-Updates |
| Drag-to-Map unfair | Frust | Kontextlayer, Toleranz, „Ich weiß es nicht“, Playtests |
| Mobile Performance | Ruckeln, Akku | Polygon-Budget, Lazy Loading, Testgeräte |
| Lizenz-/Urheberrechtsprobleme | Store-Ablehnung/Abmahnung | PD/CC0 bevorzugen, Attribution, keine fremden Fotos ohne Lizenz |
| Politisch heikle Länderfälle | Kontroversen | neutrale Namen, Hinweise, Umfang in Recherche klären |
| Übersetzungsgrammatik | holprige EN-Fragen | Templates pro Sprache, Review |

---

## 13. Offene Entscheidungen (Fragen an dich)

1. **Technologie:** React + TypeScript + Vite + MapLibre (Vorschlag), SvelteKit + MapLibre, oder eine eigene Canvas/D3-Karte?
2. **Erster Umfang:** Europa-Vertical-Slice, DACH, ganz Europa oder alle Kontinente dünn?
3. **Sprache:** Deutsch (EN vorbereitet), DE+EN sofort oder nur Deutsch?
4. **Fragetypen v1:** MC, Drag-to-Map, Tap-the-Country, Tap-the-Region — welche sollen in Version 1?
5. **Run-Format:** 10 Fragen + Endlos, Endlos mit Leben, Zeitattacke oder Level-Pakete?
6. **Kartenstil:** Hybrid (politisch + Relief), flach-politisch, physisch oder umschaltbar?
7. **Zielgruppe/Schwierigkeit:** breit mit 3 Stufen, Familie/Schule oder Quizfans?

**Annahmen, falls du nichts änderst:**

- React + TypeScript + Vite + MapLibre GL JS, Web zuerst, Android später via Capacitor.
- Europa als Vertical Slice, 10 Länder tief.
- Deutsch zuerst, EN-fähig.
- MC + Drag-to-Map + Tap-the-Country + Tap-the-Region (DACH zuerst).
- Meere & Meerengen als eigene Kategorien in v1.
- 10-Fragen-Run + separater Endlosmodus.
- Hybrid-Karte (politisch im Quiz, Relief im Atlas).
- Drei Schwierigkeitsstufen, adaptiv.
- Regionen: Deutschland, Österreich, Schweiz in v1; weitere Länder später.
- Keine Accounts, keine Werbung, keine Monetarisierung in v1.

---

## 14. Nächster Schritt: Recherche & Kategorien

Nach deinen Antworten recherchiere ich konkret:

1. **Web-Stack:** Vite + React + TypeScript + MapLibre GL JS als Prototyp; Bundle-Größe, Ladezeit, FPS, Touch und Android-WebView messen.
2. **Kartendaten:** Natural Earth-Layer im Detail (inkl. Admin-1 für Bundesländer/Kantone), Vereinfachung mit mapshaper, GeoJSON vs. PMTiles, Dateigrößen, Alternativen (geoBoundaries, OSM).
3. **Fakten:** Wikidata-Properties und Abdeckung für Europa; World Bank/UN für Einwohner/Fläche; Natural-Earth-Ableitungen für Berg/Fluss/See.
4. **Lizenzen:** exakte Attributionspflichten, Bildrechte, Store-Anforderungen.
5. **Referenzspiele:** UX von „Flaggen aller Länder“, Seterra, Worldle, GeoGuessr & Co. — was funktioniert, was nervt.
6. **Kategorien finalisieren:** Matrix aus Kategorie × Fragetyp × Datenquelle × Aufwand, mit Beispielen pro Land.
7. **Prototyp-Erkenntnisse:** Ladezeit, FPS, Kartenqualität, WebView — danach Stack final bestätigen.

**Status:** Plan abgenommen. Die Umsetzung startet mit M0 (Fundament) und der Recherche-Spike läuft parallel.
