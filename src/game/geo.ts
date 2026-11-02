import type { LonLat } from "../data/types";

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two WGS84 coordinates. */
export function haversineKm(a: LonLat, b: LonLat): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export type Precision = "perfect" | "great" | "close" | "miss";

/**
 * Precision bands for drag-to-map answers.
 *
 * The thresholds are intentionally generous while the map is still a
 * prototype; M1 will scale them with the country size and question type.
 */
export function precisionForDistance(distanceKm: number): Precision {
  if (distanceKm <= 25) return "perfect";
  if (distanceKm <= 75) return "great";
  if (distanceKm <= 150) return "close";
  return "miss";
}

export function precisionMultiplier(precision: Precision): number {
  switch (precision) {
    case "perfect":
      return 1;
    case "great":
      return 0.8;
    case "close":
      return 0.5;
    case "miss":
      return 0;
  }
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return "unter 1 km";
  return `${Math.round(distanceKm).toLocaleString("de-DE")} km`;
}
