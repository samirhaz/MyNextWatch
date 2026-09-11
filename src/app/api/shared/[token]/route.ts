import { errorResponse, json } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
import { rateLimit, publicIdentity } from "@/lib/server/rate-limit";
import { purgeExpiredMetadata } from "@/lib/server/tmdb";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    await rateLimit(publicIdentity(request), "shared", 30);
    await purgeExpiredMetadata();
    return json(await libraryService(getDb()).readShared((await context.params).token));
  } catch (error) {
    return errorResponse(error);
  }
}
