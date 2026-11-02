import type { Country, Region } from "../data/types";
import { shuffle, sample, type Rng } from "./random";
import type {
  Fact,
  Interaction,
  Question,
  RunConfig,
  MapFocus,
} from "./types";

function isInsideFocus(country: Country, point: [number, number]): boolean {
  const [minLon, minLat, maxLon, maxLat] = country.focus_bbox;
  return (
    point[0] >= minLon &&
    point[0] <= maxLon &&
    point[1] >= minLat &&
    point[1] <= maxLat
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function distractors(
  answer: string,
  pool: string[],
  rng: Rng,
  count = 4,
): string[] {
  const candidates = unique(pool).filter((value) => value !== answer);
  const picked = sample(candidates, count - 1, rng);
  return shuffle([answer, ...picked], rng);
}

function focusForCountry(country: Country): MapFocus {
  return { kind: "country", code: country.code };
}

export function capitalQuestion(
  country: Country,
  countries: Country[],
  interaction: "mc" | "drag",
  rng: Rng,
): Question {
  const capital = country.capital;
  if (!capital) throw new Error(`Capital missing for ${country.code}`);
  const capitalNames = countries
    .map((item) => item.capital?.name_de)
    .filter((name): name is string => Boolean(name));

  return {
    factId: `capital:${country.code}`,
    countryCode: country.code,
    category: "capital",
    interaction,
    prompt:
      interaction === "mc"
        ? `Wie heißt die Hauptstadt von ${country.name.de}?`
        : `Wo liegt die Hauptstadt von ${country.name.de}?`,
    options:
      interaction === "mc"
        ? distractors(capital.name_de, capitalNames, rng)
        : [],
    answer: { label: capital.name_de, point: capital.point },
    fact: `${capital.name_de} ist die Hauptstadt von ${country.name.de}.`,
    source: `https://www.wikidata.org/wiki/${country.wikidata ?? ""}`,
    difficulty: 1,
    focus: focusForCountry(country),
  };
}

function peakQuestion(
  country: Country,
  countries: Country[],
  interaction: "mc" | "drag",
  rng: Rng,
): Question {
  const peak = country.highest_point;
  if (!peak?.name || !peak.point) {
    throw new Error(`Highest point missing for ${country.code}`);
  }

  const peakNames = countries
    .map((item) =>
      item.highest_point?.name && item.highest_point.point
        ? item.highest_point.name
        : null,
    )
    .filter((name): name is string => Boolean(name));

  return {
    factId: `peak:${country.code}`,
    countryCode: country.code,
    category: "mountain",
    interaction,
    prompt:
      interaction === "mc"
        ? `Wie heißt der höchste Berg von ${country.name.de}?`
        : `Wo liegt der höchste Berg von ${country.name.de}?`,
    options:
      interaction === "mc"
        ? distractors(peak.name, peakNames, rng)
        : [],
    answer: { label: peak.name, point: peak.point },
    fact:
      peak.elevation_m !== null
        ? `${peak.name} ist mit ${Math.round(peak.elevation_m).toLocaleString("de-DE")} m der höchste Berg von ${country.name.de}.`
        : `${peak.name} ist der höchste Berg von ${country.name.de}.`,
    source: `https://www.wikidata.org/wiki/${country.wikidata ?? ""}`,
    difficulty: 2,
    focus: focusForCountry(country),
  };
}

function countryLocateQuestion(country: Country): Question {
  return {
    factId: `country:${country.code}`,
    countryCode: country.code,
    category: "country",
    interaction: "tap-country",
    prompt: `Wo liegt ${country.name.de}?`,
    options: [],
    answer: { label: country.name.de, countryCode: country.code },
    fact: `${country.name.de} liegt in Europa. Die Hauptstadt ist ${country.capital?.name_de ?? "—"}.`,
    source: `https://www.wikidata.org/wiki/${country.wikidata ?? ""}`,
    difficulty: 2,
    focus: { kind: "europe" },
  };
}

function regionQuestion(region: Region): Question {
  const countryGenitive =
    region.country === "CH"
      ? "der Schweiz"
      : region.country === "AT"
        ? "Österreichs"
        : "Deutschlands";
  const regionType = region.country === "CH" ? "Kanton" : "Bundesland";

  return {
    factId: `region:${region.code}`,
    countryCode: region.country,
    category: "region",
    interaction: "tap-region",
    prompt: `Wo liegt ${region.name_de}?`,
    options: [],
    answer: { label: region.name_de, regionCode: region.code },
    fact: `${region.name_de} ist ein ${regionType} ${countryGenitive}.`,
    source: `https://www.wikidata.org/wiki/${region.wikidata ?? ""}`,
    difficulty: 2,
    focus: { kind: "country", code: region.country },
  };
}

function curatedQuestion(
  fact: Fact,
  interaction: Interaction,
  rng: Rng,
): Question | null {
  if (interaction === "drag" && !fact.answer.point) return null;
  if (interaction === "tap-country" && !fact.answer.countryCode) return null;
  if (interaction === "tap-region" && !fact.answer.regionCode) return null;

  return {
    factId: fact.id,
    countryCode: fact.country,
    category: fact.category,
    interaction,
    prompt: fact.question,
    options:
      interaction === "mc"
        ? shuffle(fact.options, rng)
        : [],
    answer: fact.answer,
    fact: fact.fact,
    source: fact.source,
    difficulty: fact.difficulty,
    focus:
      fact.focus === "europe"
        ? { kind: "europe" }
        : { kind: "country", code: fact.country },
  };
}

function masteryWeight(mastery: number | undefined): number {
  return 1 + (5 - (mastery ?? 0)) * 2;
}

interface Entry {
  factId: string;
  variants: Question[];
  weight: number;
}

export function buildRun(
  config: RunConfig,
  countries: Country[],
  regions: Region[],
  facts: Fact[],
  mastery: Record<string, number>,
  rng: Rng,
): Question[] {
  const scopeCountries =
    config.scope === "country"
      ? countries.filter((country) => country.code === config.countryCode)
      : countries;
  const scopeCodes = new Set(scopeCountries.map((country) => country.code));

  const byFact = new Map<string, Question[]>();
  const add = (question: Question) => {
    const bucket = byFact.get(question.factId);
    if (bucket) bucket.push(question);
    else byFact.set(question.factId, [question]);
  };

  for (const country of scopeCountries) {
    if (country.capital) {
      add(capitalQuestion(country, countries, "drag", rng));
      add(capitalQuestion(country, countries, "mc", rng));
    }
    if (
      country.highest_point?.name &&
      country.highest_point.point &&
      isInsideFocus(country, country.highest_point.point)
    ) {
      add(peakQuestion(country, countries, "drag", rng));
      add(peakQuestion(country, countries, "mc", rng));
    }
    if (config.scope === "europe") {
      add(countryLocateQuestion(country));
    }
  }

  for (const region of regions) {
    if (scopeCodes.has(region.country)) {
      add(regionQuestion(region));
    }
  }

  for (const fact of facts) {
    const inScope =
      scopeCodes.has(fact.country) ||
      (config.scope === "europe" && fact.country === "EU");
    if (!inScope) continue;
    for (const interaction of fact.interactions) {
      const question = curatedQuestion(fact, interaction, rng);
      if (question) add(question);
    }
  }

  const entries: Entry[] = [...byFact.entries()].map(([factId, variants]) => ({
    factId,
    variants,
    weight: masteryWeight(mastery[factId]),
  }));

  const selected: Question[] = [];
  const selectedIds = new Set<string>();

  const capFor = (interaction: Interaction): number => {
    if (interaction === "tap-region") {
      return config.scope === "europe" ? 2 : 3;
    }
    if (interaction === "tap-country") return 2;
    if (interaction === "drag") {
      return config.scope === "europe" ? 4 : 3;
    }
    return Number.POSITIVE_INFINITY;
  };

  const interactionCounts = () => {
    const counts: Partial<Record<Interaction, number>> = {};
    for (const question of selected) {
      counts[question.interaction] =
        (counts[question.interaction] ?? 0) + 1;
    }
    return counts;
  };

  const chooseVariant = (entry: Entry, desired?: Interaction): Question => {
    const variants = desired
      ? entry.variants.filter(
          (variant) => variant.interaction === desired,
        )
      : entry.variants.filter((variant) => {
          const counts = interactionCounts();
          return (
            (counts[variant.interaction] ?? 0) <
            capFor(variant.interaction)
          );
        });
    const pool = variants.length ? variants : entry.variants;
    return pool[Math.floor(rng() * pool.length)];
  };

  const takeMatching = (
    predicate: (entry: Entry) => boolean,
    desired?: Interaction,
  ) => {
    const candidates = entries.filter(
      (entry) => !selectedIds.has(entry.factId) && predicate(entry),
    );
    if (candidates.length === 0) return;
    const total = candidates.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rng() * total;
    let chosen = candidates[candidates.length - 1];
    for (const entry of candidates) {
      roll -= entry.weight;
      if (roll <= 0) {
        chosen = entry;
        break;
      }
    }
    selectedIds.add(chosen.factId);
    selected.push(chooseVariant(chosen, desired));
  };

  if (config.scope === "europe") {
    takeMatching(
      (entry) =>
        entry.variants.some(
          (variant) => variant.interaction === "tap-country",
        ),
      "tap-country",
    );
    takeMatching(
      (entry) =>
        entry.variants.some(
          (variant) => variant.interaction === "tap-region",
        ),
      "tap-region",
    );
  } else {
    takeMatching(
      (entry) =>
        entry.variants.some(
          (variant) => variant.interaction === "tap-region",
        ),
      "tap-region",
    );
  }

  takeMatching((entry) =>
    entry.variants.some((variant) => variant.category === "sea"),
  );

  takeMatching((entry) =>
    entry.variants.some((variant) => variant.category === "strait"),
  );

  takeMatching(
    (entry) =>
      entry.variants.some((variant) => variant.interaction === "drag"),
    "drag",
  );

  while (selected.length < config.count) {
    const counts = interactionCounts();
    const allRemaining = entries.filter(
      (entry) => !selectedIds.has(entry.factId),
    );
    if (allRemaining.length === 0) break;

    const allowed = allRemaining.filter((entry) =>
      entry.variants.some(
        (variant) =>
          (counts[variant.interaction] ?? 0) <
          capFor(variant.interaction),
      ),
    );
    const pool = allowed.length ? allowed : allRemaining;

    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rng() * total;
    let chosen = pool[pool.length - 1];
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) {
        chosen = entry;
        break;
      }
    }

    selectedIds.add(chosen.factId);
    selected.push(chooseVariant(chosen));
  }

  return shuffle(selected, rng);
}
