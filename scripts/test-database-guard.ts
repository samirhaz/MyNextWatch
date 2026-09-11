export function testDatabaseUrl() {
  const value = process.env.TEST_DATABASE_URL;
  if (!value)
    throw new Error(
      "TEST_DATABASE_URL is required. Use a disposable MySQL database whose name ends in _test.",
    );
  const url = new URL(value);
  if (url.protocol !== "mysql:" || !/^\/[a-zA-Z0-9_]+_test$/.test(url.pathname))
    throw new Error("Refusing tests: the MySQL database name must end in _test.");
  if (
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL === value &&
    process.env.ALLOW_DISPOSABLE_DATABASE_TESTS !== "1"
  )
    throw new Error(
      "Refusing to use the application's DATABASE_URL as a test target. Set a separate TEST_DATABASE_URL.",
    );
  return value;
}
