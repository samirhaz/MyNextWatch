import { describe, expect, it } from "vitest";
import { demoSnapshot } from "@/lib/demo";
import { filterCollection, readFilters } from "@/lib/filters";
import { DEFAULT_FILTERS } from "@/lib/types";
const items = demoSnapshot().entries.map((entry) => ({
  entry,
  title: entry.title,
  createdAt: entry.createdAt,
}));
describe("whole collection filtering", () => {
  it("finds matching titles beyond a displayed page", () => {
    const result = filterCollection(items, { ...DEFAULT_FILTERS, q: "Spirited" }, "US");
    expect(result).toHaveLength(1);
    expect(result[0].title.name).toBe("Spirited Away");
  });
  it("combines rating, status, genre and year", () => {
    expect(
      filterCollection(
        items,
        { ...DEFAULT_FILTERS, status: "COMPLETED", rating: "9", genre: "18", year: "2019" },
        "US",
      ).map((item) => item.title.name),
    ).toEqual(["Parasite"]);
  });
  it("uses the selected country and includes rental separately from subscription", () => {
    const title = {
      ...items[0].title,
      providers: {
        US: { rent: [{ provider_id: 9, provider_name: "Rental service", logo_path: null }] },
      },
    };
    expect(
      filterCollection([{ ...items[0], title }], { ...DEFAULT_FILTERS, provider: "9" }, "US"),
    ).toHaveLength(1);
    expect(
      filterCollection([{ ...items[0], title }], { ...DEFAULT_FILTERS, provider: "9" }, "GB"),
    ).toHaveLength(0);
  });
  it("sorts personal ratings with unrated entries last", () => {
    const sorted = filterCollection(items, { ...DEFAULT_FILTERS, sort: "rating" }, "US");
    expect(sorted[0].entry?.rating).toBe(10);
    expect(sorted.at(-1)?.entry?.rating).toBeNull();
  });
  it("restores URL filters without changing defaults", () => {
    expect(readFilters(new URLSearchParams("type=tv&status=WATCHING"))).toMatchObject({
      type: "tv",
      status: "WATCHING",
      sort: "added",
      q: "",
    });
  });
});
