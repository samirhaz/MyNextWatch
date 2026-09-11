import {
  DEFAULT_FILTERS,
  OFFER_LABELS,
  type CollectionItem,
  type Filters,
  type Title,
} from "./types";
export function readFilters(params: URLSearchParams): Filters {
  return Object.fromEntries(
    Object.entries(DEFAULT_FILTERS).map(([key, fallback]) => [key, params.get(key) || fallback]),
  ) as Filters;
}
export function providerIds(title: Title, country: string): number[] {
  const availability = title.providers[country];
  return availability
    ? Object.keys(OFFER_LABELS).flatMap(
        (key) =>
          availability[key as keyof typeof OFFER_LABELS]?.map((provider) => provider.provider_id) ||
          [],
      )
    : [];
}
// Always receives the complete owned collection, never just the visible grid page.
export function filterCollection(
  items: CollectionItem[],
  filters: Filters,
  country: string,
): CollectionItem[] {
  return items
    .filter(
      ({ title, entry }) =>
        (!filters.q || title.name.toLocaleLowerCase().includes(filters.q.toLocaleLowerCase())) &&
        (filters.type === "all" || title.mediaType === filters.type) &&
        (filters.genre === "all" ||
          title.genres.some((genre) => String(genre.id) === filters.genre)) &&
        (filters.status === "all" || entry?.status === filters.status) &&
        (!filters.year || title.releaseDate?.startsWith(filters.year)) &&
        (filters.rating === "all" ||
          (filters.rating === "unrated"
            ? entry?.rating == null
            : entry?.rating === Number(filters.rating))) &&
        (filters.provider === "all" ||
          providerIds(title, country).includes(Number(filters.provider))),
    )
    .sort((a, b) => {
      if (filters.sort === "title")
        return a.title.name.localeCompare(b.title.name) || a.title.id.localeCompare(b.title.id);
      if (filters.sort === "rating")
        return (
          (b.entry?.rating || 0) - (a.entry?.rating || 0) ||
          a.title.name.localeCompare(b.title.name)
        );
      if (filters.sort === "release")
        return (
          (b.title.releaseDate || "").localeCompare(a.title.releaseDate || "") ||
          a.title.name.localeCompare(b.title.name)
        );
      return b.createdAt.localeCompare(a.createdAt) || a.title.name.localeCompare(b.title.name);
    });
}
