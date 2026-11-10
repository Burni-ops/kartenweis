import { test, expect, type Page } from "@playwright/test";

type RunQuestion = {
  category: string;
  interaction: string;
  answer: { label: string };
};

type AppState = {
  run?: { index: number; questions: RunQuestion[] };
};

async function currentQuestion(page: Page): Promise<RunQuestion | null> {
  return page.evaluate(() => {
    const run = (
      window as unknown as { __app?: { run?: AppState["run"] } }
    ).__app?.run;
    return run ? (run.questions[run.index] ?? null) : null;
  });
}

/** Answer (or skip) the current question and wait until the next one is shown. */
async function advanceQuestion(page: Page) {
  const before = await page.evaluate(
    () =>
      (
        window as unknown as { __app?: { run?: AppState["run"] } }
      ).__app?.run?.index ?? 0,
  );

  const skip = page.getByRole("button", { name: "Ich weiß es nicht" });
  if ((await skip.count()) > 0) {
    await skip.first().click();
  } else {
    const option = page
      .locator(".sheet button")
      .filter({ hasNotText: "Ich weiß es nicht" })
      .first();
    await option.click();
  }

  const next = page.getByRole("button", { name: /Weiter|Ergebnis ansehen/ });
  await expect(next).toBeVisible({ timeout: 20_000 });
  await next.click();

  await page.waitForFunction(
    (previous) => {
      const run = (
        window as unknown as { __app?: { run?: AppState["run"] } }
      ).__app?.run;
      return !run || run.index > previous;
    },
    before,
    { timeout: 20_000 },
  );
}

async function waitForMapSettled(page: Page) {
  await page.waitForFunction(
    () =>
      Boolean(
        (window as unknown as { __map?: { loaded(): boolean } }).__map?.loaded(),
      ),
    undefined,
    { timeout: 30_000 },
  );
  // Give the initial continent fit animation time to finish before projecting.
  await page.waitForTimeout(1_500);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const map = (
          window as unknown as {
            __map?: {
              isMoving(): boolean;
              once(event: string, callback: () => void): void;
            };
          }
        ).__map;
        if (!map || !map.isMoving()) {
          resolve();
          return;
        }
        map.once("idle", () => resolve());
      }),
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "kartenweis.settings.v1",
      JSON.stringify({
        state: {
          sound: false,
          reducedMotion: true,
          difficulty: "auto",
          onboardingDone: true,
        },
        version: 1,
      }),
    );
  });
});

test("loads the Europe map and selects Germany and Bavaria", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText("Länder entdecken")).toBeVisible({
    timeout: 20_000,
  });

  await waitForMapSettled(page);
  await page.evaluate(() => {
    (
      window as unknown as {
        __map: { jumpTo(options: { center: [number, number]; zoom: number }): void };
      }
    ).__map.jumpTo({ center: [10.45, 51.16], zoom: 5 });
  });
  await page.waitForTimeout(500);

  const point = await page.evaluate(() => {
    const map = (
      window as unknown as {
        __map: { project(coordinate: [number, number]): { x: number; y: number } };
      }
    ).__map;
    return map.project([10.45, 51.16]);
  });

  await page.mouse.click(point.x, point.y);

  await expect(
    page.getByRole("heading", { name: "Deutschland" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Bayern", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Bayern", exact: true }).click();
  await expect(page.getByText("69.894 km²")).toBeVisible();
});

test("starts a Europe run and gives feedback on the first question", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Länder entdecken")).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: /Europa-Run starten/ }).click();
  await expect(page.getByText(/Frage 1\b/)).toBeVisible();

  const question = await page.evaluate(() => {
    const app = (
      window as unknown as {
        __app?: {
          run?: {
            questions: Array<{
              interaction: string;
              answer: { label: string };
            }>;
            index: number;
          };
        };
      }
    ).__app;
    if (!app?.run) return null;
    return app.run.questions[app.run.index];
  });

  expect(question).not.toBeNull();

  if (question?.interaction === "mc") {
    await page
      .getByRole("button", { name: question.answer.label, exact: true })
      .click();
  } else {
    await page
      .getByRole("button", { name: "Ich weiß es nicht" })
      .click();
  }

  await expect(page.getByText(/Richtig!|Leider falsch/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Weiter" })).toBeVisible();
});

test("reveals a sea or strait answer on the map", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await expect(page.getByText("Länder entdecken")).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: /Europa-Run starten/ }).click();
  await expect(page.getByText(/Frage 1\b/)).toBeVisible();

  // Walk forward until a sea or strait question shows up. The question bank is
  // randomized, so search the live run instead of assuming a fixed position.
  let target: RunQuestion | null = null;
  for (let step = 0; step < 30; step += 1) {
    const question = await currentQuestion(page);
    if (!question) break;
    if (question.category === "sea" || question.category === "strait") {
      target = question;
      break;
    }
    await advanceQuestion(page);
  }

  expect(target, "sea or strait question in the run").not.toBeNull();

  await page
    .getByRole("button", { name: target!.answer.label, exact: true })
    .click();

  await expect(page.locator(".reveal-label")).toBeVisible();
  await expect(page.locator(".reveal-label")).toContainText(target!.answer.label);
});

