import { useMemo, useState } from "react";
import type { Country } from "../data/types";
import type { AtlasFeature, MasterySummary } from "../game/atlas";
import type { FactProgress } from "../store/progress";
import { assetUrl } from "../utils/assets";

const CATEGORY_LABEL: Record<string, string> = {
  capital: "Hauptstädte",
  region: "Regionen",
  city: "Städte",
  mountain: "Berge",
  river: "Flüsse",
  lake: "Seen",
  sea: "Meere",
  strait: "Meerengen",
  landmark: "Wahrzeichen",
  extreme: "Extreme",
  neighbor: "Nachbarn",
  country: "Länder",
  currency: "Währungen",
  language: "Sprachen",
  population: "Bevölkerung",
  area: "Fläche",
  desert: "Wüsten",
  mountain_range: "Gebirge",
  island: "Inseln",
  peninsula: "Halbinseln",
  animal: "Tierwelt",
  volcano: "Vulkane",
};

const CATEGORY_ICON: Record<string, string> = {
  capital: "🏙️",
  region: "🗺️",
  city: "🏙️",
  mountain: "🏔️",
  river: "🌊",
  lake: "💧",
  sea: "🌊",
  strait: "⚓",
  landmark: "🏛️",
  extreme: "⚡",
  neighbor: "🤝",
  country: "🌍",
  currency: "💱",
  language: "🗣️",
  population: "👥",
  area: "📐",
  desert: "🏜️",
  mountain_range: "⛰️",
  island: "🏝️",
  peninsula: "🌅",
  animal: "🐾",
  volcano: "🌋",
};

const numberFormat = new Intl.NumberFormat("de-DE");
const compactFormat = new Intl.NumberFormat("de-DE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type Layers = {
  points: boolean;
  water: boolean;
  regions: boolean;
};

type Props = {
  country: Country;
  features: AtlasFeature[];
  mastery: MasterySummary;
  progress: Record<string, FactProgress>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  layers: Layers;
  onToggleLayer: (key: keyof Layers) => void;
};

function MasteryDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" title={`Mastery ${value}/5`}>
      {[1, 2, 3, 4, 5].map((level) => (
        <span
          key={level}
          className={`h-1.5 w-1.5 rounded-full ${
            level <= value ? "bg-teal" : "bg-line"
          }`}
        />
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper-deep/70 px-3 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold text-ink">{value}</div>
    </div>
  );
}

export default function AtlasPanel({
  country,
  features,
  mastery,
  progress,
  selectedId,
  onSelect,
  onClose,
  layers,
  onToggleLayer,
}: Props) {
  const [filter, setFilter] = useState<string>("all");

  const categories = useMemo(() => {
    const unique = [...new Set(features.map((feature) => feature.category))];
    return unique.filter((category) => CATEGORY_LABEL[category]);
  }, [features]);

  const visible = filter === "all"
    ? features
    : features.filter((feature) => feature.category === filter);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col">
      <div
        className="sheet safe-bottom sheet-enter mx-auto flex max-h-[58dvh] w-[96%] flex-col rounded-t-3xl px-4 pt-4 sm:mb-4 sm:max-h-[62dvh] sm:rounded-3xl"
        style={{ maxHeight: "52dvh" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/15 sm:hidden" />

        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm">
            <img
              src={assetUrl(country.flag_url)}
              alt={`Flagge von ${country.name.de}`}
              className="h-8 w-8 rounded-md object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">
              Länder-Atlas
            </div>
            <h2 className="truncate text-xl font-extrabold tracking-tight">
              {country.name.de}
            </h2>
            <p className="text-xs text-ink-muted">
              {country.capital
                ? `Hauptstadt: ${country.capital.name_de}`
                : "Keine Hauptstadt hinterlegt"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Mastery
            </div>
            <div className="text-sm font-extrabold text-teal">
              {mastery.percent}%
            </div>
            <div className="mt-0.5 text-xs text-gold">
              {"★".repeat(mastery.stars)}
              <span className="text-line">
                {"★".repeat(3 - mastery.stars)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Atlas schließen"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-deep text-ink-muted transition hover:bg-line hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          <Stat
            label="Einwohner"
            value={
              country.population
                ? compactFormat.format(country.population)
                : "—"
            }
          />
          <Stat
            label="Fläche km²"
            value={numberFormat.format(country.area_km2)}
          />
          <Stat
            label="Fakten"
            value={`${mastery.learned}/${mastery.total}`}
          />
          <Stat
            label={country.region_plural ?? "Regionen"}
            value={
              country.has_regions
                ? String(
                    features.filter(
                      (feature) => feature.category === "region",
                    ).length,
                  )
                : "—"
            }
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(
            [
              ["points", "📍 Orte"],
              ["water", "💧 Gewässer"],
              ["regions", "🗺️ Regionen"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onToggleLayer(key)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                layers[key]
                  ? "border-teal bg-teal text-white"
                  : "border-line bg-white/70 text-ink-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="chip-scroll -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filter === "all"
                ? "border-coral bg-coral text-white"
                : "border-line bg-white/80 text-ink"
            }`}
          >
            Alle
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                setFilter(filter === category ? "all" : category)
              }
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                filter === category
                  ? "border-coral bg-coral text-white"
                  : "border-line bg-white/80 text-ink"
              }`}
            >
              {CATEGORY_ICON[category]} {CATEGORY_LABEL[category]}
            </button>
          ))}
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto pb-2">
          {visible.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-ink-muted">
              Für dieses Land sind noch keine Fakten hinterlegt.
            </p>
          ) : (
            <div className="grid gap-1.5">
              {visible.map((feature) => {
                const active = selectedId === feature.id;
                const value = progress[feature.id]?.mastery ?? 0;
                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() =>
                      onSelect(active ? null : feature.id)
                    }
                    className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-teal bg-teal-soft/70"
                        : "border-line/80 bg-white/70 hover:border-teal/60"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-paper-deep text-base">
                        {CATEGORY_ICON[feature.category] ?? "📍"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold">
                            {feature.label}
                          </span>
                          <span className="shrink-0 rounded-full bg-paper-deep px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink-muted">
                            {CATEGORY_LABEL[feature.category] ?? feature.category}
                          </span>
                          <span className="ml-auto shrink-0">
                            <MasteryDots value={value} />
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                          {feature.fact}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="pb-1 text-center text-[10px] text-ink-muted">
          Fakt antippen, um ihn auf der Karte zu markieren.
        </p>
      </div>
    </div>
  );
}
