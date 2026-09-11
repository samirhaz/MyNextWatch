"use client";
import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Globe2, LockKeyhole, LogOut, Monitor, ShieldCheck } from "lucide-react";
import { useApp } from "./app-provider";
import { COUNTRIES } from "@/lib/countries";
import { Button } from "./ui/button";
import { Select } from "./ui/input";
export function SettingsPage() {
  const { data, demo, saveCountry, busy, href } = useApp();
  const [country, setCountry] = useState(data.user.country);
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="eyebrow mb-2">Make yourself at home</p>
        <h1 className="page-title">
          Your settings<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 text-[13px] text-muted-foreground">
          A few preferences. A better place to keep your stories.
        </p>
      </div>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold">
          <Globe2 className="size-5 text-primary" />
          Where you watch
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Streaming availability varies by country. Choose your region to see relevant services and
          offers.
        </p>
        <form
          className="mt-6 flex flex-wrap items-end gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await saveCountry(country);
          }}
        >
          <label className="min-w-52 flex-1">
            <span className="field-label">Country</span>
            <Select value={country} onChange={(event) => setCountry(event.target.value)}>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" disabled={busy}>
            Save preferences
          </Button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          {demo
            ? "Country selection is temporary in this demo. Streaming offers are not simulated."
            : "Your preference follows your account across devices. Offers are provided by JustWatch through TMDB."}
        </p>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold">
          <LockKeyhole className="size-5 text-primary" />
          Your account, your privacy
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your ratings, notes, and progress are private. Custom lists and your watchlist only become
          visible to others when you enable a share link.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={href("/watchlist")}>Manage watchlist sharing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={href("/lists")}>Manage your lists</Link>
          </Button>
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" />
          GitHub login requests profile and email access, never repository access.
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-3 text-lg font-semibold">
          <Monitor className="size-5 text-primary" />
          Made for comfortable browsing
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          MyNextWatch uses a dark interface, visible keyboard focus, and your device’s
          reduced-motion preference.
        </p>
        <Button asChild variant="ghost" className="mt-4">
          <Link href="/credits">About & credits ↗</Link>
        </Button>
      </section>
      {demo ? (
        <Button asChild>
          <Link href="/signin">Start your own private library</Link>
        </Button>
      ) : (
        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/signin" })}>
          <LogOut />
          Sign out
        </Button>
      )}
    </div>
  );
}
