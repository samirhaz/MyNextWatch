import { test, expect } from "@playwright/test";

test("GitHub sign-in works before JavaScript hydration without weakening shared-link privacy", async ({
  browser,
  request,
}) => {
  test.skip(
    process.env.ALLOW_DISPOSABLE_DATABASE_TESTS !== "1",
    "Requires the configured disposable browser-test environment.",
  );
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const response = await page.goto("http://localhost:3000/signin");
    expect(response?.headers()["referrer-policy"]).toBe("same-origin");
    const [redirectResponse] = await Promise.all([
      page.waitForResponse(
        (result) =>
          new URL(result.url()).pathname === "/signin" && result.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Continue with GitHub" }).click({ noWaitAfter: true }),
    ]);
    expect(redirectResponse.status()).toBe(303);
    const destination = new URL((await redirectResponse.allHeaders()).location);
    expect(destination.hostname).toBe("github.com");
    expect(destination.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/callback/github",
    );
    const shared = await request.get("/share/invalid");
    expect(shared.headers()["referrer-policy"]).toBe("no-referrer");
  } finally {
    await context.close();
  }
});
