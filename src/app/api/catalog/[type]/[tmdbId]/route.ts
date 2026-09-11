import { privateRequest } from "@/lib/server/http";
import { getTitle } from "@/lib/server/tmdb";
import { titleRefSchema } from "@/lib/validation";
export const runtime = "nodejs";
export const GET = (
  request: Request,
  context: { params: Promise<{ type: string; tmdbId: string }> },
) =>
  privateRequest(
    request,
    async () => {
      const params = await context.params;
      const reference = titleRefSchema.parse({
        mediaType: params.type,
        tmdbId: Number(params.tmdbId),
      });
      return getTitle(reference.mediaType, reference.tmdbId);
    },
    "catalog",
    60,
  );
