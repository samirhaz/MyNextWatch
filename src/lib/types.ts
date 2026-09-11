export const STATUSES = ["PLAN_TO_WATCH", "WATCHING", "COMPLETED", "ON_HOLD", "DROPPED"] as const;
export type Status = (typeof STATUSES)[number];
export type MediaType = "movie" | "tv";
export const STATUS_LABELS: Record<Status, string> = {
  PLAN_TO_WATCH: "Plan to Watch",
  WATCHING: "Watching",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  DROPPED: "Dropped",
};
export type Genre = { id: number; name: string };
export type Season = { season_number: number; name: string; episode_count: number };
export type Provider = { provider_id: number; provider_name: string; logo_path: string | null };
export const OFFER_LABELS = {
  flatrate: "Subscription",
  free: "Free",
  ads: "With ads",
  rent: "Rent",
  buy: "Buy",
} as const;
export type OfferType = keyof typeof OFFER_LABELS;
export type RegionAvailability = Partial<Record<OfferType, Provider[]>> & { link?: string };
export type Availability = Record<string, RegionAvailability>;
export type Title = {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  name: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  communityRating: number | null;
  genres: Genre[];
  runtime: number | null;
  seasons: Season[];
  providers: Availability;
  providersUpdatedAt: string | null;
};
export type Entry = {
  id: string;
  titleId: string;
  title: Title;
  status: Status;
  rating: number | null;
  notes: string | null;
  season: number;
  episode: number;
  createdAt: string;
  updatedAt: string;
};
export type ListItem = { id: string; titleId: string; title: Title; createdAt: string };
export type CustomList = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  items: ListItem[];
  shared: boolean;
};
export type Snapshot = {
  user: { name: string; country: string };
  entries: Entry[];
  lists: CustomList[];
  watchlistShared: boolean;
};
export type SharedList = { name: string; description: string | null; items: ListItem[] };
export type CollectionItem = { title: Title; entry?: Entry; createdAt: string };
export type Filters = {
  q: string;
  type: string;
  genre: string;
  status: string;
  year: string;
  rating: string;
  provider: string;
  sort: string;
};
export const DEFAULT_FILTERS: Filters = {
  q: "",
  type: "all",
  genre: "all",
  status: "all",
  year: "",
  rating: "all",
  provider: "all",
  sort: "added",
};
export type CatalogPage = {
  results: Title[];
  page: number;
  totalPages: number;
  totalResults: number;
};
export type ReferenceData = {
  genres: Genre[];
  providers: Provider[];
  countries: { iso_3166_1: string; english_name: string }[];
};
export const titleKey = (title: Pick<Title, "mediaType" | "tmdbId">) =>
  `${title.mediaType}:${title.tmdbId}`;
