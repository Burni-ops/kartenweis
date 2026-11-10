import type { Country, Region } from "../data/types";
import { CONTINENT_NAMES } from "../data/continents";
import { assetUrl } from "../utils/assets";
import { APP_VERSION } from "../config";
import type { MasterySummary } from "../game/atlas";

const numberFormat = new Intl.NumberFormat("de-DE");
const compactFormat = new Intl.NumberFormat("de-DE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type Props = {
  country: Country | null;
  regions: Region[];
  selectedRegion: Region | null;
  mastery?: MasterySummary | null;
  dailyDone: boolean;
  onSelectRegion: (region: Region | null) => void;
  onClose: () => void;
  onStartRun: (countryCode: string) => void;
  onStartContinent: () => void;
  onStartWorld: () => void;
  onStartDaily: () => void;
  onOpenAtlas: (country: Country) => void;
  continentName: string;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper-deep/70 px-2 py-1.5">
      <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </div>
      <div className="mt-0.5 text-xs font-bold text-ink">{value}</div>
    </div>
  );
}

export default function CountrySheet({
  country,
  regions,
  selectedRegion,
  mastery,
  dailyDone,
  onSelectRegion,
  onClose,
  onStartRun,
  onStartContinent,
  onStartWorld,
  onStartDaily,
  onOpenAtlas,
  continentName,
}: Props) {
  if (!country) {
    return (
      <div className="sheet safe-bottom sheet-enter pointer-events-auto mx-auto w-[94%] max-w-md rounded-t-3xl px-4 pt-3.5 sm:mb-3 sm:rounded-3xl">
        <div className="flex items-start gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-soft text-lg">
            🧭
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight">
              Länder entdecken
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
              Tippe auf ein Land. Für viele Länder kannst du anschließend
              Regionen, Städte, Flüsse, Seen, Meere und Nachbarn erkunden.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartContinent}
          className="mt-3 w-full rounded-xl bg-teal px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.99]"
        >
          {continentName}-Run starten · Endlos
        </button>
        <button
          type="button"
          onClick={onStartWorld}
          className="mt-1.5 w-full rounded-xl border border-teal/30 bg-teal-soft/50 px-4 py-2 text-xs font-bold text-teal transition hover:bg-teal-soft"
        >
          🌍 Welt-Run starten · Endlos
        </button>
        <button
          type="button"
          onClick={onStartDaily}
          disabled={dailyDone}
          className="mt-1.5 w-full rounded-xl border border-line bg-white/70 px-4 py-2 text-xs font-bold text-ink transition hover:border-teal hover:text-teal disabled:cursor-default disabled:opacity-60"
        >
          📅 {dailyDone ? "Tages-Challenge erledigt" : "Tages-Challenge starten"}
        </button>
        <p className="mt-2 text-center text-[9px] text-ink-muted">
          Karten: Natural Earth (Public Domain) · v{APP_VERSION}
        </p>
      </div>
    );
  }

  const regionLabel =
    country.region_label ??
    (country.has_regions ? "Regionen" : null);
  const regionPlural =
    country.region_plural ?? (country.has_regions ? "Regionen" : null);

  return (
    <div className="sheet safe-bottom sheet-enter pointer-events-auto mx-auto w-[94%] max-w-lg rounded-t-3xl px-4 pt-3 sm:mb-3 sm:rounded-3xl">
      <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-ink/15 sm:hidden" />

      <div className="flex items-start gap-2.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm">
          <img
            src={assetUrl(country.flag_url)}
            alt={`Flagge von ${country.name.de}`}
            className="h-7 w-7 rounded-md object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-teal">
            {CONTINENT_NAMES[country.continent]}
          </div>
          <h2 className="truncate text-lg font-extrabold tracking-tight">
            {country.name.de}
          </h2>
          <p className="truncate text-xs text-ink-muted">
            {country.capital
              ? `Hauptstadt: ${country.capital.name_de}`
              : "Hauptstadt: —"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-deep text-ink-muted transition hover:bg-line hover:text-ink"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <Stat
          label="Einwohner"
          value={
            country.population
              ? compactFormat.format(country.population)
              : "—"
          }
        />
        <Stat
          label="Fläche (km²)"
          value={numberFormat.format(country.area_km2)}
        />
        <Stat
          label={regionPlural ?? "Regionen"}
          value={country.has_regions ? String(regions.length) : "—"}
        />
      </div>

      {mastery && (
        <div className="mt-1.5 rounded-xl bg-teal-soft/50 px-2.5 py-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-teal">Fortschritt</span>
            <span className="text-ink">
              {mastery.learned}/{mastery.total} Fakten · {mastery.percent}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-teal transition-[width]"
              style={{ width: `${mastery.percent}%` }}
            />
          </div>
          <div className="mt-0.5 text-[10px] text-gold">
            {"★".repeat(mastery.stars)}
            <span className="text-line">
              {"★".repeat(3 - mastery.stars)}
            </span>
          </div>
        </div>
      )}

      {country.has_regions && regions.length > 0 && (
        <div className="mt-2.5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
              {regionLabel}
            </h3>
            <span className="text-[10px] text-ink-muted">
              Antippen zum Hervorheben
            </span>
          </div>
          <div className="chip-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
            {regions.map((region) => {
              const active = selectedRegion?.code === region.code;
              return (
                <button
                  key={region.code}
                  type="button"
                  onClick={() =>
                    onSelectRegion(active ? null : region)
                  }
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                    active
                      ? "border-coral bg-coral text-white"
                      : "border-line bg-white/80 text-ink hover:border-teal hover:text-teal"
                  }`}
                >
                  {region.name_de}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedRegion && (
        <div className="mt-2 rounded-xl border border-line/80 bg-white/70 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {country.region_label ?? "Region"}
              </div>
              <div className="text-xs font-bold">{selectedRegion.name_de}</div>
            </div>
            <div className="text-right text-[11px] text-ink-muted">
              {numberFormat.format(selectedRegion.area_km2)} km²
            </div>
          </div>
        </div>
      )}

      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => onStartRun(country.code)}
          className="flex-1 rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.99]"
        >
          Quiz starten
        </button>
        <button
          type="button"
          onClick={() => onOpenAtlas(country)}
          className="rounded-xl border border-line bg-white/70 px-3 py-2 text-xs font-bold text-ink transition hover:border-teal hover:text-teal"
        >
          📖 Atlas
        </button>
      </div>

      <p className="mt-1.5 text-center text-[9px] text-ink-muted">
        Kartenweis v{APP_VERSION} · Karten: Natural Earth (Public Domain) ·{" "}
        {country.population_year
          ? `Einwohner ${country.population_year}`
          : "Einwohner ca."}
      </p>
    </div>
  );
}
