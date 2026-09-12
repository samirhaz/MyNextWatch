import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { getDb } from "@/lib/server/db";

afterEach(() => vi.unstubAllEnvs());

describe("separately hosted sample demo", () => {
  it("allows the interactive UI but blocks private routes and write requests", () => {
    vi.stubEnv("DEMO_ONLY", "true");
    for (const path of [
      "/demo/dashboard",
      "/demo/lists/new-id",
      "/credits",
      "/signin",
      "/_next/static/app.js",
    ]) {
      expect(proxy(new NextRequest(`https://demo.example${path}`)).status).toBe(200);
    }
    for (const path of [
      "/api/auth/session",
      "/api/entries",
      "/api/maintenance",
      "/dashboard",
      "/share/token",
      "/.env",
    ]) {
      expect(proxy(new NextRequest(`https://demo.example${path}`)).status).toBe(404);
    }
    expect(proxy(new NextRequest("https://demo.example/signin", { method: "POST" })).status).toBe(
      405,
    );
    expect(proxy(new NextRequest("https://demo.example/")).headers.get("location")).toBe(
      "https://demo.example/demo/dashboard",
    );
    expect(() => getDb()).toThrow("Database access is disabled");
  });

  it("leaves the personal app's routes available when demo-only mode is off", () => {
    vi.stubEnv("DEMO_ONLY", "false");
    expect(
      proxy(new NextRequest("http://localhost:3000/api/entries", { method: "POST" })).headers.get(
        "x-middleware-next",
      ),
    ).toBe("1");
  });
});
