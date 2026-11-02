import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type ExpressionSpecification,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { FeatureCollection, Geometry } from "geojson";
import type {
  BBox,
  Country,
  Region,
  RegionFeatureCollection,
} from "../data/types";

const PALETTE = [
  "#e9dfc8",
  "#dce8d4",
  "#f0d8c6",
  "#d7e3f0",
  "#e7d3e1",
  "#f2e7bb",
  "#d1e7e2",
  "#ecd7d2",
  "#dde3c9",
];

const HOVER_COLOR = "#f2a541";
const SELECTED_COLOR = "#ef7b5c";
const SEA_COLOR = "#cfe8f3";

setWorkerUrl(maplibreWorkerUrl);

type Props = {
  countries: Country[];
  europe: FeatureCollection<Geometry>;
  regions: RegionFeatureCollection;
  selectedCountry: Country | null;
  selectedRegion: Region | null;
  onSelectCountry: (country: Country | null) => void;
  onSelectRegion: (region: Region | null) => void;
};

export default function MapView({
  countries,
  europe,
  regions,
  selectedCountry,
  selectedRegion,
  onSelectCountry,
  onSelectRegion,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectedCountryRef = useRef<string | null>(null);
  const selectedRegionRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [layersReady, setLayersReady] = useState(false);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MapLibreMap({
      container,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": SEA_COLOR },
          },
        ],
      },
      center: [12, 51],
      zoom: 3.4,
      minZoom: 2.2,
      maxZoom: 9,
      maxBounds: [
        [-25, 34],
        [42, 72],
      ],
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: false,
    });

    map.addControl(
      new NavigationControl({ showCompass: false }),
      "bottom-right",
    );

    map.on("load", () => setReady(true));
    mapRef.current = map;
    if (import.meta.env.DEV) {
      (window as unknown as { __map?: MapLibreMap }).__map = map;
    }

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
      setLayersReady(false);
      selectedCountryRef.current = null;
      selectedRegionRef.current = null;
      hoveredRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || map.getSource("countries")) return;

    const fillColor: ExpressionSpecification = [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      SELECTED_COLOR,
      ["boolean", ["feature-state", "hover"], false],
      HOVER_COLOR,
      [
        "match",
        ["get", "mapcolor"],
        1,
        PALETTE[0],
        2,
        PALETTE[1],
        3,
        PALETTE[2],
        4,
        PALETTE[3],
        5,
        PALETTE[4],
        6,
        PALETTE[5],
        7,
        PALETTE[6],
        8,
        PALETTE[7],
        9,
        PALETTE[8],
        PALETTE[0],
      ],
    ];

    map.addSource("countries", {
      type: "geojson",
      data: europe,
      promoteId: "code",
    });

    map.addLayer({
      id: "countries-fill",
      type: "fill",
      source: "countries",
      paint: {
        "fill-color": fillColor,
        "fill-opacity": 0.92,
      },
    });

    map.addLayer({
      id: "countries-line",
      type: "line",
      source: "countries",
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#1b2a41",
          "#ffffff",
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          2.6,
          1.1,
        ],
      },
    });

    map.addSource("regions", {
      type: "geojson",
      data: regions,
      promoteId: "code",
    });

    map.addLayer({
      id: "regions-fill",
      type: "fill",
      source: "regions",
      layout: { visibility: "none" },
      paint: {
        "fill-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#0f8b8d",
          ["boolean", ["feature-state", "hover"], false],
          HOVER_COLOR,
          "#0f8b8d",
        ],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.55,
          ["boolean", ["feature-state", "hover"], false],
          0.24,
          0.05,
        ],
      },
    });

    map.addLayer({
      id: "regions-line",
      type: "line",
      source: "regions",
      layout: { visibility: "none" },
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#0f8b8d",
          "#7a5c3e",
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          3,
          1.1,
        ],
        "line-opacity": 0.6,
        "line-dasharray": [2, 1],
      },
    });

    const clearHover = () => {
      if (hoveredRef.current) {
        map.setFeatureState(
          { source: "countries", id: hoveredRef.current },
          { hover: false },
        );
      }
      hoveredRef.current = null;
      setHoveredName(null);
      map.getCanvas().style.cursor = "";
    };

    map.on("mousemove", "countries-fill", (event: MapLayerMouseEvent) => {
      const code = event.features?.[0]?.properties?.code as string | undefined;
      if (!code) return;
      map.getCanvas().style.cursor = "pointer";
      if (hoveredRef.current === code) return;

      if (hoveredRef.current) {
        map.setFeatureState(
          { source: "countries", id: hoveredRef.current },
          { hover: false },
        );
      }
      map.setFeatureState({ source: "countries", id: code }, { hover: true });
      hoveredRef.current = code;
      setHoveredName(
        countries.find((country) => country.code === code)?.name.de ?? null,
      );
    });

    map.on("mouseleave", "countries-fill", clearHover);

    map.on("mousemove", "regions-fill", (event: MapLayerMouseEvent) => {
      const code = event.features?.[0]?.properties?.code as string | undefined;
      if (code) map.getCanvas().style.cursor = "pointer";
    });

    map.on("click", "countries-fill", (event: MapLayerMouseEvent) => {
      const code = event.features?.[0]?.properties?.code as string | undefined;
      if (!code) return;
      onSelectCountry(countries.find((country) => country.code === code) ?? null);
    });

    map.on("click", "regions-fill", (event: MapLayerMouseEvent) => {
      const code = event.features?.[0]?.properties?.code as string | undefined;
      if (!code) return;
      const region = regions.features.find(
        (feature) => feature.properties?.code === code,
      );
      if (region) onSelectRegion(region.properties as Region);
    });

    map.on("click", (event) => {
      const hits = map.queryRenderedFeatures(event.point, {
        layers: ["countries-fill", "regions-fill"],
      });
      if (!hits.length) onSelectCountry(null);
    });

    setLayersReady(true);
  }, [countries, europe, regions, onSelectCountry, onSelectRegion, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady) return;

    if (selectedCountryRef.current) {
      map.setFeatureState(
        { source: "countries", id: selectedCountryRef.current },
        { selected: false },
      );
    }
    if (selectedCountry) {
      map.setFeatureState(
        { source: "countries", id: selectedCountry.code },
        { selected: true },
      );
    }
    selectedCountryRef.current = selectedCountry?.code ?? null;

    const filter = selectedCountry?.has_regions
      ? (["==", ["get", "country"], selectedCountry.code] as any)
      : (["==", ["get", "country"], "__none__"] as any);

    for (const layer of ["regions-fill", "regions-line"]) {
      if (map.getLayer(layer)) {
        map.setFilter(layer, filter);
        map.setLayoutProperty(
          layer,
          "visibility",
          selectedCountry?.has_regions ? "visible" : "none",
        );
      }
    }

    if (selectedCountry) {
      map.fitBounds(selectedCountry.focus_bbox as BBox, {
        padding: {
          top: 110,
          bottom: window.innerWidth < 640 ? 400 : 340,
          left: 40,
          right: 40,
        },
        duration: 900,
        maxZoom: 9,
      });
    } else {
      map.easeTo({ center: [12, 51], zoom: 3.4, duration: 700 });
    }
  }, [selectedCountry, ready, layersReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady) return;

    if (selectedRegionRef.current) {
      map.setFeatureState(
        { source: "regions", id: selectedRegionRef.current },
        { selected: false },
      );
    }
    if (selectedRegion) {
      map.setFeatureState(
        { source: "regions", id: selectedRegion.code },
        { selected: true },
      );
    }
    selectedRegionRef.current = selectedRegion?.code ?? null;
  }, [selectedRegion, ready, layersReady]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="map-fade-in h-full w-full" />

      {hoveredName && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-10 -translate-x-1/2 rounded-full bg-ink/85 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
          {hoveredName}
        </div>
      )}

      {!layersReady && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-sea/70 backdrop-blur-sm">
          <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-ink">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
            Karte wird geladen …
          </div>
        </div>
      )}
    </div>
  );
}
