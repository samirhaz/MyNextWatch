import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/server/db";
import { purgeExpiredMetadata } from "@/lib/server/tmdb";
import { errorResponse, json } from "@/lib/server/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
    return json({ error: "Unauthorized" }, 401);
  try {
    await purgeExpiredMetadata();
    await getDb().rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return json({ cleaned: true });
  } catch (error) {
    return errorResponse(error);
  }
}
