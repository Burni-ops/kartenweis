declare module "@turf/intersect" {
  import type {
    Feature,
    MultiPolygon,
    Polygon,
  } from "geojson";

  export default function intersect(
    feature1: Feature<any>,
    feature2: Feature<any>,
  ): Feature<Polygon | MultiPolygon> | null;
}
