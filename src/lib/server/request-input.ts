import { AppError } from "./errors";
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.AUTH_URL
    ? new URL(process.env.AUTH_URL).origin
    : new URL(request.url).origin;
  if (origin !== expected) throw new AppError(403, "This request must come from MyNextWatch.");
}
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AppError(415, "Send JSON content.");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, "A request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new AppError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError(400, "Invalid JSON.");
  }
}
