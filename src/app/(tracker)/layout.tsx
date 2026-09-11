import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, authConfigured } from "@/auth";
import { getDb } from "@/lib/server/db";
import { libraryService } from "@/lib/server/library-service";
import { purgeExpiredMetadata } from "@/lib/server/tmdb";
import { AppProvider } from "@/components/app-provider";
import { AppShell } from "@/components/app-shell";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function TrackerLayout({ children }: { children: React.ReactNode }) {
  if (!authConfigured()) redirect("/signin?setup=required");
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  await purgeExpiredMetadata();
  const initial = await libraryService(getDb()).snapshot(session.user.id);
  return (
    <AppProvider initial={initial}>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
