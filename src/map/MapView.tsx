import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type ExpressionSpecification,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import type {
  BBox,
  Country,
  LonLat,
  Region,
  RegionFeatureCollection,
} from "../data/types";
import type {
  AnswerFeedback,
  Question,
  UserAnswer,
} from "../game/types";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

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
const CORRECT_COLOR = "#2e9e6b";
const WRONG_COLOR = "#d64545";
const SEA_COLOR = "#cfe8f3";

const DRAG_ICONS: Record<string, string> = {
  capital: "🏙️",
  city: "🏙️",
  river: "🌊",
  mountain: "🏔️",
  lake: "💧",
  landmark: "🏛️",
  neighbor: "🤝",
  region: "🗺️",
  country: "🌍",
  extreme: "⚡",
};

setWorkerUrl(maplibreWorkerUrl);

type Props = {
  countries: Country[];
  europe: FeatureCollection<Geometry>;
  regions: RegionFeatureCollection;
  selectedCountry: Country | null;
  selectedRegion: Region | null;
  onSelectCountry: (country: Country | null) => void;
  onSelectRegion: (region: Region | null) => void;
  runQuestion?: Question | null;
  runFeedback?: AnswerFeedback | null;
  onRunAnswer?: (answer: UserAnswer) => void;
};

export default function MapView({
  countries,
  europe,
  regions,
  selectedCountry,
  selectedRegion,
  onSelectCountry,
  onSelectRegion,
  runQuestion = null,
  runFeedback = null,
  onRunAnswer,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectedCountryRef = useRef<string | null>(null);
  const selectedRegionRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const hoveredRegionRef = useRef<string | null>(null);
  const answerCountryRef = useRef<string[]>([]);
  const answerRegionRef = useRef<string[]>([]);
  const runMarkersRef = useRef<Marker[]>([]);
  const dragPointerRef = useRef<number | null>(null);

  const callbacksRef = useRef({
    onSelectCountry,
    onSelectRegion,
    onRunAnswer,
  });
  const runRef = useRef({ question: runQuestion, feedback: runFeedback });

  const [ready, setReady] = useState(false);
  const [layersReady, setLayersReady] = useState(false);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    callbacksRef.current = { onSelectCountry, onSelectRegion, onRunAnswer };
  }, [onSelectCountry, onSelectRegion, onRunAnswer]);

  useEffect(() => {
    runRef.current = { question: runQuestion, feedback: runFeedback };
  }, [runQuestion, runFeedback]);

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
      minZoom: 1.5,
      maxZoom: 9,
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
      for (const marker of runMarkersRef.current) marker.remove();
      runMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
      setReady(false);
      setLayersReady(false);
      selectedCountryRef.current = null;
      selectedRegionRef.current = null;
      hoveredRef.current = null;
      hoveredRegionRef.current = null;
    };
  }, []);

  const applyRegionFilter = (
    map: MapLibreMap,
    countryCode: string | null,
  ) => {
    const filter = countryCode
      ? (["==", ["get", "country"], countryCode] as any)
      : (["==", ["get", "country"], "__none__"] as any);

    for (const layer of ["regions-fill", "regions-line"]) {
      if (map.getLayer(layer)) {
        map.setFilter(layer, filter);
        map.setLayoutProperty(
          layer,
          "visibility",
          countryCode ? "visible" : "none",
        );
      }
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || map.getSource("countries")) return;

    const fillColor: ExpressionSpecification = [
      "case",
      ["==", ["feature-state", "answer"], "correct"],
      CORRECT_COLOR,
      ["==", ["feature-state", "answer"], "wrong"],
      WRONG_COLOR,
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
          ["==", ["feature-state", "answer"], "correct"],
          "#1f7a52",
          ["==", ["feature-state", "answer"], "wrong"],
          "#a82f2f",
          ["boolean", ["feature-state", "selected"], false],
          "#1b2a41",
          "#ffffff",
        ],
        "line-width": [
          "case",
          ["==", ["feature-state", "answer"], "correct"],
          3,
          ["==", ["feature-state", "answer"], "wrong"],
          3,
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
          ["==", ["feature-state", "answer"], "correct"],
          CORRECT_COLOR,
          ["==", ["feature-state", "answer"], "wrong"],
          WRONG_COLOR,
          ["boolean", ["feature-state", "selected"], false],
          "#0f8b8d",
          ["boolean", ["feature-state", "hover"], false],
          HOVER_COLOR,
          "#0f8b8d",
        ],
        "fill-opacity": [
          "case",
          ["==", ["feature-state", "answer"], "correct"],
          0.72,
          ["==", ["feature-state", "answer"], "wrong"],
          0.72,
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
          ["==", ["feature-state", "answer"], "correct"],
          "#1f7a52",
          ["==", ["feature-state", "answer"], "wrong"],
          "#a82f2f",
          ["boolean", ["feature-state", "selected"], false],
          "#0f8b8d",
          "#7a5c3e",
        ],
        "line-width": [
          "case",
          ["==", ["feature-state", "answer"], "correct"],
          3,
          ["==", ["feature-state", "answer"], "wrong"],
          3,
          ["boolean", ["feature-state", "selected"], false],
          3,
          1.1,
        ],
        "line-opacity": 0.6,
        "line-dasharray": [2, 1],
      },
    });

    map.addSource("run-line", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "run-line",
      type: "line",
      source: "run-line",
      paint: {
        "line-color": CORRECT_COLOR,
        "line-width": 2,
        "line-dasharray": [2, 2],
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
      const run = runRef.current;
      if (run.question && run.question.interaction !== "tap-country") return;
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
      if (!code) return;
      const run = runRef.current;

      if (run.question) {
        if (
          run.question.interaction !== "tap-region" ||
          run.feedback
        ) {
          return;
        }
        map.getCanvas().style.cursor = "pointer";
        if (hoveredRegionRef.current !== code) {
          if (hoveredRegionRef.current) {
            map.setFeatureState(
              { source: "regions", id: hoveredRegionRef.current },
              { hover: false },
            );
          }
          map.setFeatureState(
            { source: "regions", id: code },
            { hover: true },
          );
          hoveredRegionRef.current = code;
        }
        return;
      }

      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "regions-fill", () => {
      if (hoveredRegionRef.current) {
        map.setFeatureState(
          { source: "regions", id: hoveredRegionRef.current },
          { hover: false },
        );
        hoveredRegionRef.current = null;
      }
      if (!runRef.current.question) {
        map.getCanvas().style.cursor = "";
      }
    });

    map.on("click", "countries-fill", (event: MapLayerMouseEvent) => {
      const code = event.features?.[0]?.properties?.code as string | undefined;
      if (!code) return;
      const run = runRef.current;

      if (run.question) {
        if (!run.feedback && run.question.interaction === "tap-country") {
          callbacksRef.current.onRunAnswer?.({
            kind: "tap-country",
            countryCode: code,
          });
        }
        return;
      }

      callbacksRef.current.onSelectCountry(
        countries.find((country) => country.code === code) ?? null,
      );
    });

    map.on("click", "regions-fill", (event: MapLayerMouseEvent) => {
      const code = event.features?.[0]?.properties?.code as string | undefined;
      if (!code) return;
      const run = runRef.current;

      if (run.question) {
        if (!run.feedback && run.question.interaction === "tap-region") {
          callbacksRef.current.onRunAnswer?.({
            kind: "tap-region",
            regionCode: code,
          });
        }
        return;
      }

      const region = regions.features.find(
        (feature) => feature.properties?.code === code,
      );
      if (region) {
        callbacksRef.current.onSelectRegion(region.properties as Region);
      }
    });

    map.on("click", (event) => {
      if (runRef.current.question) return;
      const hits = map.queryRenderedFeatures(event.point, {
        layers: ["countries-fill", "regions-fill"],
      });
      if (!hits.length) callbacksRef.current.onSelectCountry(null);
    });

    setLayersReady(true);
  }, [countries, europe, regions, ready]);

  // Browse: focus the selected country.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady || runQuestion) return;

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

    applyRegionFilter(
      map,
      selectedCountry?.has_regions ? selectedCountry.code : null,
    );

    if (selectedCountry) {
      map.fitBounds(selectedCountry.focus_bbox as BBox, {
        padding: {
          top: 100,
          bottom: 20,
          left: 40,
          right: 40,
        },
        duration: 900,
        maxZoom: 7.5,
      });
    } else {
      map.easeTo({ center: [12, 51], zoom: 3.4, duration: 700 });
    }
  }, [selectedCountry, ready, layersReady, runQuestion]);

  // Browse: highlight the selected region.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady || runQuestion) return;

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
  }, [selectedRegion, ready, layersReady, runQuestion]);

  // Run: focus the question's country or Europe, and show regions for tap-region.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady || !runQuestion) return;

    const regionCountry =
      runQuestion.interaction === "tap-region" &&
      runQuestion.focus.kind === "country"
        ? runQuestion.focus.code
        : null;
    applyRegionFilter(map, regionCountry);

    if (selectedCountryRef.current) {
      map.setFeatureState(
        { source: "countries", id: selectedCountryRef.current },
        { selected: false },
      );
      selectedCountryRef.current = null;
    }
    if (selectedRegionRef.current) {
      map.setFeatureState(
        { source: "regions", id: selectedRegionRef.current },
        { selected: false },
      );
      selectedRegionRef.current = null;
    }

    if (hoveredRef.current) {
      map.setFeatureState(
        { source: "countries", id: hoveredRef.current },
        { hover: false },
      );
      hoveredRef.current = null;
    }
    if (hoveredRegionRef.current) {
      map.setFeatureState(
        { source: "regions", id: hoveredRegionRef.current },
        { hover: false },
      );
      hoveredRegionRef.current = null;
    }
    setHoveredName(null);

    const focus = runQuestion.focus;

    if (focus.kind === "europe") {
      map.fitBounds(
        [
          [-25, 34],
          [45, 71],
        ],
        {
          padding: {
            top: 90,
            bottom: 20,
            left: 30,
            right: 30,
          },
          duration: 700,
          maxZoom: 4.2,
        },
      );
      return;
    }

    const country = countries.find(
      (item) => item.code === focus.code,
    );
    if (!country) return;

    map.fitBounds(country.focus_bbox as BBox, {
      padding: {
        top: 100,
        bottom: 20,
        left: 40,
        right: 40,
      },
      duration: 700,
      maxZoom: 7.5,
    });
  }, [runQuestion, ready, layersReady, countries]);

  // Run: clear old answer states and show markers/feature states for feedback.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady) return;

    for (const id of answerCountryRef.current) {
      map.setFeatureState({ source: "countries", id }, { answer: null });
    }
    for (const id of answerRegionRef.current) {
      map.setFeatureState({ source: "regions", id }, { answer: null });
    }
    answerCountryRef.current = [];
    answerRegionRef.current = [];

    for (const marker of runMarkersRef.current) marker.remove();
    runMarkersRef.current = [];

    const lineSource = map.getSource("run-line") as GeoJSONSource | undefined;
    lineSource?.setData({ type: "FeatureCollection", features: [] });

    if (!runQuestion || !runFeedback) return;

    if (runQuestion.interaction === "tap-country") {
      const target = runQuestion.answer.countryCode;
      if (target) {
        map.setFeatureState(
          { source: "countries", id: target },
          { answer: "correct" },
        );
        answerCountryRef.current.push(target);
      }
      const user = runFeedback.userLabel;
      if (user && user !== target) {
        map.setFeatureState(
          { source: "countries", id: user },
          { answer: "wrong" },
        );
        answerCountryRef.current.push(user);
      }
    }

    if (runQuestion.interaction === "tap-region") {
      const target = runQuestion.answer.regionCode;
      if (target) {
        map.setFeatureState(
          { source: "regions", id: target },
          { answer: "correct" },
        );
        answerRegionRef.current.push(target);
      }
      const user = runFeedback.userLabel;
      if (user && user !== target) {
        map.setFeatureState(
          { source: "regions", id: user },
          { answer: "wrong" },
        );
        answerRegionRef.current.push(user);
      }
    }

    if (
      runQuestion.interaction === "drag" &&
      runQuestion.answer.point &&
      runFeedback.userPoint
    ) {
      const correct = document.createElement("div");
      correct.className = "run-marker run-marker-correct";
      correct.textContent = "✓";
      runMarkersRef.current.push(
        new Marker({ element: correct })
          .setLngLat(runQuestion.answer.point)
          .addTo(map),
      );

      const user = document.createElement("div");
      user.className = `run-marker ${
        runFeedback.correct ? "run-marker-correct" : "run-marker-wrong"
      }`;
      user.textContent = runFeedback.correct ? "✓" : "✕";
      runMarkersRef.current.push(
        new Marker({ element: user })
          .setLngLat(runFeedback.userPoint)
          .addTo(map),
      );

      lineSource?.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [runFeedback.userPoint, runQuestion.answer.point],
        },
      });
    }
  }, [runQuestion, runFeedback, ready, layersReady]);

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const map = mapRef.current;
    if (!map) return;
    map.dragPan.disable();
    dragPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragPos({ x: event.clientX, y: event.clientY });
  };

  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerRef.current === null) return;
    setDragPos({ x: event.clientX, y: event.clientY });
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerRef.current === null) return;
    dragPointerRef.current = null;
    mapRef.current?.dragPan.enable();
    const map = mapRef.current;
    const container = containerRef.current;
    const pointerId = event.pointerId;
    if (event.currentTarget.hasPointerCapture(pointerId)) {
      event.currentTarget.releasePointerCapture(pointerId);
    }
    setDragPos(null);
    if (!map || !container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    const lngLat = map.unproject([x, y]);
    callbacksRef.current.onRunAnswer?.({
      kind: "drag",
      point: [lngLat.lng, lngLat.lat] as LonLat,
    });
  };

  const cancelDrag = () => {
    if (dragPointerRef.current === null) return;
    dragPointerRef.current = null;
    mapRef.current?.dragPan.enable();
    setDragPos(null);
  };

  const dragIcon =
    DRAG_ICONS[runQuestion?.category ?? ""] ?? "📍";

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="map-fade-in h-full w-full" />

      {hoveredName && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-10 -translate-x-1/2 rounded-full bg-ink/85 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
          {hoveredName}
        </div>
      )}

      {runQuestion?.interaction === "drag" && !runFeedback && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center">
          <button
            type="button"
            aria-label="Symbol auf die Karte ziehen"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={cancelDrag}
            className={`drag-pin pointer-events-auto ${
              dragPos ? "opacity-0" : "opacity-100"
            }`}
          >
            <span className="text-2xl">{dragIcon}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em]">
              Ziehen
            </span>
          </button>
        </div>
      )}

      {dragPos && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          <div className="drag-pin drag-pin-floating">
            <span className="text-2xl">{dragIcon}</span>
          </div>
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
