import dotenv from "dotenv";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed-data";
import type { Db } from "../lib/db";

// `neon env pull` writes .env.local; fall back to .env.
dotenv.config({ path: ".env.local" });
dotenv.config();

// Usage: npm run db:setup
// Migrations/DDL use the UNPOOLED connection (recommended by Neon); the app itself uses the
// pooled DATABASE_URL over the HTTP driver at runtime.
async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Run `neon env pull`. (Local dev needs no setup: PGlite auto-initialises.)");
    process.exit(1);
  }
  const db = drizzle(neon(url), { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("migrations applied");
  await seedIfEmpty(db as unknown as Db);
  console.log("seed complete (skipped if org already existed)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
