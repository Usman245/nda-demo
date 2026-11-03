import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { deal, event, interest, ndaSignature } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getBuyerSession } from "@/lib/auth";
import { getOrgContact } from "@/lib/deals";
import { sendMail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const Body = z.object({ message: z.string().trim().max(1000).optional().default("") });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getBuyerSession(id);
  if (!session) return NextResponse.json({ error: "NDA required" }, { status: 403 });

  const rl = rateLimit(`interest:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Message too long" }, { status: 400 });
  const { message } = parsed.data;

  const db = await getDb();
  const [d] = await db
    .select({ id: deal.id, orgId: deal.orgId, title: deal.title })
    .from(deal)
    .where(eq(deal.id, id))
    .limit(1);
  const [sig] = await db
    .select()
    .from(ndaSignature)
    .where(eq(ndaSignature.id, session.ndaId))
    .limit(1);
  if (!d || !sig || sig.dealId !== d.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.insert(interest).values({ dealId: d.id, ndaId: sig.id, message: message || null });
  await db.insert(event).values({ dealId: d.id, type: "interest_clicked", meta: { ndaId: sig.id } });

  const contact = await getOrgContact(d.orgId);
  if (contact) {
    // Fire and forget; never block the buyer on email.
    void sendMail({
      to: contact.notifyEmail,
      subject: `New interested buyer: ${d.title}`,
      text: [
        `${sig.buyerName} is interested in "${d.title}".`,
        ``,
        `Email: ${sig.buyerEmail}`,
        `Phone: ${sig.buyerPhone ?? "-"}`,
        message ? `Message: ${message}` : ``,
        ``,
        `NDA signed ${sig.signedAt.toISOString()} from ${sig.ip ?? "unknown IP"}.`,
      ].join("\n"),
    });
  }

  return NextResponse.json({
    ok: true,
    sourcer: contact && {
      name: contact.sourcerName,
      email: contact.notifyEmail,
      phone: contact.sourcerPhone,
    },
  });
}
