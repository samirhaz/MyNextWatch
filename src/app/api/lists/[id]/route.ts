import { privateRequest, readJson } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export const GET = (request: Request, context: Context) =>
  privateRequest(request, async (userId) => {
    const id = (await context.params).id;
    await libraryService(getDb()).ownedList(userId, id);
    const snapshot = await libraryService(getDb()).snapshot(userId);
    return snapshot.lists.find((list) => list.id === id);
  });
export const PATCH = (request: Request, context: Context) =>
  privateRequest(
    request,
    async (userId) => {
      await libraryService(getDb()).updateList(
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
      await libraryService(getDb()).deleteList(userId, (await context.params).id);
      return { removed: true };
    },
    "mutations",
    60,
  );
