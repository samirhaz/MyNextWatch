"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, FolderHeart, LockKeyhole, Pencil, Plus, Trash2 } from "lucide-react";
import { useApp } from "./app-provider";
import { type CustomList, titleKey } from "@/lib/types";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input, Textarea } from "./ui/input";
import { ConfirmDelete } from "./tracking";
import { Poster } from "./poster";
import { EmptyState } from "./empty-state";
export function ListEditor({ list }: { list?: CustomList }) {
  const { saveList, deleteList, busy, href } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(list?.name || "");
  const [description, setDescription] = useState(list?.description || "");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={list ? "outline" : "default"}>
          {list ? <Pencil /> : <Plus />}
          {list ? "Edit list" : "Create a list"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {list ? "Give your collection a new chapter." : "Every collection starts with an idea."}
          </DialogTitle>
          <DialogDescription>
            Group titles by mood, movie night, or whatever feels right. New lists are private.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await saveList({ name, description }, list?.id)) {
              setOpen(false);
              if (!list) {
                setName("");
                setDescription("");
              }
            }
          }}
        >
          <label className="block">
            <span className="field-label">List name</span>
            <Input
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Rainy Sunday cinema"
            />
          </label>
          <label className="block">
            <span className="field-label">Description · Optional</span>
            <Textarea
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Set the mood for this collection..."
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button disabled={busy} type="submit">
              {list ? "Save changes" : "Create list"}
            </Button>
            {list && (
              <ConfirmDelete
                title="Delete this custom list?"
                description="Its share link will stop working. Your library entries, ratings, and notes will be kept."
                onConfirm={async () => {
                  const ok = await deleteList(list.id);
                  if (ok) {
                    setOpen(false);
                    router.push(href("/lists"));
                  }
                  return ok;
                }}
              >
                <Button variant="ghost" type="button">
                  <Trash2 />
                  Delete list
                </Button>
              </ConfirmDelete>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function ListsPage() {
  const { data, href } = useApp();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow mb-2">Good taste deserves a collection</p>
          <h1 className="page-title">
            Your lists<span className="text-primary">.</span>
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground">
            For every mood, every movie night, every “you have to see this.”
          </p>
        </div>
        <ListEditor />
      </div>
      {data.lists.length ? (
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {data.lists.map((list) => (
            <Link
              key={list.id}
              href={href(`/lists/${list.id}`)}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
            >
              <div className="grid h-[200px] grid-cols-4 gap-1 overflow-hidden bg-secondary sm:h-[240px]">
                {Array.from({ length: 4 }, (_, i) =>
                  list.items[i] ? (
                    <Poster
                      key={i}
                      path={list.items[i].title.posterPath}
                      title={list.items[i].title.name}
                      className="h-full transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      key={i}
                      className="film-grain grid h-full place-items-center bg-background/60"
                    >
                      <FolderHeart className="size-6 text-muted-foreground/40" />
                    </div>
                  ),
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="break-words text-lg font-semibold tracking-tight">{list.name}</h2>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-primary" />
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
                  {list.description || "A collection waiting for its next great story."}
                </p>
                <div className="mt-5 flex justify-between border-t border-border pt-4 text-[10px] text-muted-foreground">
                  <span>{list.items.length} titles</span>
                  <span className="flex items-center gap-1.5">
                    <LockKeyhole className="size-3" />
                    {list.shared ? "Link sharing enabled" : "Private collection"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="What kind of movie night is it?"
          description="Create your first list, then add titles from your library or a title’s details page."
        />
      )}
    </div>
  );
}
export function AddListTitles({ list }: { list: CustomList }) {
  const { data, listTitle, href, busy } = useApp();
  const [query, setQuery] = useState("");
  const entries = data.entries.filter((entry) =>
    entry.title.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add titles
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a title to this list</DialogTitle>
          <DialogDescription>
            Choose from your library, or discover something new and add it from its details page.
          </DialogDescription>
        </DialogHeader>
        <Input
          aria-label="Search library to add to list"
          placeholder="Search your library..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {entries.map((entry) => {
            const included = list.items.some(
              (item) => titleKey(item.title) === titleKey(entry.title),
            );
            return (
              <div
                className="flex items-center gap-3 rounded-lg border border-border p-2"
                key={entry.id}
              >
                <Poster
                  path={entry.title.posterPath}
                  title={entry.title.name}
                  className="h-14 w-10 shrink-0 rounded"
                />
                <span className="min-w-0 flex-1 text-sm">{entry.title.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy}
                  aria-label={`${included ? "Remove" : "Add"} ${entry.title.name} ${included ? "from" : "to"} this list`}
                  onClick={() => listTitle(list.id, entry.title, included)}
                >
                  {included ? <Check className="text-primary" /> : <Plus />}
                </Button>
              </div>
            );
          })}
          {!entries.length && (
            <p className="py-4 text-sm text-muted-foreground">
              No matching titles in your library.
            </p>
          )}
        </div>
        <Button asChild variant="outline" className="mt-5 w-full">
          <Link href={href("/discover")}>
            Discover more titles
            <ArrowUpRight />
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
