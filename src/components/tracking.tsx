"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Bookmark, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { useApp } from "./app-provider";
import {
  titleKey,
  STATUSES,
  STATUS_LABELS,
  type Title,
  type Entry,
  type Status,
} from "@/lib/types";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Select, Textarea } from "./ui/input";
export function TrackDialog({ title, children }: { title: Title; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title.name}</DialogTitle>
          <DialogDescription>Your tracking, ratings, and notes are private.</DialogDescription>
        </DialogHeader>
        <TrackingPanel title={title} />
      </DialogContent>
    </Dialog>
  );
}
export function ConfirmDelete({
  title,
  description,
  onConfirm,
  children,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<boolean>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep it
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                if (await onConfirm()) setOpen(false);
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function EntryForm({ entry, title }: { entry: Entry; title: Title }) {
  const { patchEntry, busy, removeEntry } = useApp();
  const [status, setStatus] = useState<Status>(entry.status);
  const [rating, setRating] = useState(entry.rating?.toString() || "");
  const [notes, setNotes] = useState(entry.notes || "");
  const [seasonNumber, setSeasonNumber] = useState(entry.season);
  const [episodeNumber, setEpisodeNumber] = useState(entry.episode);
  const season = title.seasons.find((item) => item.season_number === seasonNumber);
  const seasonsAvailable = title.mediaType === "tv" && title.seasons.length > 0;
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await patchEntry(entry.id, {
          status,
          rating: rating ? Number(rating) : null,
          notes: notes || null,
          ...(seasonsAvailable ? { season: seasonNumber, episode: episodeNumber } : {}),
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="field-label">Tracking status</span>
          <Select value={status} onChange={(event) => setStatus(event.target.value as Status)}>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="field-label">Your rating</span>
          <Select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="">Unrated</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} / 10
              </option>
            ))}
          </Select>
        </label>
      </div>
      {seasonsAvailable && (
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="field-label">Current season</span>
            <Select
              value={seasonNumber}
              onChange={(event) => {
                setSeasonNumber(Number(event.target.value));
                setEpisodeNumber(0);
              }}
            >
              {title.seasons.map((season) => (
                <option key={season.season_number} value={season.season_number}>
                  {season.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="field-label">Last episode watched</span>
            <Select
              value={episodeNumber}
              onChange={(event) => setEpisodeNumber(Number(event.target.value))}
            >
              {Array.from({ length: (season?.episode_count || 0) + 1 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? "Not started" : `Episode ${i}`}
                </option>
              ))}
            </Select>
          </label>
        </div>
      )}
      <label className="block">
        <span className="field-label">
          Private notes <span className="font-normal text-muted-foreground">· Optional</span>
        </span>
        <Textarea
          value={notes}
          maxLength={5000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What stayed with you? No one else can see this."
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Check />}Save tracking
        </Button>
        <ConfirmDelete
          title="Remove from your library?"
          description="This removes your rating, notes, and progress for this title. Its membership in custom lists is kept."
          onConfirm={() => removeEntry(entry.id)}
        >
          <Button type="button" variant="ghost" size="sm">
            <Trash2 />
            Remove from library
          </Button>
        </ConfirmDelete>
      </div>
    </form>
  );
}
export function TrackingPanel({ title }: { title: Title }) {
  const { data, busy, href, addTitle, listTitle } = useApp();
  const entry = data.entries.find((item) => titleKey(item.title) === titleKey(title));
  return (
    <div className="space-y-7">
      {entry ? (
        <EntryForm key={`${entry.id}-${entry.updatedAt}`} entry={entry} title={title} />
      ) : (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Save this title to track your progress and give it a personal rating.
          </p>
          <Button disabled={busy} onClick={() => addTitle(title)}>
            <Bookmark />
            Add to watchlist
          </Button>
        </div>
      )}
      <div className="border-t border-border pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Add to a collection</h3>
          <Link href={href("/lists")} className="text-xs text-primary">
            Manage lists ↗
          </Link>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Collection membership is separate from your library.
        </p>
        {data.lists.length ? (
          <div className="space-y-1">
            {data.lists.map((list) => {
              const included = list.items.some((item) => titleKey(item.title) === titleKey(title));
              return (
                <label
                  key={list.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-secondary"
                >
                  <input
                    type="checkbox"
                    checked={included}
                    disabled={busy}
                    onChange={() => listTitle(list.id, title, included)}
                    className="size-4 accent-primary"
                  />
                  <span className="min-w-0 flex-1 break-words text-sm">{list.name}</span>
                  <span className="text-[10px] text-muted-foreground">{list.items.length}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <Button variant="outline" asChild>
            <Link href={href("/lists")}>
              <Plus />
              Create your first list
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
