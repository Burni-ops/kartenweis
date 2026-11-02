import type { LonLat } from "../data/types";
import type { Question, Reveal, RevealMap } from "./types";

export function pointReveal(
  point: LonLat,
  label: string,
  radius = 0.3,
): Reveal {
  const [lon, lat] = point;
  return {
    kind: "point",
    point,
    bbox: [
      lon - radius,
      lat - radius * 0.8,
      lon + radius,
      lat + radius * 0.8,
    ],
    labelPoint: point,
    label,
  };
}

/**
 * Geometry reveals only. Region/country reveals are handled by the map
 * component because they need the existing feature-state layers.
 */
export function resolveGeometryReveal(
  question: Question,
  reveals: RevealMap,
): Reveal | null {
  if (question.answer.regionCode || question.answer.countryCode) {
    return null;
  }
  const reveal = reveals[question.factId];
  if (reveal) return reveal;
  if (question.answer.point) {
    return pointReveal(question.answer.point, question.answer.label);
  }
  return null;
}

export function questionHasReveal(
  question: Question,
  reveals: RevealMap,
): boolean {
  return Boolean(
    question.answer.regionCode ||
      question.answer.countryCode ||
      question.answer.point ||
      reveals[question.factId],
  );
}
