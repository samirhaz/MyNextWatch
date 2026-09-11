import "server-only";
import { z } from "zod";
import type { Availability, CatalogPage, MediaType, ReferenceData, Title } from "@/lib/types";
import { catalogQuerySchema, titleRefSchema } from "@/lib/validation";
import { getDb } from "./db";
import { AppError } from "./errors";
import { serializeTitle } from "./serialize";

const genreSchema = z.object({ id: z.number(), name: z.string() });
const providerSchema = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: z.string().nullable().default(null),
});
const rawTitleSchema = z.object({
  id: z.number().int(),
  title: z.string().optional(),
  name: z.string().optional(),
  overview: z.string().nullish(),
  poster_path: z.string().nullish(),
  backdrop_path: z.string().nullish(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  vote_average: z.number().optional(),
  vote_count: z.number().optional(),
  genres: z.array(genreSchema).optional(),
  genre_ids: z.array(z.number()).optional(),
  runtime: z.number().nullable().optional(),
  seasons: z
    .array(
      z.object({
        season_number: z.number().int(),
        name: z.string(),
        episode_count: z.number().int(),
      }),
    )
    .optional(),
});
const regionSchema = z.object({
  link: z.string().url().optional(),
  flatrate: z.array(providerSchema).optional(),
  free: z.array(providerSchema).optional(),
  ads: z.array(providerSchema).optional(),
  rent: z.array(providerSchema).optional(),
  buy: z.array(providerSchema).optional(),
});
async function tmdb<T>(
  path: string,
  schema: z.ZodType<T>,
  params: Record<string, string> = {},
): Promise<T> {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token)
    throw new AppError(
      503,
      "TMDB is not connected yet. Add the read access token in your environment settings.",
    );
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries({ language: "en-US", ...params }).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AppError(502, "TMDB could not be reached. Please try again shortly.");
  }
  if (response.status === 404) throw new AppError(404, "This title is not available on TMDB.");
  if (response.status === 429)
    throw new AppError(429, "TMDB is busy. Please wait a minute before trying again.");
  if (!response.ok)
    throw new AppError(502, "TMDB could not complete this request. Please try again later.");
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success)
    throw new AppError(502, "TMDB returned an unexpected response. Please try again later.");
  return parsed.data;
}
function normalize(raw: z.infer<typeof rawTitleSchema>, mediaType: MediaType): Title {
  return {
    id: `${mediaType}-${raw.id}`,
    tmdbId: raw.id,
    mediaType,
    name: raw.title || raw.name || "Untitled",
    overview: raw.overview || "",
    posterPath: raw.poster_path || null,
    backdropPath: raw.backdrop_path || null,
    releaseDate: raw.release_date || raw.first_air_date || null,
    communityRating: raw.vote_count === 0 ? null : (raw.vote_average ?? null),
    genres: raw.genres || [],
    runtime: raw.runtime || null,
    seasons: raw.seasons || [],
    providers: {},
    providersUpdatedAt: null,
  };
}
export async function catalog(input: unknown, country: string): Promise<CatalogPage> {
  const query = catalogQuerySchema.parse(input);
  const search = !!query.q;
  const discover =
    !search &&
    (query.mode === "discover" ||
      !!query.genre ||
      !!query.year ||
      !!query.provider ||
      query.sort !== "popularity.desc");
  const path = search
    ? `search/${query.type}`
    : discover
      ? `discover/${query.type}`
      : `trending/${query.type}/week`;
  const params: Record<string, string> = { page: String(query.page), include_adult: "false" };
  if (search) params.query = query.q;
  if (discover) {
    const televisionSort: Record<string, string> = {
      "title.asc": "name.asc",
      "primary_release_date.desc": "first_air_date.desc",
    };
    params.sort_by = query.type === "tv" ? televisionSort[query.sort] || query.sort : query.sort;
    if (query.genre) params.with_genres = query.genre;
    if (query.year)
      params[query.type === "movie" ? "primary_release_year" : "first_air_date_year"] = query.year;
    if (query.provider) {
      params.with_watch_providers = query.provider;
      params.watch_region = country;
    }
    if (query.sort === "vote_average.desc") params["vote_count.gte"] = "100";
  }
  const data = await tmdb(
    path,
    z.object({
      results: z.array(rawTitleSchema),
      page: z.number(),
      total_pages: z.number(),
      total_results: z.number(),
    }),
    params,
  );
  return {
    results: data.results.map((title) => normalize(title, query.type)),
    page: data.page,
    totalPages: Math.min(data.total_pages, 500),
    totalResults: data.total_results,
  };
}
export async function referenceData(type: MediaType, country: string): Promise<ReferenceData> {
  const [genres, providers, countries] = await Promise.all([
    tmdb(`genre/${type}/list`, z.object({ genres: z.array(genreSchema) })),
    tmdb(`watch/providers/${type}`, z.object({ results: z.array(providerSchema) }), {
      watch_region: country,
    }),
    tmdb(
      "configuration/countries",
      z.array(z.object({ iso_3166_1: z.string(), english_name: z.string() })),
    ),
  ]);
  return {
    genres: genres.genres,
    providers: providers.results,
    countries: countries.sort((a, b) => a.english_name.localeCompare(b.english_name)),
  };
}
export async function getTitle(
  mediaType: MediaType,
  tmdbId: number,
  force = false,
): Promise<Title> {
  titleRefSchema.parse({ mediaType, tmdbId });
  const db = getDb();
  const existing = await db.title.findUnique({
    where: { mediaType_tmdbId: { mediaType, tmdbId } },
  });
  const day = 86400000;
  if (
    !force &&
    existing &&
    Date.now() - existing.metadataUpdatedAt.getTime() < 7 * day &&
    existing.providersUpdatedAt &&
    Date.now() - existing.providersUpdatedAt.getTime() < day
  )
    return serializeTitle(existing);
  const [raw, providerResult] = await Promise.all([
    tmdb(`${mediaType}/${tmdbId}`, rawTitleSchema),
    tmdb(
      `${mediaType}/${tmdbId}/watch/providers`,
      z.object({ results: z.record(z.string(), regionSchema) }),
    )
      .then((data) => ({ data, ok: true }))
      .catch(() => ({ data: { results: {} as Availability }, ok: false })),
  ]);
  const title = normalize(raw, mediaType);
  const data = {
    tmdbId,
    mediaType,
    name: title.name,
    overview: title.overview,
    posterPath: title.posterPath,
    backdropPath: title.backdropPath,
    releaseDate: title.releaseDate,
    communityRating: title.communityRating,
    genres: title.genres,
    runtime: title.runtime,
    seasons: title.seasons,
    providers: providerResult.data.results,
    providersUpdatedAt: providerResult.ok ? new Date() : null,
    metadataUpdatedAt: new Date(),
  };
  return serializeTitle(
    await db.title.upsert({
      where: { mediaType_tmdbId: { mediaType, tmdbId } },
      create: data,
      update: data,
    }),
  );
}
// Retire cached metadata after 90 days. User ratings/notes and external identifiers survive.
// Called by the daily maintenance endpoint and private collection reads.
export async function purgeExpiredMetadata() {
  await getDb().title.updateMany({
    where: {
      metadataUpdatedAt: { lt: new Date(Date.now() - 90 * 86400000) },
      name: { not: "Metadata needs refreshing" },
    },
    data: {
      name: "Metadata needs refreshing",
      overview: "",
      posterPath: null,
      backdropPath: null,
      releaseDate: null,
      communityRating: null,
      genres: [],
      seasons: [],
      runtime: null,
      providers: {},
      providersUpdatedAt: null,
    },
  });
}
