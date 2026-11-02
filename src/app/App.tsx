import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import MapView from "../map/MapView";
import CountrySheet from "../components/CountrySheet";
import QuestionCard from "../components/QuestionCard";
import ResultCard from "../components/ResultCard";
import RunHud from "../components/RunHud";
import {
  loadCountries,
  loadDachRegions,
  loadEuropeMap,
  loadFacts,
  loadReveals,
} from "../data/load";
import { buildRun } from "../game/questions";
import { mulberry32 } from "../game/random";
import { evaluateAnswer } from "../game/scoring";
import { questionHasReveal } from "../game/reveal";
import { masteryMap, useProgress } from "../store/progress";
import type {
  CountriesDataset,
  Country,
  Region,
  RegionFeatureCollection,
} from "../data/types";
import type {
  AnswerFeedback,
  Fact,
  RevealMap,
  RunConfig,
  RunState,
  RunSummary,
  UserAnswer,
} from "../game/types";

type Mode = "browse" | "run" | "result";

export default function App() {
  const [dataset, setDataset] = useState<CountriesDataset | null>(null);
  const [europe, setEurope] = useState<FeatureCollection<Geometry> | null>(
    null,
  );
  const [regionsGeo, setRegionsGeo] =
    useState<RegionFeatureCollection | null>(null);
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [reveals, setReveals] = useState<RevealMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [mode, setMode] = useState<Mode>("browse");
  const [run, setRun] = useState<RunState | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const recordAnswer = useProgress((state) => state.recordAnswer);
  const recordRun = useProgress((state) => state.recordRun);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __app?: unknown }).__app = {
      mode,
      run,
      feedback,
      summary,
    };
  }, [mode, run, feedback, summary]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      loadCountries(),
      loadEuropeMap(),
      loadDachRegions(),
      loadFacts(),
      loadReveals(),
    ])
      .then(([countries, map, regions, factList, revealMap]) => {
        if (cancelled) return;
        setDataset(countries);
        setEurope(map);
        setRegionsGeo(regions);
        setFacts(factList);
        setReveals(revealMap);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Die Spieldaten konnten nicht geladen werden.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const regions = useMemo(
    () =>
      regionsGeo
        ? regionsGeo.features.map(
            (feature) => feature.properties as Region,
          )
        : [],
    [regionsGeo],
  );

  const activeQuestion =
    mode === "run" && run ? (run.questions[run.index] ?? null) : null;
  const showRevealHint =
    activeQuestion && reveals
      ? questionHasReveal(activeQuestion, reveals)
      : false;

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

  const startRun = useCallback(
    (scope: "europe" | "country", countryCode?: string) => {
      if (!dataset || !facts) return;

      const config: RunConfig = {
        scope,
        countryCode,
        count: 10,
        seed: Math.floor(Math.random() * 0xffffffff),
      };
      const questions = buildRun(
        config,
        dataset.countries,
        regions,
        facts,
        masteryMap(),
        mulberry32(config.seed),
      );

      if (questions.length === 0) return;

      setSelectedCountry(null);
      setSelectedRegion(null);
      setRun({
        config,
        questions,
        index: 0,
        score: 0,
        streak: 0,
        bestStreak: 0,
        correctCount: 0,
        startedAt: Date.now(),
      });
      setFeedback(null);
      setSummary(null);
      setMode("run");
    },
    [dataset, facts, regions],
  );

  const handleStartEurope = useCallback(() => {
    startRun("europe");
  }, [startRun]);

  const handleStartCountry = useCallback(
    (countryCode: string) => {
      startRun("country", countryCode);
    },
    [startRun],
  );

  const handleRunAnswer = useCallback(
    (answer: UserAnswer) => {
      if (!run || feedback) return;
      const question = run.questions[run.index];
      if (!question) return;

      const evaluation = evaluateAnswer(question, answer, run.streak);
      recordAnswer(question.factId, evaluation.correct);
      setFeedback(evaluation.feedback);
      setRun((previous) => {
        if (!previous) return previous;
        const nextStreak = evaluation.correct
          ? previous.streak + 1
          : 0;
        return {
          ...previous,
          score: previous.score + evaluation.points,
          streak: nextStreak,
          bestStreak: Math.max(previous.bestStreak, nextStreak),
          correctCount:
            previous.correctCount + (evaluation.correct ? 1 : 0),
        };
      });
    },
    [run, feedback, recordAnswer],
  );

  const handleSkip = useCallback(() => {
    if (!run || feedback) return;
    const question = run.questions[run.index];
    if (!question) return;

    recordAnswer(question.factId, false);
    setFeedback({
      correct: false,
      points: 0,
      answerLabel: question.answer.label,
      userLabel: null,
      distanceKm: null,
      precision: null,
      fact: question.fact,
    });
    setRun((previous) =>
      previous ? { ...previous, streak: 0 } : previous,
    );
  }, [run, feedback, recordAnswer]);

  const handleNext = useCallback(() => {
    if (!run) return;

    if (run.index + 1 < run.questions.length) {
      setRun({ ...run, index: run.index + 1 });
      setFeedback(null);
      return;
    }

    const result: RunSummary = {
      config: run.config,
      score: run.score,
      correctCount: run.correctCount,
      total: run.questions.length,
      bestStreak: run.bestStreak,
      startedAt: run.startedAt,
      finishedAt: Date.now(),
    };
    recordRun(result);
    setSummary(result);
    setFeedback(null);
    setMode("result");
  }, [run, recordRun]);

  const handleRestart = useCallback(() => {
    if (!summary) return;
    startRun(summary.config.scope, summary.config.countryCode);
  }, [summary, startRun]);

  const handleExitRun = useCallback(() => {
    if (
      mode === "run" &&
      !window.confirm(
        "Run beenden? Der Fortschritt in diesem Run geht verloren.",
      )
    ) {
      return;
    }
    setMode("browse");
    setRun(null);
    setFeedback(null);
    setSummary(null);
  }, [mode]);

  const handleExitResult = useCallback(() => {
    setMode("browse");
    setRun(null);
    setFeedback(null);
    setSummary(null);
  }, []);

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

  if (!dataset || !europe || !regionsGeo || !facts || !reveals) {
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
    <main className="map-shell flex flex-col">
      <div className="relative min-h-0 flex-1">
        <MapView
          countries={dataset.countries}
          europe={europe}
          regions={regionsGeo}
          selectedCountry={selectedCountry}
          selectedRegion={selectedRegion}
          onSelectCountry={handleSelectCountry}
          onSelectRegion={handleSelectRegion}
          runQuestion={activeQuestion}
          runFeedback={mode === "run" ? feedback : null}
          onRunAnswer={handleRunAnswer}
          reveals={reveals}
        />

        {mode === "browse" && (
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
                  Europa · {dataset.countries.length} Länder · M1
                </div>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartEurope}
                  className="rounded-full bg-teal px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.98]"
                >
                  ▶ <span className="hidden sm:inline">Europa-</span>Run
                </button>
                <button
                  type="button"
                  disabled
                  aria-label="Einstellungen (kommt später)"
                  className="hidden h-9 w-9 place-items-center rounded-full bg-paper-deep text-sm text-ink-muted opacity-70 sm:grid"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </header>
        )}

        {mode === "run" && run && activeQuestion && (
          <RunHud run={run} onExit={handleExitRun} />
        )}
      </div>

      {mode === "browse" && (
        <div className="relative z-20 shrink-0">
          <CountrySheet
            country={selectedCountry}
            regions={regions.filter(
              (region) => region.country === selectedCountry?.code,
            )}
            selectedRegion={selectedRegion}
            onSelectRegion={handleSelectRegion}
            onClose={handleClose}
            onStartRun={handleStartCountry}
            onStartEurope={handleStartEurope}
          />
        </div>
      )}

      {mode === "run" && run && activeQuestion && (
        <div className="relative z-30 shrink-0">
          <QuestionCard
            question={activeQuestion}
            feedback={feedback}
            onAnswer={handleRunAnswer}
            onNext={handleNext}
            onSkip={handleSkip}
            isLast={run.index + 1 >= run.questions.length}
            showRevealHint={showRevealHint}
          />
        </div>
      )}

      {mode === "result" && summary && (
        <ResultCard
          summary={summary}
          onRestart={handleRestart}
          onExit={handleExitResult}
        />
      )}
    </main>
  );
}
