"use client";
import { useState } from "react";
import Link from "next/link";
import { Copy, Link2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "./app-provider";
import { api } from "@/lib/client-api";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
export function ShareDialog({ scope, enabled }: { scope: string; enabled: boolean }) {
  const { demo, reload } = useApp();
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  async function update(action: "enable" | "regenerate" | "disable") {
    setPending(true);
    try {
      const result = await api<{ path: string | null }>(`/shares/${scope}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setUrl(result.path ? `${window.location.origin}${result.path}` : "");
      await reload();
      toast.success(
        action === "disable"
          ? "Sharing disabled. The old link no longer works."
          : "Your read-only link is ready.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sharing could not be updated.");
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link2 />
          {enabled ? "Manage sharing" : "Share list"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share a little inspiration.</DialogTitle>
          <DialogDescription>
            Anyone holding an enabled link can view the titles in this list. Your personal ratings,
            notes, progress, and account details stay private.
          </DialogDescription>
        </DialogHeader>
        {demo ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Demo collections are temporary. Sign in to save your own list and create a working
              share link.
            </p>
            <Button asChild>
              <Link href="/signin">Sign in to share</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-lg bg-secondary p-4 text-sm">
              <ShieldCheck className="size-5 text-primary" />
              {enabled ? "Read-only sharing is enabled" : "This list is private"}
            </div>
            {url && (
              <div>
                <label className="field-label" htmlFor={`share-link-${scope}`}>
                  Copy and keep this link
                </label>
                <div className="flex gap-2">
                  <Input
                    id={`share-link-${scope}`}
                    value={url}
                    readOnly
                    onFocus={(event) => event.target.select()}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Copy share link"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success("Link copied");
                      } catch {
                        toast.error(
                          "Could not copy automatically. Select and copy the link above.",
                        );
                      }
                    }}
                  >
                    <Copy />
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Regenerating or disabling sharing invalidates the previous link. Copy a new link now;
              for privacy, it cannot be retrieved later.
            </p>
            <div className="flex flex-wrap gap-3">
              {enabled ? (
                <>
                  <Button disabled={pending} onClick={() => update("regenerate")}>
                    {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}Regenerate link
                  </Button>
                  <Button variant="outline" disabled={pending} onClick={() => update("disable")}>
                    Disable sharing
                  </Button>
                </>
              ) : (
                <Button disabled={pending} onClick={() => update("enable")}>
                  {pending ? <Loader2 className="animate-spin" /> : <Link2 />}Enable sharing
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
