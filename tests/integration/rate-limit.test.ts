import { randomUUID } from "node:crypto";
import { afterAll, expect, it } from "vitest";
import { rateLimit } from "@/lib/server/rate-limit";
import { getDb } from "@/lib/server/db";
afterAll(async () => {
  await getDb().$disconnect();
});
it("enforces one shared rate budget during concurrent MySQL requests", async () => {
  if (process.env.ALLOW_DISPOSABLE_DATABASE_TESTS !== "1")
    throw new Error("Use the disposable database runner.");
  const identity = randomUUID();
  const results = await Promise.allSettled(
    Array.from({ length: 8 }, () => rateLimit(identity, "test", 3)),
  );
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(3);
  for (const result of results)
    if (result.status === "rejected") expect(result.reason).toMatchObject({ status: 429 });
});
