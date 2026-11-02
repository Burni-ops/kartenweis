import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import MapView from "../map/MapView";
import CountrySheet from "../components/CountrySheet";
import {
  loadCountries,
  loadDachRegions,
  loadEuropeMap,
} from "../data/load";
import type {
  CountriesDataset,
  Country,
  Region,
  RegionFeatureCollection,
} from "../data/types";

export default function App() {
  const [dataset, setDataset] = useState<CountriesDataset | null>(null);
  const [europe, setEurope] = useState<FeatureCollection<Geometry> | null>(
    null,
  );
  const [regionsGeo, setRegionsGeo] =
    useState<RegionFeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadCountries(), loadEuropeMap(), loadDachRegions()])
      .then(([countries, map, regions]) => {
        if (cancelled) return;
        setDataset(countries);
        setEurope(map);
        setRegionsGeo(regions);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Die Geodaten konnten nicht geladen werden.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectCountry = useCallback((country: Country | null) => {
    setSelectedCountry(country);
    setSelectedRegion(null);
  }, []);

  const handleSelectRegion = useCallback((region: Region | null) => {
    setSelectedRegion(region);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCountry(null);
    setSelectedRegion(null);
  }, []);

  const regionsForCountry = useMemo(() => {
    if (!selectedCountry || !regionsGeo) return [];
    return regionsGeo.features
      .filter(
        (feature) => feature.properties?.country === selectedCountry.code,
      )
      .map((feature) => feature.properties as Region)
      .sort((a, b) => a.name_de.localeCompare(b.name_de, "de"));
  }, [selectedCountry, regionsGeo]);

  if (error) {
    return (
      <main className="map-shell grid place-items-center bg-paper p-6">
        <div className="glass max-w-md rounded-3xl p-6 text-center">
          <div className="text-3xl">🧭</div>
          <h1 className="mt-3 text-lg font-extrabold">Daten nicht gefunden</h1>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-2xl bg-teal px-4 py-2 text-sm font-bold text-white"
          >
            Neu laden
          </button>
        </div>
      </main>
    );
  }

  if (!dataset || !europe || !regionsGeo) {
    return (
      <main className="map-shell grid place-items-center bg-paper">
        <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          Lade Geografie …
        </div>
      </main>
    );
  }

  return (
    <main className="map-shell">
      <MapView
        countries={dataset.countries}
        europe={europe}
        regions={regionsGeo}
        selectedCountry={selectedCountry}
        selectedRegion={selectedRegion}
        onSelectCountry={handleSelectCountry}
        onSelectRegion={handleSelectRegion}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-5">
        <div className="glass pointer-events-auto mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl px-3.5 py-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal text-xl text-white shadow-sm">
            🗺️
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold leading-tight tracking-tight">
              Spasmitflaggen
            </div>
            <div className="text-[11px] font-medium text-ink-muted">
              Europa · Prototyp M0
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-teal-soft px-2.5 py-1 text-[11px] font-bold text-teal">
              {dataset.countries.length} Länder
            </span>
            <button
              type="button"
              disabled
              aria-label="Einstellungen (kommt später)"
              className="grid h-9 w-9 place-items-center rounded-full bg-paper-deep text-sm text-ink-muted opacity-70"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <CountrySheet
          country={selectedCountry}
          regions={regionsForCountry}
          selectedRegion={selectedRegion}
          onSelectRegion={handleSelectRegion}
          onClose={handleClose}
        />
      </div>
    </main>
  );
}
