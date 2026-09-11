import { Suspense } from "react";
import { PageRouter } from "@/components/page-router";
import { GridSkeleton } from "@/components/ui/skeleton";
export default async function DemoPage({ params }: { params: Promise<{ path?: string[] }> }) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <PageRouter path={(await params).path || ["dashboard"]} />
    </Suspense>
  );
}
