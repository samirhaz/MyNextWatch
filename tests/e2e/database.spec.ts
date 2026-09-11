import { randomBytes, randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { createDatabaseClient } from "../../src/lib/server/database-client";
import { testDatabaseUrl } from "../../scripts/test-database-guard";
test("real sessions enforce ownership, persist through refresh, and provide revocable read-only sharing", async ({
  browser,
}) => {
  test.skip(
    process.env.ALLOW_DISPOSABLE_DATABASE_TESTS !== "1",
    "Run npm run test:e2e:db with a disposable MySQL database.",
  );
  const db = createDatabaseClient(testDatabaseUrl());
  const suffix = randomUUID();
  const userA = `e2e-a-${suffix}`,
    userB = `e2e-b-${suffix}`,
    titleId = `e2e-title-${suffix}`;
  const tokenA = randomBytes(32).toString("hex"),
    tokenB = randomBytes(32).toString("hex");
  const tmdbId = 1800000000 + Math.floor(Math.random() * 1000000);
  const contextA = await browser.newContext({ baseURL: "http://localhost:3000" }),
    contextB = await browser.newContext({ baseURL: "http://localhost:3000" }),
    visitor = await browser.newContext({ baseURL: "http://localhost:3000" });
  try {
    await db.user.createMany({
      data: [
        { id: userA, name: "Owner A", email: `${userA}@example.invalid` },
        { id: userB, name: "Visitor B", email: `${userB}@example.invalid` },
      ],
    });
    await db.session.createMany({
      data: [
        { userId: userA, sessionToken: tokenA, expires: new Date(Date.now() + 3600000) },
        { userId: userB, sessionToken: tokenB, expires: new Date(Date.now() + 3600000) },
      ],
    });
    await db.title.create({
      data: {
        id: titleId,
        mediaType: "movie",
        tmdbId,
        name: "Persistence test film",
        overview: "Synthetic integration fixture",
        genres: [],
        seasons: [],
        providers: {},
        providersUpdatedAt: new Date(),
      },
    });
    await contextA.addCookies([
      {
        name: "authjs.session-token",
        value: tokenA,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await contextB.addCookies([
      {
        name: "authjs.session-token",
        value: tokenB,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const origin = { origin: "http://localhost:3000" };
    const ref = { mediaType: "movie", tmdbId };
    expect(
      (
        await contextA.request.post("http://localhost:3000/api/library", {
          headers: origin,
          data: ref,
        })
      ).ok(),
    ).toBe(true);
    const pageA = await contextA.newPage();
    await pageA.goto("/library");
    await expect(
      pageA.getByRole("link", { name: "View Persistence test film", exact: true }),
    ).toBeVisible();
    await pageA.reload();
    await expect(
      pageA.getByRole("link", { name: "View Persistence test film", exact: true }),
    ).toBeVisible();
    const entry = await db.libraryEntry.findUniqueOrThrow({
      where: { userId_titleId: { userId: userA, titleId } },
    });
    expect(
      (
        await contextB.request.patch(`http://localhost:3000/api/library/${entry.id}`, {
          headers: origin,
          data: { rating: 1 },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await contextB.request.delete(`http://localhost:3000/api/library/${entry.id}`, {
          headers: origin,
        })
      ).status(),
    ).toBe(404);
    const created = await contextA.request.post("http://localhost:3000/api/lists", {
      headers: origin,
      data: { name: "Private test list", description: "Explicitly shared later" },
    });
    const { id: listId } = await created.json();
    expect((await contextB.request.get(`http://localhost:3000/api/lists/${listId}`)).status()).toBe(
      404,
    );
    expect((await visitor.request.get(`http://localhost:3000/api/lists/${listId}`)).status()).toBe(
      401,
    );
    expect(
      (
        await contextA.request.post(`http://localhost:3000/api/lists/${listId}/items`, {
          headers: origin,
          data: ref,
        })
      ).ok(),
    ).toBe(true);
    await contextA.request.patch(`http://localhost:3000/api/library/${entry.id}`, {
      headers: origin,
      data: { rating: 9, notes: "OWNER SECRET NOTE" },
    });
    const share = await contextA.request.post(`http://localhost:3000/api/shares/${listId}`, {
      headers: origin,
      data: { action: "enable" },
    });
    const { path } = await share.json();
    const token = path.split("/").at(-1);
    const publicResponse = await visitor.request.get(`http://localhost:3000/api/shared/${token}`);
    expect(publicResponse.ok()).toBe(true);
    const publicText = await publicResponse.text();
    expect(publicText).not.toContain("OWNER SECRET NOTE");
    expect(publicText).not.toContain("example.invalid");
    expect(
      (
        await visitor.request.post(`http://localhost:3000/api/shared/${token}`, {
          data: { name: "Tamper" },
        })
      ).status(),
    ).toBe(405);
    const pageB = await contextB.newPage();
    await pageB.goto(path);
    await expect(pageB.getByRole("heading", { name: "Private test list" })).toBeVisible();
    await pageB.getByRole("button", { name: "Save to my watchlist" }).click();
    await expect(pageB.getByRole("button", { name: "Saved to your library" })).toBeVisible();
    expect(await db.libraryEntry.count({ where: { userId: userB, titleId } })).toBe(1);
    const regenerated = await contextA.request.post(`http://localhost:3000/api/shares/${listId}`, {
      headers: origin,
      data: { action: "regenerate" },
    });
    const nextToken = (await regenerated.json()).path.split("/").at(-1);
    expect((await visitor.request.get(`http://localhost:3000/api/shared/${token}`)).status()).toBe(
      404,
    );
    await contextA.request.post(`http://localhost:3000/api/shares/${listId}`, {
      headers: origin,
      data: { action: "disable" },
    });
    expect(
      (await visitor.request.get(`http://localhost:3000/api/shared/${nextToken}`)).status(),
    ).toBe(404);
    await contextA.request.delete(`http://localhost:3000/api/lists/${listId}/items/${titleId}`, {
      headers: origin,
    });
    expect(await db.listItem.count({ where: { listId } })).toBe(0);
    expect((await db.libraryEntry.findUniqueOrThrow({ where: { id: entry.id } })).rating).toBe(9);

    // Exercise loading, failed upstream requests, and retry without claiming a live TMDB call.
    await pageA.route("**/api/reference?*", (route) =>
      route.fulfill({ json: { genres: [], providers: [], countries: [] } }),
    );
    let releaseCatalog = () => {};
    const pendingCatalog = new Promise<void>((resolve) => {
      releaseCatalog = resolve;
    });
    let failCatalog = true;
    await pageA.route("**/api/catalog?*", async (route) => {
      if (failCatalog) {
        await pendingCatalog;
        await route.fulfill({ status: 503, json: { error: "Temporary catalog failure" } });
      } else {
        await route.fulfill({ json: { results: [], page: 1, totalPages: 1, totalResults: 0 } });
      }
    });
    await pageA.goto("/discover");
    await expect(pageA.getByRole("status", { name: "Loading titles" })).toBeVisible();
    releaseCatalog();
    await expect(pageA.getByRole("main").getByRole("alert")).toContainText(
      "Temporary catalog failure",
    );
    failCatalog = false;
    await pageA.getByRole("button", { name: "Try again" }).click();
    await expect(pageA.getByRole("heading", { name: "No matches, yet." })).toBeVisible();
  } finally {
    await Promise.all([contextA.close(), contextB.close(), visitor.close()]);
    await db.user.deleteMany({ where: { id: { in: [userA, userB] } } });
    await db.title.deleteMany({ where: { id: titleId } });
    await db.$disconnect();
  }
});
