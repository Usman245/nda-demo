import { count, desc, eq } from "drizzle-orm";
import { deal, event, interest, ndaSignature } from "@/db/schema";
import { getDb } from "./db";

export type DealStats = {
  views: number;
  ndaViews: number;
  signatures: number;
  interests: number;
};

const empty = (): DealStats => ({ views: 0, ndaViews: 0, signatures: 0, interests: 0 });

/** Counts per deal from the event log (+ signature/interest tables for accuracy). */
export async function statsByDeal(): Promise<Map<string, DealStats>> {
  const db = await getDb();
  const [ev, sigs, ints] = await Promise.all([
    db
      .select({ dealId: event.dealId, type: event.type, n: count() })
      .from(event)
      .groupBy(event.dealId, event.type),
    db.select({ dealId: ndaSignature.dealId, n: count() }).from(ndaSignature).groupBy(ndaSignature.dealId),
    db.select({ dealId: interest.dealId, n: count() }).from(interest).groupBy(interest.dealId),
  ]);
  const m = new Map<string, DealStats>();
  const get = (id: string) => {
    if (!m.has(id)) m.set(id, empty());
    return m.get(id)!;
  };
  for (const r of ev) {
    if (r.type === "view") get(r.dealId).views = r.n;
    if (r.type === "nda_view") get(r.dealId).ndaViews = r.n;
  }
  for (const r of sigs) get(r.dealId).signatures = r.n;
  for (const r of ints) get(r.dealId).interests = r.n;
  return m;
}

export async function listDeals() {
  const db = await getDb();
  return db
    .select({
      id: deal.id,
      slug: deal.slug,
      title: deal.title,
      strategy: deal.strategy,
      outcode: deal.outcode,
      status: deal.status,
      createdAt: deal.createdAt,
    })
    .from(deal)
    .orderBy(desc(deal.createdAt));
}

/** Sourcer-only: full deal row including the address. */
export async function getDealForSourcer(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  const [d] = await db.select().from(deal).where(eq(deal.id, id)).limit(1);
  return d ?? null;
}

export async function getLeads(dealId: string) {
  const db = await getDb();
  const [sigs, ints] = await Promise.all([
    db
      .select()
      .from(ndaSignature)
      .where(eq(ndaSignature.dealId, dealId))
      .orderBy(desc(ndaSignature.signedAt)),
    db.select().from(interest).where(eq(interest.dealId, dealId)).orderBy(desc(interest.createdAt)),
  ]);
  return { sigs, ints };
}
