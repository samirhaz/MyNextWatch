import { NextResponse, type NextRequest } from "next/server";

// A separately hosted sample demo must never serve account or database routes.
export function proxy(request: NextRequest) {
  if (process.env.DEMO_ONLY !== "true") return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new NextResponse("This demo uses sample data only.", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/demo/dashboard", request.url));
  }
  const allowed =
    pathname === "/demo" ||
    pathname.startsWith("/demo/") ||
    pathname.startsWith("/_next/static/") ||
    ["/signin", "/credits", "/icon.svg", "/tmdb-logo.svg"].includes(pathname);
  if (!allowed) return new NextResponse("Not found", { status: 404 });
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
