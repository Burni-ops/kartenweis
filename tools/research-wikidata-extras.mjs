import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const reference = JSON.parse(
  readFileSync(new URL("data/reference/world.json", root), "utf8"),
);
const entries = Object.entries(reference.countries)
  .map(([code, value]) => ({ code, qid: value?.wikidata }))
  .filter((entry) => typeof entry.qid === "string" && entry.qid.startsWith("Q"));

const values = entries.map((entry) => `wd:${entry.qid}`).join(" ");

const query = `
SELECT ?country ?currencyLabel ?languageLabel WHERE {
  VALUES ?country { ${values} }
  OPTIONAL { ?country wdt:P38 ?currency. }
  OPTIONAL { ?country wdt:P37 ?language. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
}
`;

console.log(`Querying currencies/languages for ${entries.length} countries …`);
const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
const response = await fetch(url, {
  headers: {
    "User-Agent": "Kartenweis/0.2 (research; local prototype)",
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
const byQid = new Map();
for (const row of json.results.bindings) {
  const qid = row.country.value.split("/").pop();
  const entry = byQid.get(qid) ?? { currencies: new Set(), languages: new Set() };
  if (row.currencyLabel?.value) entry.currencies.add(row.currencyLabel.value);
  if (row.languageLabel?.value) entry.languages.add(row.languageLabel.value);
  byQid.set(qid, entry);
}

const countries = {};
for (const { code, qid } of entries) {
  const entry = byQid.get(qid);
  countries[code] = {
    currencies: [...(entry?.currencies ?? [])].sort((a, b) =>
      a.localeCompare(b, "de"),
    ),
    languages: [...(entry?.languages ?? [])].sort((a, b) =>
      a.localeCompare(b, "de"),
    ),
  };
}

const output = {
  retrieved_at: new Date().toISOString(),
  source: "https://query.wikidata.org/",
  countries,
};
mkdirSync(new URL("data/reference/", root), { recursive: true });
const out = new URL("data/reference/world-extras.json", root);
writeFileSync(out, `${JSON.stringify(output, null, 2)}\n`);
console.log("wrote", out.pathname);
console.log(
  `with currency: ${Object.values(countries).filter((c) => c.currencies.length).length}, with language: ${Object.values(countries).filter((c) => c.languages.length).length}`,
);
