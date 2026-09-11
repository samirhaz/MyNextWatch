import { privateRequest, readJson } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
import { getTitle } from "@/lib/server/tmdb";
import { titleRefSchema } from "@/lib/validation";
export const runtime = "nodejs";
export const POST = (request: Request, context: { params: Promise<{ id: string }> }) =>
  privateRequest(
    request,
    async (userId) => {
      const id = (await context.params).id;
      const service = libraryService(getDb());
      await service.ownedList(userId, id);
      const reference = titleRefSchema.parse(await readJson(request));
      const title = await getTitle(reference.mediaType, reference.tmdbId);
      await service.addListItem(userId, id, title.id);
      return { saved: true };
    },
    "mutations",
    60,
  );
