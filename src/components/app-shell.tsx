"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bookmark,
  Clapperboard,
  Compass,
  FolderHeart,
  LayoutDashboard,
  Library,
  Menu,
  Search,
  Settings2,
  ArrowUpRight,
  ChevronRight,
  Film,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useApp } from "./app-provider";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
const NAV = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Discover", path: "/discover", icon: Compass },
  { label: "Watchlist", path: "/watchlist", icon: Bookmark },
  { label: "My Library", path: "/library", icon: Library },
  { label: "My Lists", path: "/lists", icon: FolderHeart },
  { label: "Settings", path: "/settings", icon: Settings2 },
];
export function Brand() {
  return (
    <span className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-.7px]">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Clapperboard className="size-[19px]" strokeWidth={2.3} />
      </span>
      MyNextWatch<span className="text-primary">.</span>
    </span>
  );
}
export function AppShell({
  children,
  sharedDemo = false,
}: {
  children: ReactNode;
  sharedDemo?: boolean;
}) {
  const { data, demo, href } = useApp();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = data.entries.filter((entry) => entry.status === "PLAN_TO_WATCH").length;
  const section =
    NAV.find((item) => pathname.startsWith(href(item.path)))?.label || "Title details";
  const navigation = (
    <>
      <p className="eyebrow mb-4 px-3">Your space</p>
      <nav aria-label="Main navigation" className="space-y-1">
        {NAV.map(({ label, path, icon: Icon }) => (
          <Link
            key={path}
            href={href(path)}
            onClick={() => setMobileOpen(false)}
            className="nav-item"
            aria-current={pathname.startsWith(href(path)) ? "page" : undefined}
          >
            <Icon className="size-[18px]" strokeWidth={1.7} />
            {label}
            {path === "/watchlist" && (
              <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 text-[10px] tabular-nums text-primary">
                {count}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-9 border-t border-border pt-6">
        <p className="eyebrow mb-4 px-3">Your collections</p>
        {data.lists.slice(0, 3).map((list) => (
          <Link
            href={href(`/lists/${list.id}`)}
            onClick={() => setMobileOpen(false)}
            key={list.id}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-primary/70" />
            <span className="truncate">{list.name}</span>
          </Link>
        ))}
        <Link
          href={href("/lists")}
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-3 text-xs text-muted-foreground"
        >
          <span className="text-lg">+</span>Create a collection
        </Link>
      </div>
    </>
  );
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:translate-y-0"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[228px] flex-col border-r border-border bg-[#141515] lg:flex">
        <Link href={href("/dashboard")} className="px-6 py-8" aria-label="MyNextWatch dashboard">
          <Brand />
        </Link>
        <div className="flex-1 overflow-y-auto px-4 pt-6">{navigation}</div>
        <div className="m-4 rounded-xl border border-border bg-card p-4">
          <Film className="mb-3 size-5 text-primary" />
          <p className="text-xs font-medium">Less scrolling. More watching.</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Your next favorite is already on your list.
          </p>
          <Link
            href={href("/watchlist?pick=true")}
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary"
          >
            Pick something for me
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="flex items-center gap-3 border-t border-border px-5 py-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#30342f] text-sm font-semibold text-primary">
            {data.user.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{data.user.name}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {demo ? "Portfolio demo" : "Your private account"}
            </p>
          </div>
          {!demo && (
            <button
              aria-label="Sign out"
              className="grid size-10 place-items-center text-muted-foreground"
              onClick={() => signOut({ callbackUrl: "/signin" })}
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </aside>
      <div className="lg:pl-[228px]">
        <header className="flex h-[76px] items-center justify-between gap-3 border-b border-border px-5 sm:px-8 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>MyNextWatch</DialogTitle>
                  <DialogDescription>Your personal movie and television tracker.</DialogDescription>
                </DialogHeader>
                {navigation}
                {!demo && (
                  <Button
                    className="mt-5"
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: "/signin" })}
                  >
                    Sign out
                  </Button>
                )}
              </DialogContent>
            </Dialog>
            <span className="hidden text-xs text-muted-foreground sm:inline">Your workspace</span>
            <ChevronRight className="hidden size-3 text-muted-foreground sm:block" />
            <span className="truncate text-xs font-medium">{section}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={href("/discover")}
              className="flex h-10 items-center gap-3 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground"
              aria-label="Search movies and shows"
            >
              <Search className="size-4" />
              <span className="hidden md:inline">Find your next watch...</span>
            </Link>
            <Link
              href={href("/settings")}
              className="hidden rounded-lg border border-border px-3 py-2 text-[11px] text-muted-foreground sm:block"
            >
              {data.user.country}
            </Link>
            {demo && !sharedDemo && (
              <Button asChild size="sm">
                <Link href="/signin">
                  Sign in
                  <ArrowUpRight />
                </Link>
              </Button>
            )}
          </div>
        </header>
        {demo && (
          <div className="flex flex-wrap items-center justify-center gap-x-2 border-b border-primary/15 bg-primary/[.055] px-5 py-2.5 text-center text-[11px] leading-5 text-[#c6b99f]">
            <span className="mr-1 size-1.5 rounded-full bg-primary" />
            <strong className="font-semibold text-primary">Portfolio demo</strong>
            <span>Sample data. Try the controls — changes reset on refresh.</span>
          </div>
        )}
        <main
          id="main-content"
          className="mx-auto min-h-[calc(100dvh-180px)] max-w-[1800px] px-5 py-8 sm:px-8 xl:px-10 xl:py-9"
        >
          {children}
        </main>
        <footer className="mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-border py-6 text-[10px] text-muted-foreground sm:mx-8 xl:mx-10">
          <span>Made for the love of a good story.</span>
          <Link href="/credits" className="hover:text-primary">
            Metadata & images: TMDB · Availability: JustWatch ↗
          </Link>
        </footer>
      </div>
    </div>
  );
}
