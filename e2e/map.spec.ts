import { test, expect } from "@playwright/test";

test("loads the Europe map and selects Germany and Bavaria", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText("Europa entdecken")).toBeVisible({
    timeout: 20_000,
  });

  await page.waitForFunction(
    () => Boolean((window as unknown as { __map?: { loaded(): boolean } }).__map?.loaded()),
  );

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
