import { describe, expect, it } from "vitest";
import type { Country, Region } from "../data/types";
import { buildRun, capitalQuestion } from "./questions";
import { mulberry32 } from "./random";
import type { Fact } from "./types";

function country(
  code: string,
  name: string,
  capital: string,
  point: [number, number],
  peak: string,
  peakPoint: [number, number],
): Country {
  return {
    code,
    iso3: code + "X",
    name: { de: name, en: name },
    continent: "europe",
    capital: {
      name_de: capital,
      name_en: capital,
      point,
      population: 1_000_000,
      population_year: 2023,
    },
    population: 10_000_000,
    population_year: 2023,
    area_km2: 100_000,
    area_year: 2023,
    highest_point: {
      name: peak,
      elevation_m: 2000,
      point: peakPoint,
    },
    bbox: [-25, 34, 42, 72],
    focus_bbox: [-25, 34, 42, 72],
    center: point,
    flag: "🏳️",
    flag_url: "/flags/xx.svg",
    wikidata: "Q1",
    mapcolor: 1,
    has_regions: code === "DE",
    region_label: code === "DE" ? "Bundesland" : null,
    region_plural: code === "DE" ? "Bundesländer" : null,
    regions_map: code === "DE" ? "/data/maps/dach-regions.geojson" : null,
    map: "/data/maps/europe.geojson",
  };
}

const countries: Country[] = [
  country("DE", "Deutschland", "Berlin", [13.4, 52.5], "Zugspitze", [10.9, 47.4]),
  country("FR", "Frankreich", "Paris", [2.3, 48.8], "Mont Blanc", [6.8, 45.8]),
  country("AT", "Österreich", "Wien", [16.3, 48.2], "Großglockner", [12.7, 47.1]),
  country("IT", "Italien", "Rom", [12.5, 41.9], "Mont Blanc", [6.8, 45.8]),
];

const regions: Region[] = [
  {
    code: "DE-BY",
    name_de: "Bayern",
    name_en: "Bavaria",
    country: "DE",
    type: "State",
    center: [11.4, 49],
    area_km2: 70000,
    bbox: [9, 47.2, 13.8, 50.5],
    wikidata: "Q980",
  },
  {
    code: "DE-BE",
    name_de: "Berlin",
    name_en: "Berlin",
    country: "DE",
    type: "State",
    center: [13.4, 52.5],
    area_km2: 891,
    bbox: [13.0, 52.3, 13.8, 52.7],
    wikidata: "Q64",
  },
  {
    code: "AT-7",
    name_de: "Tirol",
    name_en: "Tyrol",
    country: "AT",
    type: "State",
    center: [11.0, 47.0],
    area_km2: 12648,
    bbox: [10.0, 46.6, 12.9, 47.7],
    wikidata: "Q1",
  },
];

const facts: Fact[] = [
  {
    id: "de-rhine",
    country: "DE",
    category: "river",
    interactions: ["mc"],
    difficulty: 2,
    question: "Welcher ist der längste Flussabschnitt in Deutschland?",
    answer: { label: "Rhein" },
    options: ["Rhein", "Donau", "Elbe", "Main"],
    fact: "Der Rhein ist der längste Flussabschnitt.",
    source: "https://example.org",
  },
  {
    id: "de-tor",
    country: "DE",
    category: "landmark",
    interactions: ["drag", "mc"],
    difficulty: 2,
    question: "Wo steht das Brandenburger Tor?",
    answer: { label: "Brandenburger Tor", point: [13.37, 52.51] },
    options: ["Brandenburger Tor", "Kölner Dom", "Frauenkirche", "Schloss"],
    fact: "Es steht in Berlin.",
    source: "https://example.org",
  },
  {
    id: "fr-loire",
    country: "FR",
    category: "river",
    interactions: ["mc"],
    difficulty: 2,
    question: "Welcher ist der längste Fluss Frankreichs?",
    answer: { label: "Loire" },
    options: ["Loire", "Seine", "Rhone", "Garonne"],
    fact: "Die Loire ist der längste Fluss.",
    source: "https://example.org",
  },
  {
    id: "eu-mittelmeer",
    country: "EU",
    focus: "europe",
    category: "sea",
    interactions: ["mc"],
    difficulty: 1,
    question: "Welches Meer liegt zwischen Europa und Afrika?",
    answer: { label: "Mittelmeer" },
    options: ["Mittelmeer", "Nordsee", "Ostsee", "Schwarzes Meer"],
    fact: "Das Mittelmeer liegt zwischen Europa und Afrika.",
    source: "https://example.org",
  },
  {
    id: "eu-bosporus",
    country: "EU",
    focus: "europe",
    category: "strait",
    interactions: ["mc"],
    difficulty: 2,
    question: "Welche Meerenge liegt in Istanbul?",
    answer: { label: "Bosporus" },
    options: ["Bosporus", "Dardanellen", "Öresund", "Ärmelkanal"],
    fact: "Der Bosporus trennt Europa und Asien.",
    source: "https://example.org",
  },
];

