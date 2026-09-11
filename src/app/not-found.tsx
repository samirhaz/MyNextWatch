import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-xl flex-col justify-center gap-5 px-6">
      <p className="eyebrow">Scene missing · 404</p>
      <h1 className="page-title">This page is off screen.</h1>
      <p className="text-sm text-muted-foreground">
        The link may have changed, or this page doesn’t exist.
      </p>
      <Button asChild className="self-start">
        <Link href="/">Back to MyNextWatch</Link>
      </Button>
    </main>
  );
}
