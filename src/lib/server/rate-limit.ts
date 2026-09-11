import "server-only";
import { createHash } from "node:crypto";
import { getDb } from "./db";
import { AppError } from "./errors";
export async function rateLimit(identity: string, scope: string, limit = 60) {
  const window = Math.floor(Date.now() / 60000);
  const hash = createHash("sha256")
    .update(`${process.env.AUTH_SECRET || "local"}:${identity}:${scope}`)
    .digest("hex");
  const key = `${hash}:${window}`;
  const expiresAt = new Date((window + 2) * 60000);
  // Use a MySQL atomic increment so simultaneous requests cannot race on first creation.
  const bucket = await getDb().$transaction(async (tx) => {
    await tx.$executeRaw`INSERT INTO RateLimit (\`key\`, \`count\`, expiresAt) VALUES (${key}, 1, ${expiresAt}) ON DUPLICATE KEY UPDATE \`count\` = \`count\` + 1`;
    return tx.rateLimit.findUniqueOrThrow({ where: { key } });
  });
  if (bucket.count > limit)
    throw new AppError(429, "Too many requests. Please wait a minute and try again.");
}
export function publicIdentity(request: Request) {
  // Trust this IP header only on Vercel, where the platform overwrites it.
  return process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "public"
    : "local-public";
}
