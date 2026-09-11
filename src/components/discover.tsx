"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Compass, Loader2, Search, SlidersHorizontal, TrendingUp, X } from "lucide-react";
import { useApp } from "./app-provider";
import { api } from "@/lib/client-api";
import { DEMO_TITLES } from "@/lib/demo";
import { type CatalogPage, type MediaType, type ReferenceData, titleKey } from "@/lib/types";
import { Button } from "./ui/button";
import { Input, Select } from "./ui/input";
import { GridSkeleton } from "./ui/skeleton";
import { TitleCard } from "./title-card";
import { EmptyState } from "./empty-state";
export function Discover() {
  const { demo, data } = useApp();
  const params = useSearchParams();
  const pathname = usePathname();
  const q = params.get("q") || "";
  const type: MediaType = params.get("type") === "tv" ? "tv" : "movie";
  const mode = params.get("mode") === "discover" ? "discover" : "trending";
  const genre = params.get("genre") || "";
  const year = params.get("year") || "";
  const provider = params.get("provider") || "";
  const sort = params.get("sort") || "popularity.desc";
  const [input, setInput] = useState({ urlValue: q, value: q });
  if (input.urlValue !== q) setInput({ urlValue: q, value: q });
  const queryInput = input.urlValue === q ? input.value : q;
  const setQueryInput = (value: string) => setInput({ urlValue: q, value });
  const [showFilters, setShowFilters] = useState(false);
  const [referenceResponse, setReferenceResponse] = useState<{
    key: string;
    data?: ReferenceData;
    error?: string;
  } | null>(null);
  const [cursor, setCursor] = useState({ key: "", page: 1 });
  const [result, setResult] = useState<{ key: string; data: CatalogPage } | null>(null);
  const [requestState, setRequestState] = useState<{ key: string; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
  }
  useEffect(() => {
    if (queryInput === q) return;
    const timeout = setTimeout(
      () => update({ q: queryInput.trim(), genre: "", year: "", provider: "", sort: "" }),
      350,
    );
    return () => clearTimeout(timeout);
    // update reads the current URL, so queued input never restores stale filter parameters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput, q]);
  const key = new URLSearchParams({
    q,
    type,
    mode,
    genre: q ? "" : genre,
    year: q ? "" : year,
    provider: q ? "" : provider,
    sort: q ? "popularity.desc" : sort,
  }).toString();
  const page = cursor.key === key ? cursor.page : 1;
  const referenceKey = `${type}:${data.user.country}:${retry}`;
  const requestKey = `${key}:${page}:${retry}:${data.user.country}`;
  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    api<ReferenceData>(`/reference?type=${type}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setReferenceResponse({ key: referenceKey, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setReferenceResponse({ key: referenceKey, error: error.message });
      });
    return () => controller.abort();
  }, [demo, type, referenceKey]);
  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    api<CatalogPage>(`/catalog?${key}&page=${page}`, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        setResult((previous) => ({
          key,
          data: {
            ...response,
            results:
              page > 1 && previous?.key === key
                ? [
                    ...new Map(
                      [...previous.data.results, ...response.results].map((title) => [
                        titleKey(title),
                        title,
                      ]),
                    ).values(),
                  ]
                : response.results,
          },
        }));
        setRequestState({ key: requestKey });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setRequestState({ key: requestKey, error: error.message });
      });
    return () => controller.abort();
  }, [key, page, demo, requestKey]);
  const sampleGenres = [
    ...new Map(
      DEMO_TITLES.filter((title) => title.mediaType === type)
        .flatMap((title) => title.genres)
        .map((genre) => [genre.id, genre]),
    ).values(),
  ];
  const reference = demo
    ? { genres: sampleGenres, providers: [], countries: [] }
    : referenceResponse?.key === referenceKey
      ? referenceResponse.data
      : null;
  const referenceError = referenceResponse?.key === referenceKey ? referenceResponse.error : "";
  const error = requestState?.key === requestKey ? requestState.error : "";
  const loading = !demo && requestState?.key !== requestKey;
  const current = demo
    ? sampleCatalog(new URLSearchParams(key))
    : result?.key === key
      ? result.data
      : null;
  const isTyping = queryInput.trim() !== q;
  function reset() {
    setQueryInput("");
    window.history.replaceState(null, "", pathname);
  }
  return (
    <div className="space-y-7">
      <div>
        <p className="eyebrow mb-2">Follow your curiosity</p>
        <h1 className="page-title">
          Find your next favorite<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Big-screen escapes. One-more-episode nights. It all starts here.
        </p>
      </div>
      <form
        role="search"
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          update({ q: queryInput.trim(), genre: "", year: "", provider: "", sort: "" });
        }}
      >
        <Search className="pointer-events-none absolute left-4 top-4 size-5 text-primary" />
        <Input
          aria-label="Search movies and TV shows"
          placeholder="A title you love, or one you've been meaning to watch..."
          className="h-14 bg-card pl-12 pr-24 text-sm"
          value={queryInput}
          maxLength={200}
          onChange={(event) => setQueryInput(event.target.value)}
        />
        <button
          type="submit"
          className="absolute right-3 top-2 h-10 px-3 text-xs font-semibold text-primary"
        >
          Search
        </button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap gap-1">
          {(["movie", "tv"] as const).map((value) => (
            <Button
              key={value}
              variant={type === value ? "secondary" : "ghost"}
              onClick={() => update({ type: value, genre: "", provider: "" })}
              aria-pressed={type === value}
            >
              {value === "movie" ? "Movies" : "TV shows"}
            </Button>
          ))}
          <span className="mx-2 hidden w-px bg-border sm:block" />
          <Button
            variant={mode === "trending" && !q ? "secondary" : "ghost"}
            onClick={() => {
              setQueryInput("");
              update({ q: "", mode: "trending", genre: "", year: "", provider: "", sort: "" });
            }}
          >
            <TrendingUp />
            {demo ? "Sample picks" : "Trending this week"}
          </Button>
          <Button
            variant={mode === "discover" && !q ? "secondary" : "ghost"}
            onClick={() => {
              setQueryInput("");
              update({ mode: "discover", q: "" });
            }}
          >
            <Compass />
            Browse
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal />
          Filters
        </Button>
      </div>
      {(showFilters || genre || year || provider || sort !== "popularity.desc") && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          {q && (
            <p className="text-xs leading-5 text-primary">
              TMDB search uses relevance ordering. Clear your search to filter and sort the full
              discovery catalog.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="field-label">Genre</span>
              <Select
                disabled={!!q || !reference}
                value={genre}
                onChange={(event) => update({ genre: event.target.value, mode: "discover" })}
              >
                <option value="">All genres</option>
                {reference?.genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span className="field-label">Release year</span>
              <Input
                disabled={!!q}
                value={year}
                maxLength={4}
                inputMode="numeric"
                placeholder="Any year"
                onChange={(event) =>
                  update({ year: event.target.value.replace(/\D/g, ""), mode: "discover" })
                }
              />
            </label>
            <label>
              <span className="field-label">Platform · {data.user.country}</span>
              <Select
                disabled={!!q || !reference?.providers.length}
                value={provider}
                onChange={(event) => update({ provider: event.target.value, mode: "discover" })}
              >
                <option value="">{demo ? "Not simulated in demo" : "Any platform"}</option>
                {reference?.providers.map((provider) => (
                  <option key={provider.provider_id} value={provider.provider_id}>
                    {provider.provider_name}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span className="field-label">Sort discovery</span>
              <Select
                disabled={!!q}
                value={sort}
                onChange={(event) => update({ sort: event.target.value, mode: "discover" })}
              >
                <option value="popularity.desc">Popularity</option>
                <option value="title.asc">Title A–Z</option>
                <option value="primary_release_date.desc">Release date</option>
                <option value="vote_average.desc">TMDB rating</option>
              </Select>
            </label>
          </div>
          <p className="text-[10px] leading-5 text-muted-foreground">
            Platform matches include subscription, free, ads, rental, and purchase offers. Check the
            title page for the offer type.
          </p>
          {referenceError && (
            <p role="alert" className="text-xs text-red-300">
              Filter options could not load: {referenceError}
            </p>
          )}
          <Button size="sm" variant="ghost" onClick={reset}>
            <X />
            Reset filters
          </Button>
        </div>
      )}
      <div className="flex justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          {q
            ? `Results for “${q}”`
            : demo
              ? "A few stories to get you started"
              : mode === "trending" && !genre && !year && !provider
                ? `Trending ${type === "movie" ? "movies" : "TV shows"}`
                : "Explore the catalog"}
        </h2>
        {current && (
          <span className="pt-1 text-xs text-muted-foreground">
            {current.totalResults.toLocaleString()} {demo ? "sample titles" : "results"}
          </span>
        )}
      </div>
      {demo && (
        <p className="text-xs text-muted-foreground">
          Curated sample titles and illustrative ratings. This is not live TMDB discovery.
        </p>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-5">
          <p className="text-sm text-red-200">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => setRetry(retry + 1)}>
            Try again
          </Button>
        </div>
      )}
      {isTyping || (!current && loading) ? (
        <GridSkeleton />
      ) : current?.results.length ? (
        <>
          <div className="poster-grid">
            {current.results.map((title) => (
              <TitleCard key={titleKey(title)} title={title} />
            ))}
          </div>
          {current.page < current.totalPages && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => setCursor({ key, page: current.page + 1 })}
              >
                {loading && <Loader2 className="animate-spin" />}Load more titles
              </Button>
            </div>
          )}
        </>
      ) : !error && !loading ? (
        <EmptyState
          title="No matches, yet."
          description="Try another title or clear your filters. There’s always another great story."
          onReset={reset}
        />
      ) : null}
    </div>
  );
}
function sampleCatalog(filters: URLSearchParams): CatalogPage {
  let titles = DEMO_TITLES.filter(
    (title) =>
      title.mediaType === filters.get("type") &&
      (!filters.get("q") || title.name.toLowerCase().includes(filters.get("q")!.toLowerCase())) &&
      (!filters.get("genre") ||
        title.genres.some((genre) => String(genre.id) === filters.get("genre"))) &&
      (!filters.get("year") || title.releaseDate?.startsWith(filters.get("year")!)),
  );
  if (filters.get("sort") === "title.asc")
    titles = titles.toSorted((a, b) => a.name.localeCompare(b.name));
  if (filters.get("sort") === "primary_release_date.desc")
    titles = titles.toSorted((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""));
  if (filters.get("sort") === "vote_average.desc")
    titles = titles.toSorted((a, b) => (b.communityRating || 0) - (a.communityRating || 0));
  return { results: titles, page: 1, totalPages: 1, totalResults: titles.length };
}
