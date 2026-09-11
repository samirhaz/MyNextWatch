import { privateRequest } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { catalog } from "@/lib/server/tmdb";
export const runtime = "nodejs";
export const GET = (request: Request) =>
  privateRequest(
    request,
    async (userId) => {
      const preference = await getDb().userPreference.findUnique({ where: { userId } });
      return catalog(
        Object.fromEntries(new URL(request.url).searchParams),
        preference?.country || "US",
      );
    },
    "catalog",
    60,
  );
