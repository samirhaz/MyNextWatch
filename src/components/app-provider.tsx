"use client";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { titleKey, type Snapshot, type Title } from "@/lib/types";
import { libraryPatchSchema, listSchema, type LibraryPatch } from "@/lib/validation";
type Store = {
  data: Snapshot;
  demo: boolean;
  busy: boolean;
  href: (path: string) => string;
  addTitle: (title: Title) => Promise<boolean>;
  patchEntry: (id: string, patch: LibraryPatch) => Promise<boolean>;
  removeEntry: (id: string) => Promise<boolean>;
  saveList: (input: { name: string; description: string }, id?: string) => Promise<boolean>;
  deleteList: (id: string) => Promise<boolean>;
  listTitle: (listId: string, title: Title, remove?: boolean) => Promise<boolean>;
  saveCountry: (country: string) => Promise<boolean>;
  reload: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function AppProvider({
  initial,
  demo = false,
  children,
}: {
  initial: Snapshot;
  demo?: boolean;
  children: ReactNode;
}) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function reload() {
    if (!demo) setData(await api<Snapshot>("/me"));
  }
  async function change(
    path: string,
    method: string,
    body: unknown,
    updateDemo: (snapshot: Snapshot) => Snapshot,
    message: string,
  ) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    try {
      if (demo) setData((previous) => updateDemo(previous));
      else {
        await api(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
        try {
          await reload();
        } catch {
          toast.warning(
            "Your change was saved, but the view could not refresh. Reload the page to see it.",
          );
          return true;
        }
      }
      toast.success(demo ? `${message} · Demo only` : message);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save. Please try again.");
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const store: Store = {
    data,
    demo,
    busy,
    href: (path) => `${demo ? "/demo" : ""}${path}`,
    reload,
    addTitle: (title) =>
      change(
        "/library",
        "POST",
        { tmdbId: title.tmdbId, mediaType: title.mediaType },
        (snapshot) => {
          if (snapshot.entries.some((entry) => titleKey(entry.title) === titleKey(title)))
            return snapshot;
          const now = new Date().toISOString();
          return {
            ...snapshot,
            entries: [
              {
                id: crypto.randomUUID(),
                titleId: title.id,
                title,
                status: "PLAN_TO_WATCH",
                rating: null,
                notes: null,
                season: 1,
                episode: 0,
                createdAt: now,
                updatedAt: now,
              },
              ...snapshot.entries,
            ],
          };
        },
        "Added to your watchlist",
      ),
    patchEntry: (id, patch) => {
      const parsed = libraryPatchSchema.safeParse(patch);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return Promise.resolve(false);
      }
      return change(
        `/library/${id}`,
        "PATCH",
        parsed.data,
        (snapshot) => ({
          ...snapshot,
          entries: snapshot.entries.map((entry) =>
            entry.id === id
              ? { ...entry, ...parsed.data, updatedAt: new Date().toISOString() }
              : entry,
          ),
        }),
        "Changes saved",
      );
    },
    removeEntry: (id) =>
      change(
        `/library/${id}`,
        "DELETE",
        undefined,
        (snapshot) => ({
          ...snapshot,
          entries: snapshot.entries.filter((entry) => entry.id !== id),
        }),
        "Removed from your library",
      ),
    saveList: (input, id) => {
      const parsed = listSchema.safeParse(input);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return Promise.resolve(false);
      }
      return change(
        id ? `/lists/${id}` : "/lists",
        id ? "PATCH" : "POST",
        parsed.data,
        (snapshot) => ({
          ...snapshot,
          lists: id
            ? snapshot.lists.map((list) => (list.id === id ? { ...list, ...input } : list))
            : [
                {
                  id: crypto.randomUUID(),
                  ...input,
                  items: [],
                  shared: false,
                  createdAt: new Date().toISOString(),
                },
                ...snapshot.lists,
              ],
        }),
        id ? "List updated" : "List created",
      );
    },
    deleteList: (id) =>
      change(
        `/lists/${id}`,
        "DELETE",
        undefined,
        (snapshot) => ({ ...snapshot, lists: snapshot.lists.filter((list) => list.id !== id) }),
        "List deleted",
      ),
    listTitle: (listId, title, remove = false) =>
      change(
        `/lists/${listId}/items${remove ? `/${title.id}` : ""}`,
        remove ? "DELETE" : "POST",
        remove ? undefined : { tmdbId: title.tmdbId, mediaType: title.mediaType },
        (snapshot) => ({
          ...snapshot,
          lists: snapshot.lists.map((list) =>
            list.id !== listId
              ? list
              : {
                  ...list,
                  items: remove
                    ? list.items.filter((item) => titleKey(item.title) !== titleKey(title))
                    : list.items.some((item) => titleKey(item.title) === titleKey(title))
                      ? list.items
                      : [
                          {
                            id: crypto.randomUUID(),
                            titleId: title.id,
                            title,
                            createdAt: new Date().toISOString(),
                          },
                          ...list.items,
                        ],
                },
          ),
        }),
        remove ? "Removed from this list" : "Added to this list",
      ),
    saveCountry: (country) =>
      change(
        "/preferences",
        "PATCH",
        { country },
        (snapshot) => ({ ...snapshot, user: { ...snapshot.user, country } }),
        "Country saved",
      ),
  };
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider is required.");
  return value;
}
