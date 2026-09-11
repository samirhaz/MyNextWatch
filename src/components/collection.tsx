"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bookmark,
  ChevronDown,
  Dices,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "./app-provider";
import {
  DEFAULT_FILTERS,
  STATUSES,
  STATUS_LABELS,
  OFFER_LABELS,
  titleKey,
  type CollectionItem,
  type Filters,
  type Title,
} from "@/lib/types";
import { filterCollection, readFilters } from "@/lib/filters";
import { Button } from "./ui/button";
import { Input, Select } from "./ui/input";
import { TitleCard } from "./title-card";
import { EmptyState } from "./empty-state";
import { ShareDialog } from "./sharing";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { api } from "@/lib/client-api";
import { ListEditor, AddListTitles } from "./lists";
export function Collection({
  kind,
  listId,
}: {
  kind: "watchlist" | "library" | "list";
  listId?: string;
}) {
  const { data, demo, href, listTitle, busy } = useApp();
  const list = data.lists.find((list) => list.id === listId);
  const params = useSearchParams();
  const pathname = usePathname();
  const filters = readFilters(new URLSearchParams(params.toString()));
  const [showFilters, setShowFilters] = useState(false);
  const [visible, setVisible] = useState(24);
  const [picked, setPicked] = useState<Title | null>(null);
  const allItems: CollectionItem[] = useMemo(
    () =>
      kind === "list"
        ? (list?.items || []).map((item) => ({
            title: item.title,
            createdAt: item.createdAt,
            entry: data.entries.find((entry) => titleKey(entry.title) === titleKey(item.title)),
          }))
        : data.entries
            .filter((entry) => kind !== "watchlist" || entry.status === "PLAN_TO_WATCH")
            .map((entry) => ({ title: entry.title, createdAt: entry.createdAt, entry })),
    [kind, list, data.entries],
  );
  const filtered = filterCollection(allItems, filters, data.user.country);
  function update(patch: Partial<Filters>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === DEFAULT_FILTERS[key as keyof Filters]) next.delete(key);
      else next.set(key, value);
    });
    next.delete("pick");
    window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
    setVisible(24);
  }
  function reset() {
    window.history.replaceState(null, "", pathname);
    setVisible(24);
  }
  function pick() {
    if (!filtered.length) {
      toast.info("No titles match these filters. Try widening your selection.");
      return;
    }
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    setPicked(filtered[values[0] % filtered.length].title);
  }
  useEffect(() => {
    if (params.get("pick") === "true" && allItems.length) {
      // Open after navigation has painted so the dialog can move keyboard focus reliably.
      const frame = requestAnimationFrame(() => {
        const matches = filterCollection(
          allItems,
          readFilters(new URLSearchParams(params.toString())),
          data.user.country,
        );
        if (matches.length) {
          const values = new Uint32Array(1);
          crypto.getRandomValues(values);
          setPicked(matches[values[0] % matches.length].title);
        }
        const next = new URLSearchParams(params.toString());
        next.delete("pick");
        window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [params, pathname, allItems, data.user.country]);
  const genres = [
    ...new Map(
      allItems.flatMap((item) => item.title.genres).map((genre) => [genre.id, genre]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const providers = [
    ...new Map(
      allItems
        .flatMap((item) =>
          Object.keys(OFFER_LABELS).flatMap(
            (key) =>
              item.title.providers[data.user.country]?.[key as keyof typeof OFFER_LABELS] || [],
          ),
        )
        .map((provider) => [provider.provider_id, provider]),
    ).values(),
  ].sort((a, b) => a.provider_name.localeCompare(b.provider_name));
  const activeCount = Object.entries(filters).filter(
    ([key, value]) => value !== DEFAULT_FILTERS[key as keyof Filters],
  ).length;
  if (kind === "list" && !list)
    return (
      <EmptyState
        title="List not found"
        description="This list may have been deleted, or it doesn't belong to your account."
        href={href("/lists")}
        action="Back to your lists"
      />
    );
  const heading =
    kind === "list" ? list!.name : kind === "watchlist" ? "Your watchlist" : "Your library";
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="eyebrow mb-2">
            {kind === "watchlist"
              ? "So many stories. All in one place."
              : kind === "list"
                ? "A collection, curated by you"
                : "Every watch has a home"}
          </p>
          <h1 className="page-title break-words">
            {heading}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-3 max-w-2xl whitespace-pre-wrap break-words text-[13px] leading-relaxed text-muted-foreground">
            {kind === "list"
              ? list!.description || "Your own little corner of cinema."
              : kind === "watchlist"
                ? "The films and shows you're saving for the right moment."
                : "Track what you're watching, remember what you loved."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {kind === "watchlist" && (
            <>
              <Button onClick={pick}>
                <Dices />
                Pick my next watch
              </Button>
              <ShareDialog scope="watchlist" enabled={data.watchlistShared} />
            </>
          )}
          {list && (
            <>
              <AddListTitles list={list} />
              <ListEditor list={list} />
              <ShareDialog scope={list.id} enabled={list.shared} />
            </>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex gap-1 rounded-lg bg-card p-1">
            {[
              { value: "all", label: "All titles" },
              { value: "movie", label: "Movies" },
              { value: "tv", label: "TV shows" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => update({ type: type.value })}
                aria-pressed={filters.type === type.value}
                className={`min-h-10 rounded-md px-4 text-xs ${filters.type === type.value ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {type.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {allItems.length} titles
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search your collection"
              placeholder="Search your collection..."
              className="pl-10"
              value={filters.q}
              onChange={(event) => update({ q: event.target.value })}
            />
          </div>
          <Button
            variant="outline"
            aria-expanded={showFilters}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal />
            Filters{activeCount > 0 && <span className="text-primary">{activeCount}</span>}
          </Button>
          <Select
            className="w-auto min-w-40"
            aria-label="Sort titles"
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value })}
          >
            <option value="added">Recently added</option>
            <option value="title">Title A–Z</option>
            <option value="rating">Your rating</option>
            <option value="release">Release date</option>
          </Select>
          {activeCount > 0 && (
            <Button variant="ghost" onClick={reset}>
              <X />
              Reset filters
            </Button>
          )}
        </div>
        {(showFilters ||
          activeCount >
            (filters.q ? 1 : 0) +
              (filters.type !== "all" ? 1 : 0) +
              (filters.sort !== "added" ? 1 : 0)) && (
          <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 xl:grid-cols-5">
            <label>
              <span className="field-label">Genre</span>
              <Select
                value={filters.genre}
                onChange={(event) => update({ genre: event.target.value })}
              >
                <option value="all">All genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </Select>
            </label>
            {kind !== "watchlist" && (
              <label>
                <span className="field-label">Tracking status</span>
                <Select
                  value={filters.status}
                  onChange={(event) => update({ status: event.target.value })}
                >
                  <option value="all">All statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </Select>
              </label>
            )}
            <label>
              <span className="field-label">Release year</span>
              <Input
                inputMode="numeric"
                maxLength={4}
                placeholder="Any year"
                value={filters.year}
                onChange={(event) => update({ year: event.target.value.replace(/\D/g, "") })}
              />
            </label>
            <label>
              <span className="field-label">Your rating</span>
              <Select
                value={filters.rating}
                onChange={(event) => update({ rating: event.target.value })}
              >
                <option value="all">Any rating</option>
                <option value="unrated">Unrated</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} / 10
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span className="field-label">Platform · {data.user.country}</span>
              <Select
                disabled={!providers.length}
                value={filters.provider}
                onChange={(event) => update({ provider: event.target.value })}
              >
                <option value="all">
                  {providers.length ? "Any platform" : "No availability data"}
                </option>
                {providers.map((provider) => (
                  <option key={provider.provider_id} value={provider.provider_id}>
                    {provider.provider_name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        )}
        {(showFilters || filters.provider !== "all") && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <p className="max-w-2xl leading-5">
              Platform filters use saved regional availability across your entire collection,
              including rental and purchase offers. Missing data won’t match.{" "}
              {demo
                ? "Streaming availability is not simulated in the demo."
                : "Refresh to check for changes."}
            </p>
            {!demo && allItems.length > 0 && (
              <RefreshCollection titles={allItems.map((item) => item.title)} />
            )}
          </div>
        )}
      </div>
      {filtered.length ? (
        <>
          <div className="poster-grid">
            {filtered.slice(0, visible).map((item) => (
              <div key={titleKey(item.title)} className="min-w-0">
                <TitleCard title={item.title} added={item.createdAt} />
                {list && (
                  <button
                    disabled={busy}
                    onClick={() => listTitle(list.id, item.title, true)}
                    className="mt-1 min-h-9 text-[10px] text-muted-foreground hover:text-primary"
                  >
                    Remove from this list
                  </button>
                )}
              </div>
            ))}
          </div>
          {visible < filtered.length && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setVisible(visible + 24)}>
                Show more
                <ChevronDown />
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={
            activeCount
              ? "No titles in this scene."
              : kind === "watchlist"
                ? "Make room for your next favorite."
                : "A blank page, full of possibility."
          }
          description={
            activeCount
              ? "Nothing matches all your filters. Try a different combination."
              : "Discover a movie or show, then save it to start your collection."
          }
          {...(activeCount ? { onReset: reset } : { href: href("/discover") })}
        />
      )}
      {kind === "watchlist" && (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Bookmark className="size-3.5" />
          Your watchlist is the Plan to Watch view of your library.
        </p>
      )}
      <Dialog
        open={!!picked}
        onOpenChange={(open) => {
          if (!open) setPicked(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tonight, make time for this.</DialogTitle>
            <DialogDescription>
              Randomly picked from your matching watchlist titles.
            </DialogDescription>
          </DialogHeader>
          {picked && (
            <div className="mx-auto max-w-[220px]">
              <TitleCard title={picked} />
            </div>
          )}
          <Button variant="outline" className="mt-5 w-full" onClick={pick}>
            <Dices />
            Pick again
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function RefreshCollection({ titles }: { titles: Title[] }) {
  const { reload } = useApp();
  const [progress, setProgress] = useState<string | null>(null);
  async function refresh() {
    const unique = [...new Map(titles.map((title) => [titleKey(title), title])).values()];
    let failed = 0;
    try {
      for (let i = 0; i < unique.length; i += 4) {
        setProgress(`${Math.min(i + 4, unique.length)} / ${unique.length}`);
        const result = await api<{ results: { ok: boolean }[] }>("/refresh", {
          method: "POST",
          body: JSON.stringify(
            unique
              .slice(i, i + 4)
              .map((title) => ({ mediaType: title.mediaType, tmdbId: title.tmdbId })),
          ),
        });
        failed += result.results.filter((result) => !result.ok).length;
      }
      await reload();
      if (failed)
        toast.warning(`${failed} titles could not refresh availability. Try again later.`);
      else toast.success("Availability refreshed for every title in this collection.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Refresh interrupted. Some titles may still have older data.",
      );
      await reload().catch(() => {});
    } finally {
      setProgress(null);
    }
  }
  return (
    <Button variant="outline" size="sm" disabled={!!progress} onClick={refresh}>
      {progress ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {progress || "Refresh availability"}
    </Button>
  );
}
