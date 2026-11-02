# Recherche-Notizen (Stand M0)

Dieses Dokument hält die Ergebnisse des Technik- und Daten-Spikes fest. Es ergänzt [`PLAN.md`](PLAN.md), ersetzt ihn aber nicht.

## 1. Technik-Stack

| Baustein | Ergebnis |
|---|---|
| Node | 24.16 |
| Vite | 8.3.5 |
| React | 19.3.1 |
| TypeScript | 7.0.2 |
| MapLibre GL JS | 6.16.0 |
| Tailwind | 4.3.3 |
| Vitest | 5.0.5 |
| Playwright | 1.64.1 |

**MapLibre + Vite:** Der Worker muss explizit gesetzt werden, sonst schlägt der Kartenaufbau fehl:

```ts
import { Map, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

setWorkerUrl(workerUrl);
```

Zusätzlich in `vite.config.ts`: `worker.format = "es"` und `optimizeDeps.exclude = ["maplibre-gl"]`.

**Build-Größen (M0):**

- App-JS: 1,30 MB (360 kB gzip)
- CSS: 92 kB (15 kB gzip)
- MapLibre-Worker: 519 kB
- PWA-Precache: 56 Dateien, ca. 2,9 MB
- Startdaten: `countries.json` 36 kB, Europa-GeoJSON 269 kB, DACH-Regionen 47 kB

**Fazit:** Der Stack funktioniert. Die MapLibre-Bundle-Größe ist für ein Web-Spiel akzeptabel; für M1 sollten Karte und Quiz-Screen per dynamischem Import getrennt werden.

## 2. Kartendaten

Natural Earth 1:10m (Public Domain) liefert:

| Layer | Nutzung | Beobachtung |
|---|---|---|
| `ne_10m_admin_0_countries` | Länderpolygone, Namen, Einwohner (2019) | 258 Features; 45 nach Europa-Filter (inkl. Kosovo, ohne 6 Dependencies) |
| `ne_10m_admin_1_states_provinces` | Bundesländer/Kantone | 4.596 Features; 51 für DACH (16 DE, 9 AT, 26 CH) |
| `ne_10m_populated_places` | Hauptstädte, Städte | Hauptstadt über `ADM0CAP = 1`; Kosovo über `ADM0_A3` auffindbar |
| `ne_10m_rivers_lake_centerlines` | Flüsse | noch nicht eingebunden |
| `ne_10m_lakes` | Seen | noch nicht eingebunden |
| `ne_10m_geography_marine_polys` | Meere, Meerengen | für Kartenlayer und Faktenprüfung vorgesehen |

**Vereinfachung:** mapshaper mit `-simplify 10% keep-shapes` reduziert Europa auf 269 kB und DACH-Regionen auf 47 kB. Das ist für den Prototyp ausreichend; für Detailansichten kann später auf 20–30 % gegangen werden.

**Wichtige Eigenheit:** Frankreich, Norwegen und Kosovo haben in Natural Earth `ISO_A2 = -99`. `ISO_A2_EH` bzw. eine kleine Fallback-Tabelle löst das (`FR`, `NO`, `XK`).

**Karten-Fokus:** Für Länder mit Überseegebieten (Frankreich, Norwegen, Portugal, Spanien) wird eine `focus_bbox` berechnet: Polygone, die weiter als 1.200 km vom Label-Punkt entfernt sind, werden beim Zoomen ignoriert. Dadurch landet man bei Frankreich auf dem Festland statt in Französisch-Guayana.

## 3. Fakten-Daten

### Wikidata

Abfrage über die 45 Wikidata-IDs aus `countries.json` (SPARQL, `VALUES`-Liste):

- **45/45** Länder mit Hauptstadt (`P36`)
- **45/45** mit Fläche (`P2046`)
- **45/45** mit Einwohnerzahl (`P1082`)
- **45/45** mit höchstem Punkt (`P610`) inkl. Höhe (`P2044`) und Koordinate (`P625`)

**Caveats:**

- Höchster Punkt ist teils der höchste **Staats**punkt, nicht der höchste Festlandpunkt: Spanien → Teide (3.715 m, Teneriffa), Niederlande → Mount Scenery (Karibik), Dänemark → Gunnbjørns Fjeld (Grönland).
- Für Fragen wie „höchster Berg des Festlands“ braucht es kuratierte Alternativen (Spanien: Mulhacén 3.479 m).
- Historische Staaten tauchen auf, wenn man nur `P31 Q3624078` abfragt. Deshalb immer über die konkreten QIDs der Länderliste joinen.
- Koordinaten können außerhalb der `focus_bbox` liegen (Übersee). Beim Drag-Ziel prüfen.

### World Bank

API funktioniert ohne Key:

- `SP.POP.TOTL` (Einwohner, 2023)
- `AG.SRF.TOTL.K2` (Fläche, 2023)

Beispiele: Deutschland 83.287.273 Einwohner / 357.680 km²; Frankreich 68.372.286 / 606.410 km² (inkl. Übersee).

**Empfehlung:** World Bank für Einwohner/Fläche verwenden (aktueller und konsistenter als Natural Earth 2019). Natural Earth bleibt für Geometrie und Kartenanker.

## 4. Lizenzen & Attribution

