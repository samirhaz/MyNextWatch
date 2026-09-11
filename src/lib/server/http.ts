import "server-only";
import { z } from "zod";
import { AppError } from "./errors";
import { requireUser } from "./session";
import { rateLimit } from "./rate-limit";
import { sameOrigin } from "./request-input";
export { readJson, sameOrigin } from "./request-input";
export const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      ...(status === 429 ? { "Retry-After": "60" } : {}),
    },
  });
export function errorResponse(error: unknown) {
  if (error instanceof AppError) return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return json({ error: error.issues[0]?.message || "Invalid input." }, 400);
  console.error("Request failed:", error instanceof Error ? error.name : "UnknownError");
  return json(
    {
      error:
        "The request could not be completed. Please try again. If this continues, check the database connection.",
    },
    503,
  );
}
export async function privateRequest(
  request: Request,
  action: (userId: string) => Promise<unknown>,
  scope = "requests",
  limit = 90,
) {
  try {
    if (!["GET", "HEAD"].includes(request.method)) sameOrigin(request);
    const userId = await requireUser();
    await rateLimit(userId, scope, limit);
    return json(await action(userId));
  } catch (error) {
    return errorResponse(error);
  }
}
