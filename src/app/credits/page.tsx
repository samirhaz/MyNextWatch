import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
export const metadata = { title: "About & credits" };
export default function Credits() {
  return (
    <main className="mx-auto max-w-3xl space-y-9 px-6 py-12">
      <Link href="/" className="inline-block">
        <Brand />
      </Link>
      <div>
        <p className="eyebrow text-primary">Made for the love of a good story</p>
        <h1 className="page-title mt-3">About MyNextWatch.</h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          A personal home for your movie and television watchlist, ratings, notes, and collections.
          Your library is private; you choose which lists to share.
        </p>
      </div>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">The stories behind the stories</h2>
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <Image
            src="/tmdb-logo.svg"
            alt="The Movie Database (TMDB)"
            width={166}
            height={12}
            className="h-auto"
          />
        </a>
        <p className="text-sm leading-7 text-muted-foreground">
          This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise
          approved by TMDB.
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          Movie and television metadata and imagery come from TMDB. Images belong to their
          respective rights holders. Streaming availability is provided by{" "}
          <a
            href="https://www.justwatch.com"
            className="text-primary underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            JustWatch
          </a>{" "}
          through TMDB. Availability is regional and can change. Subscription, free, ad-supported,
          rental, and purchase offers are shown separately.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">A clear distinction between demo and account</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          The portfolio demo is an interactive sample collection. Its illustrative metadata and
          ratings are not live data, and its changes reset on refresh. It does not create an
          account, write to a real library, or simulate streaming offers. Signed-in users start with
          an empty library and save their data to MySQL.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Privacy in practice</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          GitHub sign-in uses your profile and email to create an account. Authentication uses a
          secure session cookie. Notes, personal ratings, and progress stay private. Shared links
          reveal only a list’s name, description, titles, and dates added. Anyone with the link can
          read or copy that information until you revoke the link. Poster images load from TMDB, so
          your browser connects to its image service.
        </p>
      </section>
      <Button asChild>
        <Link href="/">Back to the good stuff →</Link>
      </Button>
    </main>
  );
}
