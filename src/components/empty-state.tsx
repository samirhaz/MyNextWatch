import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { Button } from "./ui/button";
export function EmptyState({
  title,
  description,
  href,
  action,
  onReset,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-primary/10">
        <Clapperboard className="size-6 text-primary" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {href && (
        <Button asChild className="mt-6">
          <Link href={href}>{action || "Discover something new"}</Link>
        </Button>
      )}
      {onReset && (
        <Button className="mt-6" variant="outline" onClick={onReset}>
          Reset filters
        </Button>
      )}
    </div>
  );
}
