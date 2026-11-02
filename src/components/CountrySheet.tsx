import type { Country, Region } from "../data/types";

const numberFormat = new Intl.NumberFormat("de-DE");
const compactFormat = new Intl.NumberFormat("de-DE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type Props = {
  country: Country | null;
  regions: Region[];
  selectedRegion: Region | null;
  onSelectRegion: (region: Region | null) => void;
  onClose: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper-deep/70 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold text-ink">{value}</div>
    </div>
  );
}

export default function CountrySheet({
  country,
  regions,
  selectedRegion,
  onSelectRegion,
  onClose,
}: Props) {
  if (!country) {
    return (
      <div className="sheet safe-bottom sheet-enter pointer-events-auto mx-auto w-[94%] max-w-xl rounded-t-3xl px-5 pt-5 sm:mb-5 sm:rounded-3xl">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-soft text-xl">
            🧭
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight">
              Europa entdecken
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Tippe auf ein Land. Bei Deutschland, Österreich und der Schweiz
              kannst du anschließend die Bundesländer bzw. Kantone erkunden.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Karten: Natural Earth (Public Domain) · Prototyp M0
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
    <div className="sheet safe-bottom sheet-enter pointer-events-auto mx-auto w-[94%] max-w-xl rounded-t-3xl px-5 pt-4 sm:mb-5 sm:rounded-3xl">
      <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/15 sm:hidden" />

      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm">
          <img
            src={country.flag_url}
            alt={`Flagge von ${country.name.de}`}
            className="h-9 w-9 rounded-lg object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">
            Europa
          </div>
          <h2 className="truncate text-xl font-extrabold tracking-tight">
            {country.name.de}
          </h2>
          <p className="truncate text-sm text-ink-muted">
            {country.capital
              ? `Hauptstadt: ${country.capital.name_de}`
              : "Hauptstadt: —"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-deep text-ink-muted transition hover:bg-line hover:text-ink"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
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

      {country.has_regions && regions.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
              {regionLabel}
            </h3>
            <span className="text-[11px] text-ink-muted">
              Antippen zum Hervorheben
            </span>
          </div>
          <div className="chip-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {regions.map((region) => {
              const active = selectedRegion?.code === region.code;
              return (
                <button
                  key={region.code}
                  type="button"
                  onClick={() =>
                    onSelectRegion(active ? null : region)
                  }
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
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
        <div className="mt-3 rounded-2xl border border-line/80 bg-white/70 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                {country.region_label ?? "Region"}
              </div>
              <div className="text-sm font-bold">{selectedRegion.name_de}</div>
            </div>
            <div className="text-right text-xs text-ink-muted">
              {numberFormat.format(selectedRegion.area_km2)} km²
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled
          className="flex-1 rounded-2xl bg-teal px-4 py-2.5 text-sm font-bold text-white opacity-60"
          title="Kommt in M1"
        >
          Quiz starten
        </button>
        <button
          type="button"
          disabled
          className="rounded-2xl border border-line bg-white/70 px-4 py-2.5 text-sm font-bold text-ink-muted opacity-60"
          title="Kommt in M2"
        >
          Atlas
        </button>
      </div>

      <p className="mt-2 text-center text-[10px] text-ink-muted">
        Prototyp M0 · Karten: Natural Earth (Public Domain) ·{" "}
        {country.population_year
          ? `Einwohner ${country.population_year}`
          : "Einwohner ca."}
      </p>
    </div>
  );
}
