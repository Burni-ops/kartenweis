import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (file) =>
  JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

const facts = readJson("public/data/facts/europe.json");
const countries = readJson("public/data/countries.json").countries;
const rivers = readJson("data/raw/ne_10m_rivers_lake_centerlines.geojson");
const lakes = readJson("data/raw/ne_10m_lakes.geojson");
const marine = readJson("data/raw/ne_10m_geography_marine_polys.geojson");

const countryBBoxes = Object.fromEntries(
  countries.map((country) => [country.code, country.bbox]),
);

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function indexFeatures(collection) {
  const index = new Map();
  for (const feature of collection.features) {
    const names = [
      feature.properties?.name,
      feature.properties?.name_en,
      feature.properties?.name_de,
      feature.properties?.name_alt,
    ];
    for (const name of names) {
      const key = normalize(name);
      if (!key) continue;
      const bucket = index.get(key);
      if (bucket) bucket.push(feature);
      else index.set(key, [feature]);
    }
  }
  return index;
}

const riverIndex = indexFeatures(rivers);
const lakeIndex = indexFeatures(lakes);
const marineIndex = indexFeatures(marine);

const aliases = {
  "de-rhine": ["Rhein", "Rhine"],
  "at-danube": ["Donau", "Danube"],
  "fr-loire": ["Loire"],
  "it-po": ["Po"],
  "gb-severn": ["Severn"],
  "pl-vistula": ["Vistula", "Weichsel"],
  "es-ebro": ["Ebro"],
  "se-gota": ["Göta älv", "Gota alv"],
  "de-bodensee": ["Bodensee", "Lake Constance"],
  "at-neusiedler-see": ["Neusiedler See", "Lake Neusiedl"],
  "ch-geneva": ["Genfersee", "Lake Geneva"],
  "fr-bourget": ["Lac du Bourget", "Lake Bourget"],
  "it-garda": ["Gardasee", "Lago di Garda", "Lake Garda"],
  "gb-neagh": ["Lough Neagh"],
  "gb-ness": ["Loch Ness"],
  "pl-sniardwy": ["Śniardwy", "Sniardwy"],
  "nl-ijsselmeer": ["IJsselmeer"],
  "se-vanern": ["Vänern", "Vanern"],
  "de-ostsee": ["Ostsee", "Baltic Sea"],
  "gb-nordsee": ["Nordsee", "North Sea"],
  "it-adria": ["Adria", "Adriatic Sea", "Adriatisches Meer"],
  "at-adria": ["Adria", "Adriatic Sea", "Adriatisches Meer"],
  "ch-mittelmeer": ["Mittelmeer", "Mediterranean Sea"],
  "eu-mittelmeer": ["Mittelmeer", "Mediterranean Sea"],
  "eu-schwarzes-meer": ["Schwarzes Meer", "Black Sea"],
  "eu-bosporus": ["Bosporus"],
  "eu-oresund": ["Öresund", "Øresund", "Oresund"],
  "eu-gibraltar": ["Straße von Gibraltar", "Strait of Gibraltar"],
  "es-gibraltar": ["Straße von Gibraltar", "Strait of Gibraltar"],
  "fr-aermelkanal": ["Ärmelkanal", "English Channel"],
  "eu-aermelkanal": ["Ärmelkanal", "English Channel"],
  "eu-dardanellen": ["Dardanellen", "Dardanelles"],
  "it-messina": ["Straße von Messina", "Strait of Messina"],
  "pl-ostsee": ["Ostsee", "Baltic Sea"],
  "nl-nordsee": ["Nordsee", "North Sea"],
  "se-ostsee": ["Ostsee", "Baltic Sea"],
};

const fallbacks = {
  "at-neusiedler-see": {
    point: [16.75, 47.75],
    bbox: [16.6, 47.6, 16.9, 47.9],
    label: "Neusiedler See",
  },
  "fr-bourget": {
    point: [5.87, 45.73],
    bbox: [5.7, 45.6, 6.0, 45.85],
    label: "Lac du Bourget",
  },
  "pl-sniardwy": {
    point: [21.75, 53.75],
    bbox: [21.55, 53.6, 21.95, 53.9],
    label: "Śniardwy",
  },
  "se-gota": {
    point: [11.97, 57.7],
    bbox: [11.5, 57.4, 12.3, 58.2],
    label: "Göta älv",
  },
  "it-messina": {
    point: [15.6, 38.25],
    bbox: [15.35, 38.0, 15.85, 38.5],
    label: "Straße von Messina",
  },
};

function walkCoordinates(coordinates, callback) {
  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number"
  ) {
    callback(coordinates);
    return;
  }
  if (Array.isArray(coordinates)) {
    for (const child of coordinates) walkCoordinates(child, callback);
  }
}

