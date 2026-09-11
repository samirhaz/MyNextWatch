import { afterEach, expect, it } from "vitest";
import { testDatabaseUrl } from "../../scripts/test-database-guard";
const previous = {
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  ALLOW_DISPOSABLE_DATABASE_TESTS: process.env.ALLOW_DISPOSABLE_DATABASE_TESTS,
};
afterEach(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
it("refuses production-named databases and non-MySQL URLs", () => {
  process.env.TEST_DATABASE_URL = "mysql://test:test@localhost:3307/mynextwatch";
  expect(testDatabaseUrl).toThrow();
  process.env.TEST_DATABASE_URL = "postgresql://test:test@localhost/mynextwatch_test";
  expect(testDatabaseUrl).toThrow();
});
it("requires a separate test connection unless a runner has already checked it", () => {
  const url = "mysql://test:test@localhost:3307/mynextwatch_test";
  process.env.TEST_DATABASE_URL = url;
  process.env.DATABASE_URL = url;
  delete process.env.ALLOW_DISPOSABLE_DATABASE_TESTS;
  expect(testDatabaseUrl).toThrow();
  process.env.ALLOW_DISPOSABLE_DATABASE_TESTS = "1";
  expect(testDatabaseUrl()).toBe(url);
});
