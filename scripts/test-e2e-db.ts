import "dotenv/config";
import { spawnSync } from "node:child_process";
import { testDatabaseUrl } from "./test-database-guard";
const url = testDatabaseUrl();
const result = spawnSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], {
  stdio: "inherit",
  env: { ...process.env, TEST_DATABASE_URL: url, ALLOW_DISPOSABLE_DATABASE_TESTS: "1" },
});
process.exit(result.status ?? 1);
