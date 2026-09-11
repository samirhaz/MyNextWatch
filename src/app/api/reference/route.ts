import { privateRequest } from "@/lib/server/http";
import { referenceData } from "@/lib/server/tmdb";
import { getDb } from "@/lib/server/db";
import { mediaTypeSchema } from "@/lib/validation";
export const runtime = "nodejs";
export const GET = (request: Request) =>
  privateRequest(
    request,
    async (userId) => {
      const type = mediaTypeSchema.parse(new URL(request.url).searchParams.get("type") || "movie");
      const preference = await getDb().userPreference.findUnique({ where: { userId } });
      return referenceData(type, preference?.country || "US");
    },
    "reference",
    30,
  );
