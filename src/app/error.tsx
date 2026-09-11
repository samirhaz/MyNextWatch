"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-xl flex-col justify-center gap-5 px-6">
      <p className="eyebrow">An unexpected intermission</p>
      <h1 className="page-title">Something didn’t load.</h1>
      <p className="text-sm leading-7 text-muted-foreground">
        Please try again. If this keeps happening during setup, check your environment variables,
        database connection, and applied migrations.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/demo/dashboard">Explore the demo</Link>
        </Button>
      </div>
    </main>
  );
}
