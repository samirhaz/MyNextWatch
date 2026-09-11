import "server-only";
import { auth, authConfigured } from "@/auth";
import { AppError } from "./errors";
export async function requireUser() {
  if (!authConfigured())
    throw new AppError(
      503,
      "Account setup is not complete. See the setup guide or explore the demo.",
    );
  const session = await auth();
  if (!session?.user?.id) throw new AppError(401, "Please sign in to continue.");
  return session.user.id;
}
