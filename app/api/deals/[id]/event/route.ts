import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { deal, event } from "@/db/schema";
import { getDb } from "@/lib/db";
import { isSourcer } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Public, but only accepts the one client-side event: the NDA modal being opened.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (body?.type !== "nda_view") return NextResponse.json({ ok: false }, { status: 400 });
  if (await isSourcer()) return NextResponse.json({ ok: true }); // don't count own previews

  if (!rateLimit(`event:${clientIp(req)}`, 30, 60_000).ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const db = await getDb();
  const [d] = await db.select({ id: deal.id }).from(deal).where(eq(deal.id, id)).limit(1);
  if (!d) return NextResponse.json({ ok: false }, { status: 404 });
  await db.insert(event).values({ dealId: d.id, type: "nda_view" });
  return NextResponse.json({ ok: true });
}
