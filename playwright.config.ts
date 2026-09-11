import { defineConfig, devices } from "@playwright/test";
const withDatabase = process.env.ALLOW_DISPOSABLE_DATABASE_TESTS === "1";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000/demo/dashboard",
    timeout: 60000,
    reuseExistingServer: false,
    env: withDatabase
      ? {
          DATABASE_URL: process.env.TEST_DATABASE_URL!,
          DATABASE_SSL: "false",
          AUTH_SECRET: "mynextwatch-disposable-test-secret-not-for-production",
          AUTH_URL: "http://localhost:3000",
          AUTH_GITHUB_ID: "test-provider",
          AUTH_GITHUB_SECRET: "test-provider-secret",
          AUTH_TRUST_HOST: "true",
        }
      : { AUTH_GITHUB_ID: "", AUTH_GITHUB_SECRET: "", DATABASE_URL: "", AUTH_SECRET: "" },
  },
});
