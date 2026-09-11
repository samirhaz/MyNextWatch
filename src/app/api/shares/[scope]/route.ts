import { privateRequest, readJson } from "@/lib/server/http";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
import { shareSchema } from "@/lib/validation";
export const runtime = "nodejs";
export const POST = (request: Request, context: { params: Promise<{ scope: string }> }) =>
  privateRequest(
    request,
    async (userId) => {
      const { action } = shareSchema.parse(await readJson(request));
      const result = await libraryService(getDb()).share(
        userId,
        (await context.params).scope,
        action,
      );
      return { enabled: result.enabled, path: result.token ? `/share/${result.token}` : null };
    },
    "sharing",
    15,
  );
