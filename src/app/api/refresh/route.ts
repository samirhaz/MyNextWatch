import { z } from "zod";
import { privateRequest, readJson } from "@/lib/server/http";
import { getTitle } from "@/lib/server/tmdb";
import { getDb } from "@/lib/server/db";
import { titleRefSchema } from "@/lib/validation";
import { AppError } from "@/lib/server/errors";
export const runtime = "nodejs";
export const maxDuration = 60;
// The client batches the ENTIRE collection in groups of four, showing progress and failures.
export const POST = (request: Request) =>
  privateRequest(
    request,
    async (userId) => {
      const refs = z
        .array(titleRefSchema)
        .min(1)
        .max(4)
        .parse(await readJson(request));
      const results = await Promise.all(
        refs.map(async (ref) => {
          const owned = await getDb().title.findFirst({
            where: {
              ...ref,
              OR: [
                { library: { some: { userId } } },
                { listItems: { some: { list: { userId } } } },
              ],
            },
            select: { id: true },
          });
          if (!owned) throw new AppError(404, "Title not found in your collections.");
          try {
            const title = await getTitle(ref.mediaType, ref.tmdbId, true);
            return { ...ref, ok: !!title.providersUpdatedAt };
          } catch {
            return { ...ref, ok: false };
          }
        }),
      );
      return { results };
    },
    "refresh",
    30,
  );
