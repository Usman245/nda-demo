import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { deal } from "@/db/schema";
import { DEMO_SLUG } from "@/db/seed-data";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await getDb();
  const [demo] = await db
    .select({ slug: deal.slug })
    .from(deal)
    .where(eq(deal.slug, DEMO_SLUG))
    .limit(1);
  if (demo) redirect(`/d/${demo.slug}`);

  const [latest] = await db
    .select({ slug: deal.slug })
    .from(deal)
    .where(eq(deal.status, "live"))
    .orderBy(desc(deal.createdAt))
    .limit(1);
  redirect(latest ? `/d/${latest.slug}` : "/login");
}
