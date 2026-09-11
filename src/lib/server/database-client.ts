import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
export function createDatabaseClient(connectionString = process.env.DATABASE_URL): PrismaClient {
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  const url = new URL(connectionString);
  if (url.protocol !== "mysql:") throw new Error("MyNextWatch requires a mysql:// database URL.");
  const poolSize = Number(process.env.DATABASE_POOL_SIZE || 2);
  if (!Number.isInteger(poolSize) || poolSize < 1 || poolSize > 20)
    throw new Error("DATABASE_POOL_SIZE must be between 1 and 20.");
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: poolSize,
    acquireTimeout: 10000,
    connectTimeout: 10000,
    idleTimeout: 60,
    allowPublicKeyRetrieval: ["127.0.0.1", "localhost", "::1"].includes(url.hostname),
    ...(process.env.DATABASE_SSL === "true"
      ? {
          ssl: {
            rejectUnauthorized: true,
            ...(process.env.DATABASE_SSL_CA
              ? { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, "\n") }
              : {}),
          },
        }
      : {}),
  });
  return new PrismaClient({ adapter, log: [] });
}
