import { handlers, authConfigured } from "@/auth";
import type { NextRequest } from "next/server";
import { rateLimit, publicIdentity } from "@/lib/server/rate-limit";
import { errorResponse } from "@/lib/server/http";
export const runtime = "nodejs";
function unavailable() {
  return Response.json(
    { error: "Authentication is not configured. See the setup guide." },
    { status: 503 },
  );
}
async function handle(request: NextRequest, method: "GET" | "POST") {
  if (!authConfigured()) return unavailable();
  try {
    await rateLimit(publicIdentity(request), "authentication", 90);
    // Auth.js owns its OAuth state/PKCE and CSRF validation.
    return await handlers[method](request);
  } catch (error) {
    return errorResponse(error);
  }
}
export const GET = (request: NextRequest) => handle(request, "GET");
export const POST = (request: NextRequest) => handle(request, "POST");
