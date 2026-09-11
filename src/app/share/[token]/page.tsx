import type { Metadata } from "next";
import { auth, authConfigured } from "@/auth";
import { SharedListPage } from "@/components/shared-list";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shared collection",
  robots: { index: false, follow: false, noarchive: true },
};
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const session = authConfigured() ? await auth() : null;
  return <SharedListPage token={(await params).token} signedIn={!!session?.user?.id} />;
}
