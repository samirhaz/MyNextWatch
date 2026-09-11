"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Clock3, Globe2, Star } from "lucide-react";
import { useApp } from "./app-provider";
import { type Title, type MediaType, OFFER_LABELS } from "@/lib/types";
import { api } from "@/lib/client-api";
import { DEMO_TITLES } from "@/lib/demo";
import { dateLabel, yearOf } from "@/lib/utils";
import { COUNTRIES } from "@/lib/countries";
import { Poster } from "./poster";
import { TrackingPanel } from "./tracking";
import { Button } from "./ui/button";
import { GridSkeleton } from "./ui/skeleton";
import { EmptyState } from "./empty-state";
export function TitleDetail({ type, tmdbId }: { type: MediaType; tmdbId: number }) {
  const { demo, href, data } = useApp();
  const [response, setResponse] = useState<{ key: string; title?: Title; error?: string } | null>(
    null,
  );
  const [retry, setRetry] = useState(0);
  const key = `${type}/${tmdbId}/${retry}`;
  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    api<Title>(`/catalog/${type}/${tmdbId}`, { signal: controller.signal })
      .then((title) => {
        if (!controller.signal.aborted) setResponse({ key, title });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResponse({ key, error: error.message });
      });
    return () => controller.abort();
  }, [demo, type, tmdbId, key]);
  const title = demo
    ? DEMO_TITLES.find((title) => title.mediaType === type && title.tmdbId === tmdbId)
    : response?.key === key
      ? response.title
      : null;
  const error = demo
    ? !title
      ? "This title is not part of the sample catalog."
      : ""
    : response?.key === key
      ? response.error
      : "";
  if (error)
    return (
      <div role="alert">
        <EmptyState
          title="This story couldn't load."
          description={error}
          href={href("/discover")}
          action="Back to discovery"
        />
        <Button variant="outline" className="mt-5" onClick={() => setRetry(retry + 1)}>
          Try again
        </Button>
      </div>
    );
  if (!title) return <GridSkeleton />;
  const region = title.providers[data.user.country];
  const hasOffers =
    region &&
    Object.keys(OFFER_LABELS).some((key) => region[key as keyof typeof OFFER_LABELS]?.length);
  const safeLink =
    region?.link && /^https:\/\/(www\.)?themoviedb\.org\//.test(region.link) ? region.link : null;
  return (
    <div className="space-y-7">
      <Link
        href={href("/discover")}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Back to discover
      </Link>
      <div className="relative isolate overflow-hidden rounded-2xl border border-border">
        <Poster
          path={title.backdropPath}
          title={title.name}
          backdrop
          priority
          className="absolute inset-0 -z-20"
        />
        <div className="hero-shade absolute inset-0 -z-10" />
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
          <Poster
            path={title.posterPath}
            title={title.name}
            priority
            className="aspect-[2/3] w-32 shrink-0 rounded-lg shadow-2xl sm:w-40 md:w-48"
          />
          <div className="flex max-w-2xl flex-col justify-center">
            <p className="eyebrow text-primary">
              {title.mediaType === "movie" ? "Movie" : "Television series"}
              {demo ? " · Sample metadata" : ""}
            </p>
            <h1 className="mt-3 break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl xl:text-5xl">
              {title.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#c4c9c1]">
              <span>{yearOf(title.releaseDate)}</span>
              {title.runtime && (
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />
                  {title.runtime} min
                </span>
              )}
              {title.mediaType === "tv" && (
                <span>
                  {title.seasons.filter((season) => season.season_number > 0).length || "No"}{" "}
                  seasons available
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Star className="size-3.5 fill-primary text-primary" />
                {title.communityRating?.toFixed(1) || "Unrated"}
                <span className="text-[10px]">TMDB rating{demo ? " (sample)" : ""}</span>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {title.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-white/20 px-3 py-1 text-[10px] text-white/85"
                >
                  {genre.name}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-[#c4c9c1]">
              {title.overview || "No overview is currently available for this title."}
            </p>
          </div>
        </div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-2 text-xl font-semibold tracking-tight">Make it part of your story</h2>
          <p className="mb-6 text-xs text-muted-foreground">
            Your status, rating, notes, and progress are private.
          </p>
          <TrackingPanel title={title} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Where to watch</h2>
            <Link href={href("/settings")} className="flex items-center gap-2 text-xs text-primary">
              <Globe2 className="size-4" />
              {COUNTRIES.find((country) => country.code === data.user.country)?.name ||
                data.user.country}
            </Link>
          </div>
          {hasOffers ? (
            <div className="mt-6 space-y-5">
              {Object.entries(OFFER_LABELS).map(([key, label]) => {
                const providers = region[key as keyof typeof OFFER_LABELS];
                return providers?.length ? (
                  <div key={key}>
                    <h3 className="eyebrow mb-3">{label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {providers.map((provider) => (
                        <span
                          key={provider.provider_id}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-xs"
                        >
                          {provider.provider_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })}
              {safeLink && (
                <Button asChild variant="outline">
                  <a href={safeLink} target="_blank" rel="noopener noreferrer">
                    See watch options on TMDB
                    <ArrowUpRight />
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <div className="my-6 rounded-xl border border-dashed border-border p-6 text-center">
              <Globe2 className="mx-auto mb-3 size-7 text-muted-foreground" />
              <h3 className="text-sm font-medium">
                {demo ? "Availability isn't simulated." : "No availability data for this country."}
              </h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {demo
                  ? "Connect TMDB and sign in to see real regional streaming offers."
                  : "This does not necessarily mean the title is unavailable. Check your preferred services or choose another country."}
              </p>
            </div>
          )}
          <p className="mt-6 text-[11px] leading-6 text-muted-foreground">
            Streaming availability provided by{" "}
            <a
              className="text-primary hover:underline"
              href="https://www.justwatch.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              JustWatch
            </a>{" "}
            through TMDB. Offers may change; rentals and purchases cost extra. A service listing
            only indicates a subscription when shown under Subscription.
          </p>
          {title.providersUpdatedAt && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Last checked {dateLabel(title.providersUpdatedAt)}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
