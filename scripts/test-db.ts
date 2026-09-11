import "dotenv/config";
import { spawnSync } from "node:child_process";
import { testDatabaseUrl } from "./test-database-guard";
const url = testDatabaseUrl();
const env = { ...process.env, DATABASE_URL: url, ALLOW_DISPOSABLE_DATABASE_TESTS: "1" };
// Pass arguments directly to Node; no shell interpolation and no destructive reset command.
for (const args of [
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["node_modules/vitest/vitest.mjs", "run", "--config", "vitest.db.config.ts"],
]) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status || 1);
}
