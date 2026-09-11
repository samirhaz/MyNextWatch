import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Github, ArrowRight, LockKeyhole } from "lucide-react";
import { auth, authConfigured, signIn } from "@/auth";
import { Brand } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = authConfigured();
  if (configured && (await auth())?.user?.id) redirect("/dashboard");
  const { error } = await searchParams;
  async function login() {
    "use server";
    if (!authConfigured()) redirect("/signin?error=Configuration");
    try {
      await signIn("github", { redirectTo: "/dashboard" });
    } catch (error) {
      if (error instanceof AuthError) redirect(`/signin?error=${encodeURIComponent(error.type)}`);
      throw error;
    }
  }
  const errors: Record<string, string> = {
    OAuthAccountNotLinked:
      "This email is associated with another account. Use the GitHub account you originally signed in with.",
    AccessDenied: "GitHub sign-in was not completed. You can try again when you’re ready.",
    Configuration:
      "Sign-in needs a database connection and GitHub OAuth credentials. Follow the setup guide in the project README.",
  };
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-12 inline-block">
          <Brand />
        </Link>
        <div className="rounded-2xl border border-border bg-card p-7 sm:p-9">
          <span className="eyebrow text-primary">Your taste. Your space.</span>
          <h1 className="mt-4 text-[34px] font-semibold leading-tight tracking-tight">
            Every great story
            <br />
            starts somewhere.
          </h1>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            Sign in to keep your watchlist, ratings, and favorite collections with you, wherever you
            watch.
          </p>
          {error && (
            <p
              className="mt-5 rounded-lg border border-red-400/20 bg-red-400/5 p-4 text-xs leading-6 text-red-200"
              role="alert"
            >
              {errors[error] ||
                "We couldn’t complete GitHub sign-in. Please try again. If it continues, check the OAuth callback URL and database configuration."}
            </p>
          )}
          {configured ? (
            <form action={login} className="mt-7">
              <Button type="submit" size="lg" className="w-full">
                <Github />
                Continue with GitHub
                <ArrowRight />
              </Button>
            </form>
          ) : (
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">Account setup is still needed</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Add MySQL, AUTH_SECRET, and GitHub OAuth credentials to your .env file. The project
                README walks through each step.
              </p>
            </div>
          )}
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] text-muted-foreground">TAKE A LOOK AROUND</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/demo/dashboard">
              Explore the interactive demo
              <ArrowRight />
            </Link>
          </Button>
          <p className="mt-6 flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
            <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
            GitHub is used only to sign in. We don’t request access to your repositories. Your
            library is private by default.
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/credits" className="hover:text-primary">
            About MyNextWatch & credits
          </Link>
        </p>
      </div>
    </main>
  );
}
