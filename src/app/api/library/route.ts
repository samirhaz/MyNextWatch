import { privateRequest, readJson } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
import { getTitle } from "@/lib/server/tmdb";
import { titleRefSchema } from "@/lib/validation";
export const runtime = "nodejs";
export const POST = (request: Request) =>
  privateRequest(
    request,
    async (userId) => {
      const reference = titleRefSchema.parse(await readJson(request));
      const title = await getTitle(reference.mediaType, reference.tmdbId);
      await libraryService(getDb()).addLibrary(userId, title.id);
      return { saved: true };
    },
    "mutations",
    60,
  );
