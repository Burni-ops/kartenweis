import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const dataset = JSON.parse(
  readFileSync(new URL("../public/data/countries.json", import.meta.url), "utf8"),
);
const ids = dataset.countries
  .map((country) => country.wikidata)
  .filter((id) => typeof id === "string" && id.startsWith("Q"));

const values = ids.map((id) => `wd:${id}`).join(" ");
const query = `
SELECT ?country ?countryLabel ?capitalLabel ?area ?population ?highestLabel ?elevation ?coord WHERE {
  VALUES ?country { ${values} }
  OPTIONAL { ?country wdt:P36 ?capital. }
  OPTIONAL { ?country wdt:P2046 ?area. }
  OPTIONAL { ?country wdt:P1082 ?population. }
  OPTIONAL {
    ?country wdt:P610 ?highest.
    ?highest wdt:P2044 ?elevation; wdt:P625 ?coord.
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
}
`;

const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
const response = await fetch(url, {
  headers: {
    "User-Agent": "Kartenweis/0.1 (research; local prototype)",
    Accept: "application/sparql-results+json",
  },
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
  if (!byCountry.has(id)) {
    byCountry.set(id, {
      qid: id,
      name: row.countryLabel?.value ?? null,
      capital: row.capitalLabel?.value ?? null,
      area_km2: row.area?.value ? Number(row.area.value) : null,
      population: row.population?.value ? Number(row.population.value) : null,
      highest: row.highestLabel?.value ?? null,
      elevation_m: row.elevation?.value ? Number(row.elevation.value) : null,
      coord: row.coord?.value ?? null,
    });
  }
}

const countries = [...byCountry.values()];
const withCapital = countries.filter((c) => c.capital).length;
const withArea = countries.filter((c) => c.area_km2).length;
const withPopulation = countries.filter((c) => c.population).length;
const withHighest = countries.filter((c) => c.highest && c.coord).length;

console.log({
  queried: ids.length,
  returned: countries.length,
  withCapital,
  withArea,
  withPopulation,
  withHighest,
});
console.log(countries.slice(0, 8));

mkdirSync(new URL("../data/raw/", import.meta.url), { recursive: true });
const out = new URL("../data/raw/wikidata-europe.json", import.meta.url);
writeFileSync(out, JSON.stringify(countries, null, 2));
console.log("wrote", out.pathname);
