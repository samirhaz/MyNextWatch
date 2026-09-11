import { privateRequest, readJson } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export const PATCH = (request: Request, context: Context) =>
  privateRequest(
    request,
    async (userId) => {
      await libraryService(getDb()).patchEntry(
        userId,
        (await context.params).id,
        await readJson(request),
      );
      return { saved: true };
    },
    "mutations",
    60,
  );
export const DELETE = (request: Request, context: Context) =>
  privateRequest(
    request,
    async (userId) => {
      await libraryService(getDb()).removeEntry(userId, (await context.params).id);
      return { removed: true };
    },
    "mutations",
    60,
  );