test("opens the atlas, selects a river and reveals it on the map", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Länder entdecken")).toBeVisible({
    timeout: 20_000,
  });

  await waitForMapSettled(page);
  await page.evaluate(() => {
    (
      window as unknown as {
        __map: { jumpTo(options: { center: [number, number]; zoom: number }): void };
      }
    ).__map.jumpTo({ center: [10.45, 51.16], zoom: 5 });
  });
  await page.waitForTimeout(500);
  const point = await page.evaluate(() => {
    const map = (
      window as unknown as {
        __map: {
          project(coordinate: [number, number]): { x: number; y: number };
        };
      }
    ).__map;
    return map.project([10.45, 51.16]);
  });
  await page.mouse.click(point.x, point.y);
  await expect(
    page.getByRole("heading", { name: "Deutschland" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Atlas/ }).click();
  await expect(page.getByText("Länder-Atlas")).toBeVisible();

  await page.getByRole("button", { name: "🌊 Flüsse", exact: true }).click();
  const riverCard = page
    .locator(".sheet button")
    .filter({ hasText: "Rhein" })
    .first();
  await expect(riverCard).toBeVisible();
  await riverCard.click();

  await expect(page.locator(".reveal-label")).toBeVisible();
  await expect(page.locator(".reveal-label")).toContainText("Rhein");
});

test("switches continents and starts a world run", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Länder entdecken")).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: /Asien/ }).click();
  await expect(page.getByText(/Asien · 47 Länder/)).toBeVisible();

  await page
    .getByRole("button", { name: "Welt-Run starten", exact: true })
    .click();
  await expect(page.getByText(/Frage 1\b/)).toBeVisible();

  const run = await page.evaluate(() => {
    const app = (
      window as unknown as {
        __app?: {
          run?: {
            config: { scope: string; count: number };
            questions: Array<{ countryCode: string }>;
          };
        };
      }
    ).__app;
    return app?.run
      ? {
          scope: app.run.config.scope,
          count: app.run.questions.length,
        }
      : null;
  });

  expect(run?.scope).toBe("world");
  expect(run?.count).toBeGreaterThanOrEqual(10);
});

test("shows an update banner when GitHub has a newer release", async ({
  page,
}) => {
  await page.route(
    "https://api.github.com/repos/Burni-ops/kartenweis/releases/latest",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tag_name: "v99.0.0",
          html_url: "https://github.com/Burni-ops/kartenweis/releases/tag/v99.0.0",
          name: "Kartenweis 99",
        }),
      }),
  );

  await page.goto("/");
  await expect(page.getByText("Länder entdecken")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByText(/Update v99\.0\.0 verfügbar/),
  ).toBeVisible({ timeout: 10_000 });
});

test("opens settings and credits", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Länder entdecken")).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: "Einstellungen öffnen" }).click();
  await expect(page.getByText("Einstellungen")).toBeVisible();
  await expect(page.getByText("Credits & Quellen")).toBeVisible();
  await page
    .getByRole("button", { name: "Einstellungen schließen" })
    .click();
});

test("opens the collection and the daily challenge", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Länder entdecken")).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: "Sammlung öffnen" }).click();
  await expect(page.getByText("Fortschritt & Erfolge")).toBeVisible();
  await page.getByRole("button", { name: "Sammlung schließen" }).click();

  await page
    .getByRole("button", { name: "📅 Tages-Challenge starten", exact: true })
    .click();
  await expect(page.getByText(/Frage 1\b/)).toBeVisible();

  const daily = await page.evaluate(() => {
    const app = (
      window as unknown as {
        __app?: { run?: { config: { daily?: boolean } } };
      }
    ).__app;
    return Boolean(app?.run?.config.daily);
  });
  expect(daily).toBe(true);
});
