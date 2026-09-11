import { privateRequest } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
export const runtime = "nodejs";
export const DELETE = (
  request: Request,
  context: { params: Promise<{ id: string; titleId: string }> },
) =>
  privateRequest(
    request,
    async (userId) => {
      const { id, titleId } = await context.params;
      await libraryService(getDb()).removeListItem(userId, id, titleId);
      return { removed: true };
    },
    "mutations",
    60,
  );
