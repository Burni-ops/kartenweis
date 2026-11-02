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
  RevealMap,
  UserAnswer,
} from "../game/types";
import type { AtlasFeature } from "../game/atlas";
import { resolveGeometryReveal } from "../game/reveal";
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
  reveals: RevealMap;
  atlasCountry?: Country | null;
  atlasFeatures?: AtlasFeature[];
  atlasSelectedFeature?: AtlasFeature | null;
  onSelectAtlasFeature?: (id: string | null) => void;
  atlasLayers?: { points: boolean; water: boolean; regions: boolean };
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
  reveals,
  atlasCountry = null,
  atlasFeatures = [],
  atlasSelectedFeature = null,
  onSelectAtlasFeature,
  atlasLayers = { points: true, water: true, regions: true },
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
  const revealMarkersRef = useRef<Marker[]>([]);
  const atlasMarkersRef = useRef<Marker[]>([]);
  const atlasSelectedRegionRef = useRef<string | null>(null);
  const atlasSelectedCountryRef = useRef<string | null>(null);
  const dragPointerRef = useRef<number | null>(null);

  const callbacksRef = useRef({
    onSelectCountry,
    onSelectRegion,
    onRunAnswer,
    onSelectAtlasFeature,
    atlasCountry,
  });
  const runRef = useRef({ question: runQuestion, feedback: runFeedback });

  const [ready, setReady] = useState(false);
  const [layersReady, setLayersReady] = useState(false);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    callbacksRef.current = {
      onSelectCountry,
      onSelectRegion,
      onRunAnswer,
      onSelectAtlasFeature,
      atlasCountry,
    };
  }, [
    onSelectCountry,
    onSelectRegion,
    onRunAnswer,
    onSelectAtlasFeature,
    atlasCountry,
  ]);

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
      for (const marker of revealMarkersRef.current) marker.remove();
      revealMarkersRef.current = [];
      for (const marker of atlasMarkersRef.current) marker.remove();
      atlasMarkersRef.current = [];
      atlasSelectedRegionRef.current = null;
      atlasSelectedCountryRef.current = null;
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

    const emptyCollection: FeatureCollection<Geometry> = {
      type: "FeatureCollection",
      features: [],
    };
    map.addSource("reveal-fill", {
      type: "geojson",
      data: emptyCollection,
    });
    map.addSource("reveal-line", {
      type: "geojson",
      data: emptyCollection,
    });
    map.addSource("reveal-point", {
      type: "geojson",
      data: emptyCollection,
    });

    map.addLayer({
      id: "reveal-fill",
      type: "fill",
      source: "reveal-fill",
      paint: {
        "fill-color": "#0f8b8d",
        "fill-opacity": 0.24,
      },
    });
    map.addLayer({
      id: "reveal-line-glow",
      type: "line",
      source: "reveal-line",
      paint: {
        "line-color": "#0f8b8d",
        "line-width": 10,
        "line-opacity": 0.18,
        "line-blur": 2,
      },
    });
    map.addLayer({
      id: "reveal-line",
      type: "line",
      source: "reveal-line",
      paint: {
        "line-color": "#0f8b8d",
        "line-width": 3.5,
        "line-opacity": 0.95,
      },
    });
    map.addLayer({
      id: "reveal-point",
      type: "circle",
      source: "reveal-point",
      paint: {
        "circle-radius": 9,
        "circle-color": "#0f8b8d",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });

    map.addSource("atlas-water", {
      type: "geojson",
      data: emptyCollection,
      promoteId: "id",
    });
    map.addLayer({
      id: "atlas-water-fill",
      type: "fill",
      source: "atlas-water",
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#0f8b8d",
        "fill-opacity": 0.12,
      },
    });
    map.addLayer({
      id: "atlas-water-line",
      type: "line",
      source: "atlas-water",
      layout: { visibility: "none" },
      paint: {
        "line-color": "#0f8b8d",
        "line-width": 1.8,
        "line-opacity": 0.55,
      },
    });

    const selectAtlasFeature = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id as string | undefined;
      if (id) callbacksRef.current.onSelectAtlasFeature?.(id);
    };
    map.on("click", "atlas-water-fill", selectAtlasFeature);
    map.on("click", "atlas-water-line", selectAtlasFeature);
    map.on("mousemove", "atlas-water-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mousemove", "atlas-water-line", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "atlas-water-line", () => {
      map.getCanvas().style.cursor = "";
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

      if (callbacksRef.current.atlasCountry) return;

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

      if (callbacksRef.current.atlasCountry) {
        callbacksRef.current.onSelectAtlasFeature?.(`region:${code}`);
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
      if (runRef.current.question || callbacksRef.current.atlasCountry) return;
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
        { selected: !atlasCountry },
      );
    }
    selectedCountryRef.current = selectedCountry?.code ?? null;

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
  }, [selectedCountry, ready, layersReady, runQuestion, atlasCountry]);

  // Region visibility for browse and atlas (run mode controls it separately).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady || runQuestion) return;
    if (atlasCountry) {
      applyRegionFilter(
        map,
        atlasLayers.regions ? atlasCountry.code : null,
      );
    } else {
      applyRegionFilter(
        map,
        selectedCountry?.has_regions ? selectedCountry.code : null,
      );
    }
  }, [
    atlasCountry,
    atlasLayers.regions,
    selectedCountry,
    runQuestion,
    ready,
    layersReady,
  ]);

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

    if (runQuestion.answer.countryCode) {
      const target = runQuestion.answer.countryCode;
      if (target) {
        map.setFeatureState(
          { source: "countries", id: target },
          { answer: "correct" },
        );
        answerCountryRef.current.push(target);
      }
      const user =
        runQuestion.interaction === "tap-country"
          ? runFeedback.userLabel
          : null;
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

  // Reveal the answer on the map after feedback: point, river/lake/sea geometry,
  // region or country. Keeps the highlight visible until "Weiter".
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady) return;

    for (const marker of revealMarkersRef.current) marker.remove();
    revealMarkersRef.current = [];

    const empty: FeatureCollection<Geometry> = {
      type: "FeatureCollection",
      features: [],
    };
    for (const id of ["reveal-point", "reveal-line", "reveal-fill"]) {
      (map.getSource(id) as GeoJSONSource | undefined)?.setData(empty);
    }

    if (!runQuestion || !runFeedback) return;

    const addLabel = (point: LonLat, label: string) => {
      const element = document.createElement("div");
      element.className = "reveal-label";
      const dot = document.createElement("span");
      dot.className = "reveal-dot";
      const text = document.createElement("span");
      text.textContent = label;
      element.append(dot, text);
      revealMarkersRef.current.push(
        new Marker({ element, anchor: "bottom" })
          .setLngLat(point)
          .addTo(map),
      );
    };

    const addPulse = (point: LonLat) => {
      const element = document.createElement("div");
      element.className = "reveal-pulse";
      revealMarkersRef.current.push(
        new Marker({ element, anchor: "center" })
          .setLngLat(point)
          .addTo(map),
      );
    };

    const fit = (bbox: BBox, maxZoom: number) => {
      map.fitBounds(bbox, {
        padding: { top: 100, bottom: 30, left: 40, right: 40 },
        duration: 900,
        maxZoom,
      });
    };

    if (runQuestion.answer.regionCode) {
      const region = regions.features.find(
        (feature) =>
          feature.properties?.code === runQuestion.answer.regionCode,
      );
      if (region) {
        addLabel(region.properties.center, region.properties.name_de);
        addPulse(region.properties.center);
        fit(region.properties.bbox as BBox, 8.5);
      }
      return;
    }

    if (runQuestion.answer.countryCode) {
      const country = countries.find(
        (item) => item.code === runQuestion.answer.countryCode,
      );
      if (country) {
        addLabel(country.center, country.name.de);
        addPulse(country.center);
        fit(country.focus_bbox as BBox, 7.5);
      }
      return;
    }

    const reveal = resolveGeometryReveal(runQuestion, reveals);
    if (!reveal) return;

    const point = reveal.point;
    if (reveal.kind === "point" && !point) return;

    const geometry: Geometry | undefined =
      reveal.kind === "point"
        ? { type: "Point", coordinates: point as [number, number] }
        : reveal.geometry;
    if (!geometry) return;

    const collection: FeatureCollection<Geometry> = {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry }],
    };

    if (reveal.kind === "point") {
      (map.getSource("reveal-point") as GeoJSONSource | undefined)?.setData(
        collection,
      );
    } else {
      (map.getSource("reveal-line") as GeoJSONSource | undefined)?.setData(
        collection,
      );
      if (reveal.kind === "polygon") {
        (map.getSource("reveal-fill") as GeoJSONSource | undefined)?.setData(
          collection,
        );
      }
    }

    const labelPoint =
      reveal.labelPoint ??
      reveal.point ??
      ([
        (reveal.bbox[0] + reveal.bbox[2]) / 2,
        (reveal.bbox[1] + reveal.bbox[3]) / 2,
      ] as LonLat);

    addLabel(labelPoint, reveal.label);
    if (reveal.kind === "point") {
      addPulse(reveal.point ?? labelPoint);
    }
    fit(reveal.bbox as BBox, reveal.kind === "point" ? 8.5 : 7.5);
  }, [
    runQuestion,
    runFeedback,
    ready,
    layersReady,
    reveals,
    countries,
    regions,
  ]);

  // Atlas: keep the country fill neutral; the panel and markers are the focus.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady || !atlasCountry) return;
    map.setFeatureState(
      { source: "countries", id: atlasCountry.code },
      { selected: false, answer: null },
    );
  }, [atlasCountry, ready, layersReady]);

  // Atlas: show water geometries (rivers, lakes, seas, straits) as subtle layers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady) return;

    const features = atlasFeatures
      .filter((feature) => Boolean(feature.geometry))
      .map((feature) => ({
        type: "Feature" as const,
        properties: { id: feature.id },
        geometry: feature.geometry!,
      }));

    (map.getSource("atlas-water") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features,
    });

    const visible = Boolean(atlasCountry) && atlasLayers.water;
    for (const layer of ["atlas-water-fill", "atlas-water-line"]) {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(
          layer,
          "visibility",
          visible ? "visible" : "none",
        );
      }
    }
  }, [
    atlasCountry,
    atlasFeatures,
    atlasLayers.water,
    ready,
    layersReady,
  ]);

  // Atlas: point markers for capitals, peaks, landmarks, rivers, lakes, seas.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady) return;

    for (const marker of atlasMarkersRef.current) marker.remove();
    atlasMarkersRef.current = [];

    if (!atlasCountry || !atlasLayers.points) return;

    for (const feature of atlasFeatures) {
      if (feature.kind === "region" || feature.kind === "country") continue;
      const point =
        feature.point ?? feature.labelPoint ?? feature.center;
      if (!point) continue;

      const element = document.createElement("button");
      element.type = "button";
      element.className = `atlas-marker ${
        atlasSelectedFeature?.id === feature.id ? "active" : ""
      }`;
      element.title = feature.label;
      element.setAttribute("aria-label", feature.label);
      element.textContent = DRAG_ICONS[feature.category] ?? "📍";
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        callbacksRef.current.onSelectAtlasFeature?.(feature.id);
      });

      atlasMarkersRef.current.push(
        new Marker({ element, anchor: "center" })
          .setLngLat(point)
          .addTo(map),
      );
    }
  }, [
    atlasCountry,
    atlasFeatures,
    atlasLayers.points,
    atlasSelectedFeature,
    ready,
    layersReady,
  ]);

  // Atlas: highlight the selected fact on the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReady || runQuestion) return;

    for (const marker of revealMarkersRef.current) marker.remove();
    revealMarkersRef.current = [];
    for (const id of ["reveal-point", "reveal-line", "reveal-fill"]) {
      (map.getSource(id) as GeoJSONSource | undefined)?.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
    if (atlasSelectedRegionRef.current) {
      map.setFeatureState(
        { source: "regions", id: atlasSelectedRegionRef.current },
        { selected: false },
      );
      atlasSelectedRegionRef.current = null;
    }
    if (atlasSelectedCountryRef.current) {
      map.setFeatureState(
        { source: "countries", id: atlasSelectedCountryRef.current },
        { answer: null },
      );
      atlasSelectedCountryRef.current = null;
    }

    if (!atlasCountry) return;

    const addLabel = (
      point: LonLat,
      label: string,
      pulse = false,
    ) => {
      const element = document.createElement("div");
      element.className = "reveal-label";
      const dot = document.createElement("span");
      dot.className = "reveal-dot";
      const text = document.createElement("span");
      text.textContent = label;
      element.append(dot, text);
      revealMarkersRef.current.push(
        new Marker({ element, anchor: "bottom" })
          .setLngLat(point)
          .addTo(map),
      );
      if (pulse) {
        const pulseElement = document.createElement("div");
        pulseElement.className = "reveal-pulse";
        revealMarkersRef.current.push(
          new Marker({ element: pulseElement, anchor: "center" })
            .setLngLat(point)
            .addTo(map),
        );
      }
    };

    if (!atlasSelectedFeature) {
      map.fitBounds(atlasCountry.focus_bbox as BBox, {
        padding: { top: 100, bottom: 30, left: 40, right: 40 },
        duration: 700,
        maxZoom: 7.5,
      });
      return;
    }

    const feature = atlasSelectedFeature;

    if (feature.kind === "region" && feature.regionCode) {
      const region = regions.features.find(
        (item) => item.properties?.code === feature.regionCode,
      );
      if (region) {
        map.setFeatureState(
          { source: "regions", id: feature.regionCode },
          { selected: true },
        );
        atlasSelectedRegionRef.current = feature.regionCode;
        addLabel(region.properties.center, feature.label, true);
        map.fitBounds(region.properties.bbox as BBox, {
          padding: { top: 100, bottom: 30, left: 40, right: 40 },
          duration: 700,
          maxZoom: 8.5,
        });
      }
      return;
    }

    if (feature.kind === "country" && feature.countryCode) {
      const country = countries.find(
        (item) => item.code === feature.countryCode,
      );
      if (country) {
        map.setFeatureState(
          { source: "countries", id: country.code },
          { answer: "correct" },
        );
        atlasSelectedCountryRef.current = country.code;
        addLabel(country.center, feature.label, true);
        map.fitBounds(country.focus_bbox as BBox, {
          padding: { top: 100, bottom: 30, left: 40, right: 40 },
          duration: 700,
          maxZoom: 7.5,
        });
      }
      return;
    }

    const point = feature.point ?? feature.labelPoint ?? feature.center;
    const bbox =
      feature.bbox ??
      (point
        ? ([
            point[0] - 0.3,
            point[1] - 0.24,
            point[0] + 0.3,
            point[1] + 0.24,
          ] as BBox)
        : null);
    if (!bbox) return;

    if (feature.kind === "point" && point) {
      const collection = {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            properties: {},
            geometry: { type: "Point" as const, coordinates: point },
          },
        ],
      };
      (map.getSource("reveal-point") as GeoJSONSource | undefined)?.setData(
        collection,
      );
    } else if (feature.geometry) {
      const collection = {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            properties: {},
            geometry: feature.geometry,
          },
        ],
      };
      (map.getSource("reveal-line") as GeoJSONSource | undefined)?.setData(
        collection,
      );
      if (feature.kind === "polygon") {
        (map.getSource("reveal-fill") as GeoJSONSource | undefined)?.setData(
          collection,
        );
      }
    }

    const labelPoint = point ?? [
      (bbox[0] + bbox[2]) / 2,
      (bbox[1] + bbox[3]) / 2,
    ] as LonLat;
    addLabel(labelPoint, feature.label, feature.kind === "point");
    map.fitBounds(bbox, {
      padding: { top: 100, bottom: 30, left: 40, right: 40 },
      duration: 700,
      maxZoom: feature.kind === "point" ? 8.5 : 7.5,
    });
  }, [
    atlasCountry,
    atlasSelectedFeature,
    atlasFeatures,
    runQuestion,
    ready,
    layersReady,
    countries,
    regions,
  ]);

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
