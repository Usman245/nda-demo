import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { deal, event, ndaSignature } from "@/db/schema";
import { getDb } from "@/lib/db";
import { setBuyerSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  phone: z.string().trim().max(40).optional().default(""),
  signature: z.string().trim().min(3, "Type your full name to sign").max(120),
  consent: z.literal(true, { error: "You must agree to the NDA" }),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ip = clientIp(req);

  // 5 signatures / minute / IP
  const rl = rateLimit(`nda:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid details";
    return NextResponse.json({ error: first }, { status: 400 });
  }
  const b = parsed.data;

  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = await getDb();
  const [d] = await db
    .select({ id: deal.id, status: deal.status })
    .from(deal)
    .where(eq(deal.id, id))
    .limit(1);
  if (!d || d.status !== "live") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [sig] = await db
    .insert(ndaSignature)
    .values({
      dealId: d.id,
      buyerName: b.name,
      buyerEmail: b.email,
      buyerPhone: b.phone || null,
      signatureText: b.signature,
      consented: true,
      ip,
      userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
    })
    .returning({ id: ndaSignature.id });

  await db.insert(event).values({ dealId: d.id, type: "nda_signed", meta: { ndaId: sig.id } });
  await setBuyerSession({ dealId: d.id, email: b.email, ndaId: sig.id });

  return NextResponse.json({ ok: true });
}
