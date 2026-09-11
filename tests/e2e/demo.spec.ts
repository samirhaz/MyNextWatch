import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
test("desktop tracker, keyboard navigation, and accessible dashboard", async ({ page }) => {
  await page.goto("/demo/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome back, Alex." })).toBeVisible();
  await expect(page.getByText("Sample data. Try the controls", { exact: false })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  if (process.env.CAPTURE_SCREENSHOTS === "1") {
    await mkdir("docs/screenshots", { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.getByRole("heading", { name: "Welcome back, Alex." }).click();
    await page.evaluate(() => {
      for (const image of document.images) image.loading = "eager";
    });
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
    await page.screenshot({ path: "docs/screenshots/dashboard-desktop.png", fullPage: true });
  }
});
test("demo creates a list, adds/removes titles, and preserves it through navigation only", async ({
  page,
}) => {
  await page.goto("/demo/lists");
  await page.getByRole("button", { name: "Create a list", exact: true }).click();
  await page.getByLabel("List name").fill("Rainy Sunday cinema");
  await page.getByLabel("Description · Optional").fill("A cozy sample collection.");
  await page.getByRole("button", { name: "Create list", exact: true }).click();
  await page
    .getByRole("main")
    .getByRole("link", { name: /Rainy Sunday cinema/ })
    .click();
  await page.getByRole("button", { name: "Add titles", exact: true }).click();
  await page.getByRole("button", { name: "Add Dune: Part Two to this list", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: "View Dune: Part Two", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove from this list", exact: true }).click();
  await expect(page.getByRole("link", { name: "View Dune: Part Two", exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "List not found" })).toBeVisible();
});
test("tracking supports ratings, nullable ratings, notes, and watching status", async ({
  page,
}) => {
  await page.goto("/demo/title/movie/693134");
  await page.getByLabel("Tracking status").selectOption("WATCHING");
  await page.getByRole("combobox", { name: "Your rating", exact: true }).selectOption("10");
  await page.getByLabel(/Private notes/).fill("A sample note.");
  await page.getByRole("button", { name: "Save tracking" }).click();
  await expect(page.getByText("Changes saved · Demo only")).toBeVisible();
  await page.getByRole("combobox", { name: "Your rating", exact: true }).selectOption("");
  await page.getByRole("button", { name: "Save tracking" }).click();
  await expect(page.getByRole("combobox", { name: "Your rating", exact: true })).toHaveValue("");
});
test("URL filtering, random pick, empty state, and missing poster", async ({ page }) => {
  await page.goto("/demo/watchlist?q=Interstellar");
  await expect(page.getByRole("link", { name: "View Interstellar", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Dune: Part Two", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Pick my next watch" }).click();
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "View Interstellar", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("textbox", { name: "Search your collection" }).fill("no-such-film");
  await expect(page.getByRole("heading", { name: "No titles in this scene." })).toBeVisible();
  await page.goto("/demo/discover?q=Unwritten");
  await expect(page.getByText("Poster unavailable")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View The Unwritten Chapter", exact: true }),
  ).toBeVisible();
});
test("mobile navigation, long titles, reduced motion, and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/dashboard");
  if (process.env.CAPTURE_SCREENSHOTS === "1") {
    await mkdir("docs/screenshots", { recursive: true });
    await page.evaluate(() => {
      for (const image of document.images) image.loading = "eager";
    });
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
    await page.screenshot({ path: "docs/screenshots/dashboard-mobile.png", fullPage: true });
  }
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "My Library", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your library." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
});
test("private endpoints do not accept unauthenticated reads or writes", async ({ request }) => {
  expect([401, 503]).toContain((await request.get("/api/me")).status());
  expect([401, 503]).toContain((await request.get("/api/lists/unknown")).status());
  expect(
    (
      await request.post("/api/lists", {
        headers: { origin: "https://attacker.example" },
        data: { name: "Attack" },
      })
    ).status(),
  ).toBe(403);
  expect([401, 503]).toContain(
    (
      await request.post("/api/library", {
        headers: { origin: "http://localhost:3000" },
        data: { mediaType: "movie", tmdbId: 1 },
      })
    ).status(),
  );
});
