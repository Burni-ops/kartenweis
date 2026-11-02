import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);

const exclusions = new Set(["GIB", "JEY", "GGY", "IMN", "ALD", "FRO"]);
const continents = new Set([
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
]);

const countries = JSON.parse(
  readFileSync(
    new URL("data/raw/ne_10m_admin_0_countries.geojson", root),
    "utf8",
  ),
).features
  .filter((feature) => {
    const p = feature.properties;
    return (
      ["Sovereign country", "Country", "Disputed"].includes(p.TYPE) &&
      !exclusions.has(p.ADM0_A3) &&
      continents.has(p.CONTINENT) &&
      !(p.ADM0_DIF === 1 && p.SOVEREIGNT !== p.ADMIN)
    );
  })
  .map((feature) => feature.properties)
  .filter((p) => typeof p.WIKIDATAID === "string" && p.WIKIDATAID.startsWith("Q"));

const values = [...new Set(countries.map((p) => `wd:${p.WIKIDATAID}`))].join(
  " ",
);

const query = `
SELECT ?country ?countryLabel ?capitalLabel ?highestLabel ?elevation ?coord WHERE {
  VALUES ?country { ${values} }
  OPTIONAL { ?country wdt:P36 ?capital. }
  OPTIONAL {
    ?country wdt:P610 ?highest.
    ?highest wdt:P2044 ?elevation; wdt:P625 ?coord.
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
}
`;

const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
console.log(`Querying Wikidata for ${countries.length} countries …`);

const response = await fetch(url, {
  headers: {
    "User-Agent": "Spasmitflaggen/0.2 (research; local prototype)",
    Accept: "application/sparql-results+json",
  },
  signal: AbortSignal.timeout(120_000),
});

console.log("HTTP", response.status);
if (!response.ok) {
  console.error(await response.text());
  process.exit(1);
}

const json = await response.json();
const rows = json.results.bindings;
const byCountry = new Map();

for (const row of rows) {
  const id = row.country.value.split("/").pop();
  const existing = byCountry.get(id);
  const entry = existing ?? {
    qid: id,
    name: row.countryLabel?.value ?? null,
    capital: null,
    highest: null,
    elevation_m: null,
    coord: null,
  };
  if (!entry.capital && row.capitalLabel?.value) {
    entry.capital = row.capitalLabel.value;
  }
  if (!entry.highest && row.highestLabel?.value) {
    entry.highest = row.highestLabel.value;
    entry.elevation_m = row.elevation?.value
      ? Number(row.elevation.value)
      : null;
    entry.coord = row.coord?.value ?? null;
  }
  byCountry.set(id, entry);
}

const list = [...byCountry.values()];
console.log({
  queried: countries.length,
  returned: list.length,
  withCapital: list.filter((c) => c.capital).length,
  withHighest: list.filter((c) => c.highest && c.coord).length,
});

mkdirSync(new URL("data/raw/", root), { recursive: true });
const out = new URL("data/raw/wikidata-world.json", root);
writeFileSync(out, `${JSON.stringify(list, null, 2)}\n`);
console.log("wrote", out.pathname);
