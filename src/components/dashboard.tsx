"use client";
import Link from "next/link";
import { ArrowRight, Bookmark, CheckCheck, Film, Play, Plus, Sparkles, Star } from "lucide-react";
import { useApp } from "./app-provider";
import { Button } from "./ui/button";
import { TitleCard, WatchingCard } from "./title-card";
import { Poster } from "./poster";
import { EmptyState } from "./empty-state";
import { TrackDialog } from "./tracking";
import { yearOf } from "@/lib/utils";
export function Dashboard() {
  const { data, demo, href } = useApp();
  const watchlist = data.entries.filter((entry) => entry.status === "PLAN_TO_WATCH");
  const watching = data.entries.filter((entry) => entry.status === "WATCHING");
  const completed = data.entries.filter((entry) => entry.status === "COMPLETED");
  const ratings = data.entries.flatMap((entry) => (entry.rating ? [entry.rating] : []));
  const spotlight = watchlist.find((entry) => entry.title.backdropPath) || watchlist[0];
  const recent = [...data.entries]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const stats = [
    { label: "On your watchlist", value: watchlist.length, icon: Bookmark, path: "/watchlist" },
    {
      label: "Currently watching",
      value: watching.length,
      icon: Play,
      path: "/library?status=WATCHING",
    },
    {
      label: "Stories completed",
      value: completed.length,
      icon: CheckCheck,
      path: "/library?status=COMPLETED",
    },
    {
      label: "Your average rating",
      value: ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : "—",
      icon: Star,
      path: "/library?sort=rating",
    },
  ];
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">The good part of your day</p>
          <h1 className="page-title">
            Welcome back, {data.user.name.split(" ")[0]}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground">
            A little less searching. A little more cinema.
          </p>
        </div>
        <Button asChild variant="outline" className="hidden sm:inline-flex">
          <Link href={href("/discover")}>
            <Plus />
            Find a new favorite
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, path }) => (
          <Link
            key={label}
            href={href(path)}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:border-primary/40 sm:px-5"
          >
            <div>
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <p className="mt-2 text-[27px] font-medium leading-none tracking-tight tabular-nums">
                {value}
                {label.includes("rating") && ratings.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">/ 10</span>
                )}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-lg border border-border bg-background/30">
              <Icon className="size-4 text-primary/90" strokeWidth={1.6} />
            </span>
          </Link>
        ))}
      </div>
      {spotlight ? (
        <section
          className="relative isolate min-h-[315px] overflow-hidden rounded-2xl border border-border sm:min-h-[335px]"
          aria-label="Watchlist spotlight"
        >
          <Poster
            path={spotlight.title.backdropPath || spotlight.title.posterPath}
            title={spotlight.title.name}
            backdrop
            priority
            className="absolute inset-0 -z-20"
          />
          <div className="hero-shade absolute inset-0 -z-10" />
          <div className="max-w-[600px] p-7 sm:p-9">
            <span className="mb-5 inline-flex items-center gap-2 rounded border border-primary/25 bg-black/30 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[.17em] text-primary">
              <Sparkles className="size-3" />
              From your watchlist
            </span>
            <h2 className="max-w-lg text-[36px] font-semibold leading-[1.05] tracking-[-1.6px] sm:text-[48px]">
              {spotlight.title.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px] text-white/75">
              <span>{yearOf(spotlight.title.releaseDate)}</span>
              <span>·</span>
              <span>
                {spotlight.title.genres
                  .map((genre) => genre.name)
                  .slice(0, 2)
                  .join(" / ") || (spotlight.title.mediaType === "movie" ? "Movie" : "TV Show")}
              </span>
              {spotlight.title.runtime && (
                <>
                  <span>·</span>
                  <span>
                    {Math.floor(spotlight.title.runtime / 60)}h {spotlight.title.runtime % 60}m
                  </span>
                </>
              )}
            </div>
            <p className="mt-4 line-clamp-2 max-w-md text-xs leading-6 text-[#c1c7bf]">
              {spotlight.title.overview ||
                "You've saved a seat for this one. Make tonight a movie night."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={href(`/title/${spotlight.title.mediaType}/${spotlight.title.tmdbId}`)}>
                  Explore this title
                  <ArrowRight />
                </Link>
              </Button>
              <TrackDialog title={spotlight.title}>
                <Button variant="outline" className="border-white/20 bg-black/25 text-white">
                  <Bookmark />
                  On my watchlist
                </Button>
              </TrackDialog>
            </div>
          </div>
          <span className="absolute bottom-5 right-6 hidden text-[8px] uppercase tracking-[.22em] text-white/50 md:block">
            Your next great story
          </span>
        </section>
      ) : (
        <EmptyState
          title="Your next great story starts here."
          description="Search for a movie or show and save it. Your own library will take shape one good watch at a time."
          href={href("/discover")}
        />
      )}
      <section>
        <SectionHeading
          title="Keep the story going"
          subtitle={
            watching.length
              ? `${watching.length} ${watching.length === 1 ? "title" : "titles"} in progress`
              : "Pick up right where you left off"
          }
          href={href("/library?status=WATCHING")}
          action="View watching"
        />
        {watching.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {watching.slice(0, 3).map((entry) => (
              <WatchingCard key={entry.id} entry={entry} />
            ))}
            {watching.length === 2 && (
              <Link
                href={href("/watchlist")}
                className="hidden min-h-[142px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/40 xl:flex"
              >
                <span className="grid size-8 place-items-center rounded-full bg-secondary">
                  <Plus className="size-4" />
                </span>
                <span className="text-xs">Room for another story</span>
                <span className="text-[10px]">Start something from your watchlist</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Move a title to Watching to keep it close at hand.
          </div>
        )}
      </section>
      <section>
        <SectionHeading
          title="Recently added"
          subtitle="Good things to look forward to"
          href={href("/library")}
          action="View your library"
        />
        {recent.length ? (
          <div className="poster-grid">
            {recent.map((entry) => (
              <TitleCard key={entry.id} title={entry.title} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="The first pick is yours."
            description="Your saved movies and shows will appear here."
            href={href("/discover")}
          />
        )}
      </section>
      <div className="flex items-center gap-3 rounded-xl border border-border px-5 py-4 text-xs text-muted-foreground">
        <Film className="size-4 shrink-0 text-primary" />
        <p>
          {demo
            ? "This is a sample library. Your real collection starts empty and stays private."
            : "Your ratings, progress, and notes belong to you. Lists stay private until you choose to share."}
        </p>
      </div>
    </div>
  );
}
export function SectionHeading({
  title,
  subtitle,
  href,
  action,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-[-.4px]">{title}</h2>
        {subtitle && <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary"
        >
          {action}
          <ArrowRight className="size-3" />
        </Link>
      )}
    </div>
  );
}
