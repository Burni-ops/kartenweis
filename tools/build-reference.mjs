import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const countries = JSON.parse(
  readFileSync(new URL("public/data/countries.json", root), "utf8"),
).countries;

const wikidata = JSON.parse(
  readFileSync(new URL("data/raw/wikidata-europe.json", root), "utf8"),
);
const byQid = new Map(wikidata.map((entry) => [entry.qid, entry]));

const iso3Codes = countries
  .map((country) => country.iso3)
  .filter((code) => code !== "KOS");

function chunk(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

const indicators = {
  population: "SP.POP.TOTL",
  area_km2: "AG.SRF.TOTL.K2",
};

const worldBank = {};
for (const [key, indicator] of Object.entries(indicators)) {
  for (const batch of chunk(iso3Codes, 20)) {
    const url = `https://api.worldbank.org/v2/country/${batch.join(";")}/indicator/${indicator}?format=json&per_page=100&date=2023`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`World Bank ${indicator}: ${response.status}`);
    }
    const json = await response.json();
    for (const row of json[1] ?? []) {
      if (row.value === null) continue;
      worldBank[row.countryiso3code] ??= {};
      worldBank[row.countryiso3code][key] = {
        value: row.value,
        year: Number(row.date),
      };
    }
  }
}

function parsePoint(value) {
  if (!value) return null;
  const match = /^Point\(([-\d.]+)\s+([-\d.]+)\)$/.exec(value);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

const output = {};
const missing = [];

for (const country of countries) {
  const wiki = byQid.get(country.wikidata);
  const wb = worldBank[country.iso3] ?? {};
  const population = wb.population ?? null;
  const area = wb.area_km2 ?? null;
  const highestPoint = wiki?.highest
    ? {
        name: wiki.highest,
        elevation_m: wiki.elevation_m,
        point: parsePoint(wiki.coord),
      }
    : null;

  if (!wiki) missing.push(`${country.code}: Wikidata`);
  if (!population) missing.push(`${country.code}: population`);
  if (!area) missing.push(`${country.code}: area`);
  if (!highestPoint?.point) missing.push(`${country.code}: highest point`);

  output[country.code] = {
    wikidata: country.wikidata,
    name: wiki?.name ?? country.name.de,
    capital: wiki?.capital ?? country.capital?.name_de ?? null,
    population: population?.value ?? null,
    population_year: population?.year ?? null,
    area_km2: area?.value ?? null,
    area_year: area?.year ?? null,
    highest_point: highestPoint,
  };
}

const reference = {
  retrieved_at: new Date().toISOString(),
  sources: {
    wikidata: "https://query.wikidata.org/",
    world_bank: "https://api.worldbank.org/v2/",
  },
  countries: output,
};

mkdirSync(new URL("data/reference/", root), { recursive: true });
writeFileSync(
  new URL("data/reference/europe.json", root),
  `${JSON.stringify(reference, null, 2)}\n`,
);

console.log(
  `Wrote reference data for ${Object.keys(output).length} countries to data/reference/europe.json`,
);
if (missing.length) {
  console.warn(`Missing: ${missing.join(", ")}`);
}
