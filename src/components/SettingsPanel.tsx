import { useSettings, type Difficulty } from "../store/settings";

type Props = {
  onClose: () => void;
};

const DIFFICULTIES: Array<{ id: Difficulty; label: string }> = [
  { id: "auto", label: "Adaptiv" },
  { id: "easy", label: "Entdecker" },
  { id: "hard", label: "Meister" },
];

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center gap-3 rounded-2xl border border-line/70 bg-white/70 px-3.5 py-3 text-left transition hover:border-teal/50"
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{label}</div>
        <div className="text-xs text-ink-muted">{description}</div>
      </div>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          value ? "bg-teal" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function SettingsPanel({ onClose }: Props) {
  const sound = useSettings((state) => state.sound);
  const reducedMotion = useSettings((state) => state.reducedMotion);
  const difficulty = useSettings((state) => state.difficulty);
  const setSound = useSettings((state) => state.setSound);
  const setReducedMotion = useSettings(
    (state) => state.setReducedMotion,
  );
  const setDifficulty = useSettings((state) => state.setDifficulty);

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-ink/35 p-3 backdrop-blur-sm sm:p-6">
      <div className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/70 bg-paper p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-soft text-xl">
            ⚙️
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">
              Spasmitflaggen
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Einstellungen
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Einstellungen schließen"
            className="grid h-9 w-9 place-items-center rounded-full bg-paper-deep text-ink-muted transition hover:bg-line hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          <Toggle
            label="Sound"
            description="Kurze Töne bei richtig/falsch und beim Start."
            value={sound}
            onChange={setSound}
          />
          <Toggle
            label="Reduzierte Bewegung"
            description="Weniger Animationen und Karten-Zooms."
            value={reducedMotion}
            onChange={setReducedMotion}
          />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
            Schwierigkeit
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {DIFFICULTIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDifficulty(item.id)}
                className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                  difficulty === item.id
                    ? "border-teal bg-teal text-white"
                    : "border-line bg-white/70 text-ink-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-ink-muted">
            Die Auswahl wird gespeichert; die adaptive Auswahl ist der
            Standard.
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-line/70 bg-white/60 px-3.5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">Sprache</div>
              <div className="text-xs text-ink-muted">
                Deutsch · Englisch folgt
              </div>
            </div>
            <span className="rounded-full bg-paper-deep px-2.5 py-1 text-[10px] font-bold text-ink-muted">
              DE
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-line/70 bg-white/60 px-3.5 py-3">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
            Credits & Quellen
          </div>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-muted">
            <li>
              <strong className="text-ink">Natural Earth 1:10m</strong> —
              Karten, Grenzen, Flüsse, Seen, Meere (Public Domain). „Made
              with Natural Earth.“
            </li>
            <li>
              <strong className="text-ink">Wikidata</strong> — Hauptstädte,
              höchste Punkte, Koordinaten (CC0).
            </li>
            <li>
              <strong className="text-ink">World Bank Open Data</strong> —
              Einwohner und Fläche (CC BY 4.0).
            </li>
            <li>
              <strong className="text-ink">Flagpedia / flagcdn.com</strong> —
              Flaggen (freie Nutzung, Backlink).
            </li>
            <li>
              <strong className="text-ink">MapLibre GL JS</strong> —
              Kartenrenderer (BSD-3-Clause).
            </li>
            <li>
              <strong className="text-ink">React, Vite, Tailwind, mapshaper</strong>{" "}
              — Open Source (MIT).
            </li>
          </ul>
          <p className="mt-2 text-[10px] text-ink-muted">
            Prototyp M3 · Angaben ohne Gewähr · Keine Accounts, keine
            Werbung, kein Tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl bg-teal px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal/90"
        >
          Fertig
        </button>
      </div>
    </div>
  );
}
