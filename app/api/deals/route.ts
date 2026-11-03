import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { deal, org } from "@/db/schema";
import { getDb } from "@/lib/db";
import { isSourcer } from "@/lib/auth";
import { makeDealSlug } from "@/lib/slug";

const int = z.coerce.number().int().min(0).max(100_000_000);
const pct = z.coerce.number().min(0).max(100);

const DealBody = z.object({
  title: z.string().trim().min(3).max(120),
  strategy: z.enum(["BTL", "BRRR", "HMO", "Flip", "Development"]),
  description: z.string().trim().max(5000).optional().default(""),
  city: z.string().trim().min(2).max(80),
  outcode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{1,2}[0-9][A-Z0-9]?$/, "Outcode like L6 or M14"),
  addressLine1: z.string().trim().min(2).max(120),
  addressLine2: z.string().trim().max(120).optional().default(""),
  postcode: z.string().trim().toUpperCase().min(5).max(9),
  photos: z.array(z.string().max(10_000_000)).max(8).default([]),
  purchasePrice: int.min(1),
  refurbCost: int,
  otherCosts: int,
  sourcingFee: int,
  monthlyRent: int.min(1),
  serviceChargeAnnual: int,
  groundRentAnnual: int,
  insuranceAnnual: int,
  managementPct: pct,
  voidsWeeks: z.coerce.number().int().min(0).max(52),
  maintenancePct: pct,
  ltvPct: pct,
  mortgageRatePct: pct,
});

export async function POST(req: Request) {
  if (!(await isSourcer())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = DealBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid deal", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const db = await getDb();

  let orgId = process.env.DEMO_ORG_ID;
  if (!orgId) {
    const [o] = await db.select({ id: org.id }).from(org).orderBy(asc(org.createdAt)).limit(1);
    orgId = o?.id;
  }
  if (!orgId) return NextResponse.json({ error: "No org seeded" }, { status: 500 });

  const slug = makeDealSlug(d.title, d.outcode);
  const [row] = await db
    .insert(deal)
    .values({
      orgId,
      slug,
      title: d.title,
      strategy: d.strategy,
      description: d.description || null,
      photos: d.photos,
      outcode: d.outcode,
      city: d.city,
      addressLine1: d.addressLine1,
      addressLine2: d.addressLine2 || null,
      postcode: d.postcode,
      purchasePrice: d.purchasePrice,
      refurbCost: d.refurbCost,
      otherCosts: d.otherCosts,
      sourcingFee: d.sourcingFee,
      monthlyRent: d.monthlyRent,
      serviceChargeAnnual: d.serviceChargeAnnual,
      groundRentAnnual: d.groundRentAnnual,
      insuranceAnnual: d.insuranceAnnual,
      managementPct: String(d.managementPct),
      voidsWeeks: d.voidsWeeks,
      maintenancePct: String(d.maintenancePct),
      ltvPct: String(d.ltvPct),
      mortgageRatePct: String(d.mortgageRatePct),
      status: "live",
    })
    .returning({ id: deal.id, slug: deal.slug });

  return NextResponse.json(row, { status: 201 });
}
