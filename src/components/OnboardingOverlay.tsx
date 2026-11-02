import { useState } from "react";

const STEPS = [
  {
    icon: "🌍",
    title: "Die Welt entdecken",
    text: "Tippe auf ein Land, um seinen Steckbrief, seine Regionen und alle Fakten zu sehen. Wechsle oben zwischen den Kontinenten.",
  },
  {
    icon: "🧭",
    title: "Fragen lösen",
    text: "Multiple Choice, Symbole auf die Karte ziehen, Länder und Regionen antippen. Nach der Antwort wird das Ziel auf der Karte gezeigt.",
  },
  {
    icon: "📖",
    title: "Atlas & Mastery",
    text: "Lerne im Länder-Atlas alle Fakten, sammle Sterne und meistere die Welt Frage für Frage.",
  },
];

type Props = {
  onDone: () => void;
};

export default function OnboardingOverlay({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="absolute inset-0 z-[60] grid place-items-center bg-ink/45 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-paper p-6 text-center shadow-2xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-teal-soft text-3xl">
          {current.icon}
        </div>
        <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-teal">
          Willkommen · {step + 1}/{STEPS.length}
        </div>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
          {current.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {current.text}
        </p>

        <div className="mt-4 flex justify-center gap-1.5">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={`h-1.5 rounded-full transition-all ${
                index === step ? "w-6 bg-teal" : "w-2 bg-line"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (isLast ? onDone() : setStep(step + 1))}
          className="mt-5 w-full rounded-2xl bg-teal px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.99]"
        >
          {isLast ? "Los geht’s" : "Weiter"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 text-xs font-bold text-ink-muted transition hover:text-ink"
        >
          Überspringen
        </button>
      </div>
    </div>
  );
}