function bboxOfGeometry(geometry) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  walkCoordinates(geometry.coordinates, ([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  });
  return [minLon, minLat, maxLon, maxLat].map((value) =>
    Number(value.toFixed(4)),
  );
}

function roundCoordinates(coordinates, digits = 4) {
  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number"
  ) {
    return coordinates.map((value) => Number(value.toFixed(digits)));
  }
  return coordinates.map((child) => roundCoordinates(child, digits));
}

function combine(features) {
  const lines = [];
  const polygons = [];
  for (const feature of features) {
    const geometry = feature.geometry;
    if (!geometry) continue;
    if (geometry.type === "LineString") lines.push(geometry.coordinates);
    else if (geometry.type === "MultiLineString") {
      lines.push(...geometry.coordinates);
    } else if (geometry.type === "Polygon") {
      polygons.push(geometry.coordinates);
    } else if (geometry.type === "MultiPolygon") {
      polygons.push(...geometry.coordinates);
    }
  }

  if (lines.length > 0) {
    return { type: "MultiLineString", coordinates: lines };
  }
  if (polygons.length === 1) {
    return { type: "Polygon", coordinates: polygons[0] };
  }
  if (polygons.length > 1) {
    return { type: "MultiPolygon", coordinates: polygons };
  }
  return null;
}

function labelPointFor(geometry, kind, bbox) {
  if (kind === "point") return null;
  if (kind === "line") {
    let longest = [];
    for (const line of geometry.coordinates) {
      if (line.length > longest.length) longest = line;
    }
    return longest[Math.floor(longest.length / 2)] ?? null;
  }
  return [
    (bbox[0] + bbox[2]) / 2,
    (bbox[1] + bbox[3]) / 2,
  ];
}

function findFeatures(index, names) {
  const found = [];
  const seen = new Set();
  for (const name of names) {
    const hits = index.get(normalize(name)) ?? [];
    for (const feature of hits) {
      const key = feature.properties?.ne_id ?? feature;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(feature);
    }
  }
  return found;
}

function featureBBox(feature) {
  return bboxOfGeometry(feature.geometry);
}

function bboxIntersects(a, b) {
  return !(
    a[2] < b[0] ||
    a[0] > b[2] ||
    a[3] < b[1] ||
    a[1] > b[3]
  );
}

function buildReveal(fact) {
  const names = aliases[fact.id] ?? [fact.answer?.label].filter(Boolean);
  let features = [];
  let sourceKind = null;

  if (fact.category === "river") {
    features = findFeatures(riverIndex, names);
    sourceKind = "line";
  } else if (fact.category === "lake") {
    features = findFeatures(lakeIndex, names);
    sourceKind = "polygon";
  } else if (fact.category === "sea" || fact.category === "strait") {
    features = findFeatures(marineIndex, names);
    sourceKind = "polygon";
  }

  const allowOutside =
    fact.id === "at-adria" || fact.id === "ch-mittelmeer";
  const countryBBox =
    fact.country !== "EU" ? countryBBoxes[fact.country] : null;
  if (countryBBox && !allowOutside && features.length > 0) {
    const filtered = features.filter((feature) =>
      bboxIntersects(featureBBox(feature), countryBBox),
    );
    if (filtered.length > 0) features = filtered;
  }

  if (features.length > 0) {
    const geometry = combine(features);
    if (geometry) {
      const bbox = bboxOfGeometry(geometry);
      const kind =
        geometry.type === "Polygon" || geometry.type === "MultiPolygon"
          ? "polygon"
          : "line";
      return {
        kind,
        geometry: {
          type: geometry.type,
          coordinates: roundCoordinates(geometry.coordinates),
        },
        bbox,
        labelPoint: labelPointFor(geometry, kind, bbox),
        label: fact.answer?.label ?? "",
      };
    }
  }

  if (fallbacks[fact.id]) {
    return {
      kind: "point",
      ...fallbacks[fact.id],
    };
  }

  if (fact.answer?.point) {
    const [lon, lat] = fact.answer.point;
    return {
      kind: "point",
      point: fact.answer.point,
      bbox: [lon - 0.3, lat - 0.25, lon + 0.3, lat + 0.25],
      labelPoint: fact.answer.point,
      label: fact.answer.label,
    };
  }

  return null;
}

const output = {};
const missing = [];
for (const fact of facts) {
  const reveal = buildReveal(fact);
  if (reveal) output[fact.id] = reveal;
  else missing.push(fact.id);
}

const outFile = path.join(root, "public/data/reveals/europe.json");
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(output));

console.log(
  `Wrote ${Object.keys(output).length} reveals to public/data/reveals/europe.json`,
);
if (missing.length) {
  console.warn(`No reveal for: ${missing.join(", ")}`);
}
