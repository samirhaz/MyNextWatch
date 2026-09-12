import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getDb } from "@/lib/server/db";
export const authConfigured = () =>
  Boolean(
    process.env.DEMO_ONLY !== "true" &&
    process.env.DATABASE_URL &&
    process.env.AUTH_SECRET &&
    process.env.AUTH_GITHUB_ID &&
    process.env.AUTH_GITHUB_SECRET,
  );
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: authConfigured() ? PrismaAdapter(getDb()) : undefined,
  providers: [GitHub({ authorization: { params: { scope: "read:user user:email" } } })],
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  // Log only error classes, never adapter arguments, OAuth tokens, or personal data.
  logger: {
    error(error) {
      console.error("Authentication error:", error.name);
    },
  },
}));
