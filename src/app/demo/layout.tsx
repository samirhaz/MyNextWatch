import type { Metadata } from "next";
import { Suspense } from "react";
import { AppProvider } from "@/components/app-provider";
import { AppShell } from "@/components/app-shell";
import { demoSnapshot } from "@/lib/demo";
export const metadata: Metadata = {
  title: "Interactive portfolio demo",
  robots: { index: false, follow: false },
};
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider initial={demoSnapshot()} demo>
      <Suspense>
        <AppShell>{children}</AppShell>
      </Suspense>
    </AppProvider>
  );
}
