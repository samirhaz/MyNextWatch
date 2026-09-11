import { notFound } from "next/navigation";
import { Dashboard } from "./dashboard";
import { Discover } from "./discover";
import { Collection } from "./collection";
import { ListsPage } from "./lists";
import { SettingsPage } from "./settings";
import { TitleDetail } from "./title-detail";
export function PageRouter({ path }: { path: string[] }) {
  if (path.length === 1) {
    if (path[0] === "dashboard") return <Dashboard />;
    if (path[0] === "discover") return <Discover />;
    if (path[0] === "watchlist") return <Collection kind="watchlist" />;
    if (path[0] === "library") return <Collection kind="library" />;
    if (path[0] === "lists") return <ListsPage />;
    if (path[0] === "settings") return <SettingsPage />;
  }
  if (path.length === 2 && path[0] === "lists") return <Collection kind="list" listId={path[1]} />;
  if (
    path.length === 3 &&
    path[0] === "title" &&
    (path[1] === "movie" || path[1] === "tv") &&
    /^\d+$/.test(path[2]) &&
    Number(path[2]) > 0 &&
    Number(path[2]) <= 2147483647
  )
    return <TitleDetail type={path[1]} tmdbId={Number(path[2])} />;
  notFound();
}
