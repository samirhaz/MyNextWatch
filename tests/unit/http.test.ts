import { describe, expect, it } from "vitest";
import { sameOrigin, readJson } from "@/lib/server/request-input";
describe("mutation boundary", () => {
  it("rejects cross-origin and missing-origin writes", () => {
    expect(() =>
      sameOrigin(
        new Request("http://localhost:3000/api/lists", {
          method: "POST",
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toThrow();
    expect(() =>
      sameOrigin(new Request("http://localhost:3000/api/lists", { method: "POST" })),
    ).toThrow();
  });
  it("bounds chunked JSON bodies even without Content-Length", async () => {
    const request = new Request("http://localhost:3000/api/lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "a".repeat(17000) }),
    });
    await expect(readJson(request)).rejects.toMatchObject({ status: 413 });
  });
});
