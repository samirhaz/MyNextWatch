import { redirect } from "next/navigation";
import { auth, authConfigured } from "@/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (authConfigured()) {
    const session = await auth();
    if (session?.user?.id) redirect("/dashboard");
  }
  redirect("/demo/dashboard");
}