describe("buildRun", () => {
  it("builds a varied Europe run with unique fact ids", () => {
    const run = buildRun(
      { scope: "europe", count: 10, seed: 42 },
      countries,
      regions,
      facts,
      {},
      mulberry32(42),
    );

    expect(run).toHaveLength(10);
    expect(new Set(run.map((question) => question.factId)).size).toBe(10);
    expect(run.some((question) => question.interaction === "tap-country")).toBe(
      true,
    );
    expect(run.some((question) => question.interaction === "tap-region")).toBe(
      true,
    );
    expect(run.some((question) => question.interaction === "drag")).toBe(true);
    expect(run.some((question) => question.category === "sea")).toBe(true);
    expect(run.some((question) => question.category === "strait")).toBe(true);
    expect(
      run.filter((question) => question.interaction === "tap-region").length,
    ).toBeLessThanOrEqual(2);
  });

  it("limits a country run to the available facts and stays in the country", () => {
    const run = buildRun(
      { scope: "country", countryCode: "DE", count: 10, seed: 7 },
      countries,
      regions,
      facts,
      {},
      mulberry32(7),
    );

    expect(run.length).toBeGreaterThanOrEqual(6);
    expect(run.length).toBeLessThanOrEqual(10);
    expect(run.every((question) => question.countryCode === "DE")).toBe(true);
    expect(run.some((question) => question.interaction === "tap-region")).toBe(
      true,
    );
    expect(
      run.filter((question) => question.interaction === "tap-region").length,
    ).toBeLessThanOrEqual(3);
    expect(run.some((question) => question.interaction === "drag")).toBe(true);
  });

  it("creates four unique MC options including the answer", () => {
    const mc = capitalQuestion(
      countries[0],
      countries,
      "mc",
      mulberry32(3),
    );
    expect(mc.options).toHaveLength(4);
    expect(new Set(mc.options).size).toBe(4);
    expect(mc.options).toContain(mc.answer.label);
  });

  it("is deterministic for the same seed", () => {
    const first = buildRun(
      { scope: "europe", count: 10, seed: 99 },
      countries,
      regions,
      facts,
      {},
      mulberry32(99),
    );
    const second = buildRun(
      { scope: "europe", count: 10, seed: 99 },
      countries,
      regions,
      facts,
      {},
      mulberry32(99),
    );
    expect(first.map((question) => question.factId)).toEqual(
      second.map((question) => question.factId),
    );
  });

  it("includes European sea and strait facts with a Europe focus", () => {
    const run = buildRun(
      { scope: "europe", count: 100, seed: 11 },
      countries,
      regions,
      facts,
      {},
      mulberry32(11),
    );
    const sea = run.find(
      (question) => question.category === "sea" && question.countryCode === "EU",
    );
    const strait = run.find(
      (question) =>
        question.category === "strait" && question.countryCode === "EU",
    );
    expect(sea?.focus.kind).toBe("europe");
    expect(strait?.focus.kind).toBe("europe");
  });
});
