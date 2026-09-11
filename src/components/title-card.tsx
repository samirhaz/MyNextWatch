"use client";
import Link from "next/link";
import { Bookmark, Check, SlidersHorizontal, Star } from "lucide-react";
import { useApp } from "./app-provider";
import { Poster } from "./poster";
import { TrackDialog } from "./tracking";
import { dateLabel, yearOf } from "@/lib/utils";
import { titleKey, type Entry, type Title } from "@/lib/types";
export function TitleCard({
  title,
  added,
  showPersonal = true,
}: {
  title: Title;
  added?: string;
  showPersonal?: boolean;
}) {
  const { data, href, busy, addTitle } = useApp();
  const entry = data.entries.find((item) => titleKey(item.title) === titleKey(title));
  return (
    <article className="group min-w-0">
      <div className="relative">
        <Link
          href={href(`/title/${title.mediaType}/${title.tmdbId}`)}
          className="block rounded-xl"
          aria-label={`View ${title.name}`}
        >
          <Poster
            path={title.posterPath}
            title={title.name}
            className="aspect-[2/3] rounded-xl transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transform-none"
          />
          <div className="poster-shade pointer-events-none absolute inset-0 rounded-xl" />
        </Link>
        <span
          className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white"
          aria-label={`TMDB rating ${title.communityRating?.toFixed(1) || "unavailable"}`}
        >
          <Star className="size-3 fill-primary text-primary" />
          {title.communityRating?.toFixed(1) || "—"}
          <span className="text-[8px] font-normal tracking-wider text-white/75">TMDB</span>
        </span>
        {entry ? (
          <TrackDialog title={title}>
            <button
              className="absolute right-2 top-2 grid size-9 place-items-center rounded-lg border border-white/10 bg-black/65 text-primary backdrop-blur-sm hover:bg-black/85"
              aria-label={`Manage ${title.name}`}
            >
              <Check className="size-4" />
            </button>
          </TrackDialog>
        ) : (
          <button
            disabled={busy}
            onClick={() => addTitle(title)}
            className="absolute right-2 top-2 grid size-9 place-items-center rounded-lg border border-white/15 bg-black/60 text-white backdrop-blur-sm hover:text-primary disabled:opacity-50"
            aria-label={`Add ${title.name} to watchlist`}
          >
            <Bookmark className="size-4" />
          </button>
        )}
      </div>
      <Link
        href={href(`/title/${title.mediaType}/${title.tmdbId}`)}
        className="mt-3.5 block line-clamp-2 text-[13px] font-semibold leading-5 tracking-[-.2px] hover:text-primary"
      >
        {title.name}
      </Link>
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{yearOf(title.releaseDate)}</span>
        <span className="size-[3px] rounded-full bg-muted-foreground/60" />
        <span>{title.mediaType === "movie" ? "Movie" : "TV Show"}</span>
        {showPersonal && entry?.rating && (
          <span className="ml-auto text-primary" title="Your rating">
            You {entry.rating}/10
          </span>
        )}
      </div>
      {added && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
          <p className="text-[10px] text-muted-foreground">Added {dateLabel(added)}</p>
          <TrackDialog title={title}>
            <button
              aria-label={`Edit tracking for ${title.name}`}
              className="grid size-8 place-items-center text-muted-foreground hover:text-primary"
            >
              <SlidersHorizontal className="size-3.5" />
            </button>
          </TrackDialog>
        </div>
      )}
    </article>
  );
}
export function WatchingCard({ entry }: { entry: Entry }) {
  const { href } = useApp();
  const season = entry.title.seasons.find((season) => season.season_number === entry.season);
  const progress = season?.episode_count
    ? Math.min(100, Math.round((entry.episode / season.episode_count) * 100))
    : 0;
  return (
    <div className="flex min-w-0 gap-4 rounded-xl border border-border bg-card p-3.5">
      <Link
        className="shrink-0"
        href={href(`/title/${entry.title.mediaType}/${entry.title.tmdbId}`)}
        aria-label={`View ${entry.title.name}`}
      >
        <Poster
          path={entry.title.posterPath}
          title={entry.title.name}
          className="h-[112px] w-[76px] rounded-lg"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
        <span className="eyebrow text-[8px] text-primary">In progress</span>
        <Link
          href={href(`/title/${entry.title.mediaType}/${entry.title.tmdbId}`)}
          className="mt-1 line-clamp-1 text-sm font-semibold hover:text-primary"
        >
          {entry.title.name}
        </Link>
        <span className="mt-2 text-[10px] text-muted-foreground">
          {entry.title.mediaType === "tv"
            ? `Season ${entry.season} · Episode ${entry.episode}${season ? ` of ${season.episode_count}` : ""}`
            : "Ready when you are"}
        </span>
        {entry.title.mediaType === "tv" && (
          <div
            className="mt-3 h-1 rounded-full bg-secondary"
            role="progressbar"
            aria-label={`${entry.title.name} season progress`}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        )}
        <TrackDialog title={entry.title}>
          <button className="mt-3 self-start text-[10px] font-semibold text-primary">
            Update progress →
          </button>
        </TrackDialog>
      </div>
    </div>
  );
}
