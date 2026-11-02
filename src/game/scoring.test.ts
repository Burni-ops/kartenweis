import { describe, expect, it } from "vitest";
import { evaluateAnswer, streakMultiplier } from "./scoring";
import type { AnswerFeedback, Question, UserAnswer } from "./types";

const mcQuestion: Question = {
  factId: "test-capital",
  countryCode: "DE",
  category: "capital",
  interaction: "mc",
  prompt: "Hauptstadt?",
  options: ["Berlin", "Paris", "Rom", "Wien"],
  answer: { label: "Berlin" },
  fact: "Berlin ist die Hauptstadt.",
  source: "https://example.org",
  difficulty: 2,
  focus: { kind: "country", code: "DE" },
};

const dragQuestion: Question = {
  ...mcQuestion,
  factId: "test-drag",
  interaction: "drag",
  options: [],
  answer: { label: "Ziel", point: [10, 50] },
};

function feedbackOf(result: { feedback: AnswerFeedback }) {
  return result.feedback;
}

describe("evaluateAnswer", () => {
  it("scores a correct MC answer with the difficulty and streak multiplier", () => {
    const result = evaluateAnswer(
      mcQuestion,
      { kind: "mc", value: "Berlin" } satisfies UserAnswer,
      3,
    );
    expect(result.correct).toBe(true);
    expect(result.points).toBe(Math.round(200 * 1.3));
    expect(feedbackOf(result).answerLabel).toBe("Berlin");
  });

  it("scores a wrong MC answer with zero points", () => {
    const result = evaluateAnswer(
      mcQuestion,
      { kind: "mc", value: "Paris" } satisfies UserAnswer,
      5,
    );
    expect(result.correct).toBe(false);
    expect(result.points).toBe(0);
  });

  it("scores drag answers by distance", () => {
    const perfect = evaluateAnswer(
      dragQuestion,
      { kind: "drag", point: [10, 50] } satisfies UserAnswer,
      0,
    );
    expect(perfect.correct).toBe(true);
    expect(perfect.precision).toBe("perfect");
    expect(perfect.points).toBe(200);

    const close = evaluateAnswer(
      dragQuestion,
      { kind: "drag", point: [11.5, 50] } satisfies UserAnswer,
      0,
    );
    expect(close.correct).toBe(true);
    expect(close.precision).toBe("close");
    expect(close.points).toBe(100);

    const miss = evaluateAnswer(
      dragQuestion,
      { kind: "drag", point: [15, 50] } satisfies UserAnswer,
      0,
    );
    expect(miss.correct).toBe(false);
    expect(miss.points).toBe(0);
  });

  it("scores tap-country and tap-region answers", () => {
    const tapCountry: Question = {
      ...mcQuestion,
      factId: "test-country",
      interaction: "tap-country",
      options: [],
      answer: { label: "Deutschland", countryCode: "DE" },
      focus: { kind: "europe" },
    };
    expect(
      evaluateAnswer(
        tapCountry,
        { kind: "tap-country", countryCode: "DE" },
        0,
      ).correct,
    ).toBe(true);
    expect(
      evaluateAnswer(
        tapCountry,
        { kind: "tap-country", countryCode: "FR" },
        0,
      ).correct,
    ).toBe(false);

    const tapRegion: Question = {
      ...mcQuestion,
      factId: "test-region",
      interaction: "tap-region",
      options: [],
      answer: { label: "Bayern", regionCode: "DE-BY" },
    };
    expect(
      evaluateAnswer(
        tapRegion,
        { kind: "tap-region", regionCode: "DE-BY" },
        0,
      ).correct,
    ).toBe(true);
  });
});

describe("streakMultiplier", () => {
  it("caps at 2", () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(5)).toBeCloseTo(1.5);
    expect(streakMultiplier(10)).toBe(2);
    expect(streakMultiplier(30)).toBe(2);
  });
});
