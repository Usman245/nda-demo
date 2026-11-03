import path from "node:path";
import { mkdir } from "node:fs/promises";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Production / Neon: set DATABASE_URL (run `npm run db:migrate && npm run db:seed` once).
 * Local dev with no DATABASE_URL: an embedded Postgres (PGlite) stored in .data/pglite is
 * created, migrated and seeded automatically on first use.
 */
const globalForDb = globalThis as unknown as { __dbPromise?: Promise<Db> };

async function init(): Promise<Db> {
  const rawUrl =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL;
  const url = rawUrl?.trim().replace(/^["']|["']$/g, "");

  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle(neon(url), { schema }) as unknown as Db;
  }

  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    throw new Error(
      "Missing DATABASE_URL on Vercel. Please add DATABASE_URL in your Vercel Project Settings > Environment Variables, then redeploy."
    );
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { seedIfEmpty } = await import("@/db/seed-data");

  const dataDir = path.join(process.cwd(), ".data", "pglite");
  await mkdir(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema }) as unknown as Db;
  await migrate(db as never, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
  await seedIfEmpty(db);
  return db;
}

export function getDb(): Promise<Db> {
  if (!globalForDb.__dbPromise) {
    const p = init();
    // Don't cache a failed init - allow retry on the next request.
    p.catch(() => {
      if (globalForDb.__dbPromise === p) globalForDb.__dbPromise = undefined;
    });
    globalForDb.__dbPromise = p;
  }
  return globalForDb.__dbPromise;
}