| Quelle | Lizenz | Attribution |
|---|---|---|
| Natural Earth | Public Domain | nicht erforderlich, „Made with Natural Earth“ empfohlen |
| Wikidata | CC0 | nicht erforderlich, Quellenangabe im Credits-Screen |
| Wikipedia | CC BY-SA 4.0 | Attribution + Link erforderlich |
| World Bank | CC BY 4.0 | Attribution erforderlich |
| OpenStreetMap (später) | ODbL | Attribution + Share-Alike |
| flagcdn.com / Flagpedia | freie Nutzung, Backlink erwünscht | „Flaggen: flagpedia.net“ im Credits-Screen |
| MapLibre GL JS | BSD-3-Clause | Lizenzhinweis |

**To-do vor Store-Release:** Credits-Screen mit allen Quellen, Datenschutzerklärung, Impressum, Bildrechte für Sehenswürdigkeiten klären.

## 5. Kategorien-Matrix (final für v1)

| Kategorie | Fakten | Interaktion | Quelle | v1 |
|---|---|---|---|---|
| **Steckbrief** | Hauptstadt, Einwohner, Fläche, Sprachen, Währung, Kontinent | MC, Karte | World Bank, Wikidata, UN | ✅ |
| **Städte** | Hauptstadt, größte Stadt, Top-5 | MC, Drag, Tap-Land | NE Populated Places, Wikidata | ✅ |
| **Flüsse** | längster Flussabschnitt, Quelle/Mündung, Nebenflüsse | MC, „Welcher fließt nicht durch …?“ | NE Rivers, Wikipedia | ✅ |
| **Berge** | höchster Berg, höchster Vulkan, Gebirge, tiefster Punkt | MC, Drag | Wikidata, NE | ✅ |
| **Sehenswürdigkeiten** | Wahrzeichen, UNESCO, Naturwunder | MC, Drag | kuratiert + Wikipedia | ✅ (Top-Länder) |
| **Nachbarn** | Anzahl, längste/kürzeste Grenze, „grenzt nicht an“ | MC, Tap-Land | NE, Wikidata | ✅ |
| **Bundesländer & Regionen** | Wo liegt Bayern? Welches Bundesland ist markiert? | **Tap-Region**, MC | NE Admin-1, Wikidata | ✅ DACH |
| **Seen & Küsten** | größter See, tiefster See, längste Küste, größte Insel | MC, Drag | NE Lakes, Wikidata | P1 |
| **Meere & Meerengen** | Europa und Afrika, Nordsee, Ostsee, Gibraltar, Bosporus, Öresund, Ärmelkanal | MC (später Karte) | NE Marine, kuratiert | ✅ |
| **Natur & Extreme** | Wüste, Strand, heiß/kalt, Gletscher | MC | kuratiert | P1 |
| **Verkehr** | Autobahn, Flughafen, Brücke | MC | kuratiert | P2 |
| **Flagge** | Farben, Symbolik | MC | Wikipedia | P2 |
| **Geschichte & Kultur** | Unabhängigkeit, Persönlichkeiten | MC | Wikipedia | P3 |

**Frage-Familien:** direkt, rückwärts, Karte, Länder-Identifikation, Region finden, Region identifizieren, Vergleich, Ausschluss, Reihenfolge, Richtig/Falsch, „In welchem Land liegt …?“, Nachbarn.

## 6. UX-Notizen aus Referenzspielen

- **Flaggen aller Länder:** klare Pakete, schnelle Rückmeldung, Wiederholung; Nachteil: reines Auswendiglernen.
- **Seterra:** Karte + präzise Treffer, sehr lehrreich; UI wirkt technisch, wenig „Spiel“.
- **Worldle:** ein Rätsel pro Tag, Teilen-Funktion; starke Retention, aber wenig Inhalt.
- **GeoGuessr:** räumliches Gefühl, Belohnung für Präzision; für ein Faktenquiz zu langsam.

**Ableitung für uns:** kurze Runs, sofortiges Karten-Feedback, Streak, „Wusstest du?“-Fakt, tägliche Challenge. Keine Strafe für Neugier; der Atlas ist die ruhige Gegenwelt.

## 7. Empfehlungen für M1

1. **World-Bank-Zahlen** in `countries.json` übernehmen (Population/Area 2023), Natural-Earth-Werte als Fallback.
2. **Fakten-Pipeline** um Wikidata-Join erweitern: pro Land Hauptstadt, höchster Punkt, Fläche, Einwohner; kuratierte Overrides für Festland/Übersee.
3. **QuestionEngine** zuerst mit 4 Typen: MC, Drag, Tap-Land, Tap-Region.
4. **Fakten für 10 Länder** kuratieren: DE, AT, CH, FR, IT, ES, GB, PL, NL, SE.
5. **DACH-Regionen** als vollständigen Fragentyp umsetzen (Region antippen, Feedback, „Welches Bundesland ist markiert?“).
6. **Save/Mastery** von Anfang an mitdenken, auch wenn zunächst nur lokal.

## 8. Offene Punkte

- Umfang der Regionen: DACH zuerst (entschieden), danach Frankreich/Italien/Spanien/Polen.
- Umgang mit Überseegebieten: „höchster Berg“ = Staat oder Festland? Vorschlag: Frage präzise formulieren und im Atlas beide zeigen.
- Bildrechte für Sehenswürdigkeiten: Icons/Illustrationen statt Fotos (Entscheidung steht aus).
- Länderumfang: 195 UN-Staaten + Kosovo; Sonderfälle in Credits/Notes transparent machen.
