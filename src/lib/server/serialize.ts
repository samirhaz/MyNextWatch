import type { Title as DbTitle } from "@/generated/prisma/client";
import type { Title, Availability, Genre, Season } from "@/lib/types";
export function serializeTitle(title: DbTitle): Title {
  return {
    id: title.id,
    tmdbId: title.tmdbId,
    mediaType: title.mediaType,
    name: title.name,
    overview: title.overview,
    posterPath: title.posterPath,
    backdropPath: title.backdropPath,
    releaseDate: title.releaseDate,
    communityRating: title.communityRating,
    genres: title.genres as Genre[],
    runtime: title.runtime,
    seasons: (title.seasons || []) as Season[],
    providers: (title.providers || {}) as Availability,
    providersUpdatedAt: title.providersUpdatedAt?.toISOString() || null,
  };
}
