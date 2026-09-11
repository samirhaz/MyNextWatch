import { privateRequest } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
import { purgeExpiredMetadata } from "@/lib/server/tmdb";
export const runtime = "nodejs";
export const GET = (request: Request) =>
  privateRequest(request, async (userId) => {
    await purgeExpiredMetadata();
    return libraryService(getDb()).snapshot(userId);
  });
