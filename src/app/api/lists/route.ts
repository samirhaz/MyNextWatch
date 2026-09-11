import { privateRequest, readJson } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
export const runtime = "nodejs";
export const POST = (request: Request) =>
  privateRequest(
    request,
    async (userId) => {
      const list = await libraryService(getDb()).createList(userId, await readJson(request));
      return { id: list.id };
    },
    "mutations",
    60,
  );
