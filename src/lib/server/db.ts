import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { createDatabaseClient } from "./database-client";
const globalForPrisma = globalThis as unknown as { mnwPrisma?: PrismaClient };
// Lazy construction lets the explicitly isolated demo build/run without database credentials.
export function getDb(): PrismaClient {
  if (!globalForPrisma.mnwPrisma) globalForPrisma.mnwPrisma = createDatabaseClient();
  return globalForPrisma.mnwPrisma;
}
