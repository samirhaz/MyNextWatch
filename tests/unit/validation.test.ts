import { describe, expect, it } from "vitest";
import {
  ratingSchema,
  libraryPatchSchema,
  listSchema,
  catalogQuerySchema,
  titleRefSchema,
} from "@/lib/validation";
describe("ratings and strict server input", () => {
  it.each([1, 10, null])("accepts %s", (value) =>
    expect(ratingSchema.safeParse(value).success).toBe(true),
  );
  it.each([0, 11, -1, 4.5, "8", NaN, Infinity])("rejects %s", (value) =>
    expect(ratingSchema.safeParse(value).success).toBe(false),
  );
  it("rejects injected ownership and unknown statuses", () => {
    expect(libraryPatchSchema.safeParse({ rating: 8, userId: "another-user" }).success).toBe(false);
    expect(libraryPatchSchema.safeParse({ status: "PUBLIC" }).success).toBe(false);
    expect(libraryPatchSchema.safeParse({}).success).toBe(false);
  });
  it("trims list names and enforces limits", () => {
    expect(listSchema.parse({ name: "  Cinema  " }).name).toBe("Cinema");
    expect(listSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(listSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
    expect(listSchema.safeParse({ name: "Movies", description: "a".repeat(501) }).success).toBe(
      false,
    );
  });
  it("keeps movie and TV references distinct", () => {
    expect(titleRefSchema.parse({ mediaType: "movie", tmdbId: 42 })).not.toEqual(
      titleRefSchema.parse({ mediaType: "tv", tmdbId: 42 }),
    );
    expect(titleRefSchema.safeParse({ mediaType: "person", tmdbId: 42 }).success).toBe(false);
  });
  it("rejects unsupported search/filter combinations and page overflow", () => {
    expect(catalogQuerySchema.safeParse({ q: "Dune", genre: "18" }).success).toBe(false);
    expect(catalogQuerySchema.safeParse({ page: "501" }).success).toBe(false);
    expect(
      catalogQuerySchema.safeParse({ type: "tv", provider: "8", mode: "discover" }).success,
    ).toBe(true);
  });
});
