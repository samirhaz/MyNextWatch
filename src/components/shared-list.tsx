"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, LockKeyhole, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { type SharedList, type Title, titleKey } from "@/lib/types";
import { Button } from "./ui/button";
import { Poster } from "./poster";
import { Brand } from "./app-shell";
import { GridSkeleton } from "./ui/skeleton";
import { EmptyState } from "./empty-state";
import { dateLabel, yearOf } from "@/lib/utils";
export function SharedListPage({ token, signedIn }: { token: string; signedIn: boolean }) {
  const [list, setList] = useState<SharedList | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const result = await api<SharedList>(`/shared/${encodeURIComponent(token)}`, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setList(result);
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setList(null);
          setError(error instanceof Error ? error.message : "This list is unavailable.");
        }
      }
    }
    void load();
    const timer = setInterval(load, 30000);
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [token, retry]);
  async function save(title: Title) {
    setPending(titleKey(title));
    try {
      await api("/library", {
        method: "POST",
        body: JSON.stringify({ mediaType: title.mediaType, tmdbId: title.tmdbId }),
      });
      setSaved((previous) => [...previous, titleKey(title)]);
      toast.success("Saved in your library. Existing tracking was kept.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this title.");
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-7">
        <Link href="/">
          <Brand />
        </Link>
        <Button asChild variant="outline">
          <Link href={signedIn ? "/watchlist" : "/signin"}>
            {signedIn ? "Your watchlist" : "Sign in to save titles"}
          </Link>
        </Button>
      </header>
      <main className="py-10">
        <p className="eyebrow mb-3 text-primary">A little inspiration, shared with you</p>
        {error ? (
          <div role="alert">
            <EmptyState
              title="This shared list is unavailable."
              description="Its owner may have disabled or regenerated the link, or the service may be temporarily unavailable."
            />
            <p className="mt-3 text-xs text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => setRetry(retry + 1)}>
              Try again
            </Button>
          </div>
        ) : !list ? (
          <GridSkeleton />
        ) : (
          <>
            <h1 className="page-title break-words">{list.name}</h1>
            {list.description && (
              <p className="mt-4 max-w-2xl whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                {list.description}
              </p>
            )}
            <p className="mb-8 mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <LockKeyhole className="size-3.5" />
              Read-only collection · {list.items.length} titles
            </p>
            {!list.items.length ? (
              <EmptyState
                title="More good stories are on the way."
                description="This shared list has no titles yet."
              />
            ) : (
              <div className="poster-grid">
                {list.items.map((item) => {
                  const key = titleKey(item.title);
                  return (
                    <article key={key}>
                      <Poster
                        path={item.title.posterPath}
                        title={item.title.name}
                        className="aspect-[2/3] rounded-xl"
                      />
                      <h2 className="mt-3 break-words text-sm font-semibold">{item.title.name}</h2>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {yearOf(item.title.releaseDate)} ·{" "}
                        {item.title.mediaType === "movie" ? "Movie" : "TV Show"}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Star className="size-3 text-primary" />
                        {item.title.communityRating?.toFixed(1) || "—"} TMDB rating
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Added {dateLabel(item.createdAt)}
                      </p>
                      {signedIn ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 w-full"
                          disabled={!!pending || saved.includes(key)}
                          onClick={() => save(item.title)}
                        >
                          {saved.includes(key) ? <Check /> : <Bookmark />}
                          {saved.includes(key) ? "Saved to your library" : "Save to my watchlist"}
                        </Button>
                      ) : (
                        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                          <Link href="/signin">Sign in to save</Link>
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      <footer className="border-t border-border py-6 text-xs text-muted-foreground">
        <Link href="/credits">Movie and television metadata & images: TMDB · Credits ↗</Link>
      </footer>
    </div>
  );
}
