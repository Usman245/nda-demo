import { eq, and } from "drizzle-orm";
import { deal, org, ndaSignature } from "@/db/schema";
import { getDb } from "./db";
import type { DealInputs } from "./yield";

/**
 * GOLDEN RULE: address columns (addressLine1/2, postcode) are never part of this
 * object. Every query that feeds a public page must use these columns.
 */
export const publicDealColumns = {
  id: deal.id,
  orgId: deal.orgId,
  slug: deal.slug,
  title: deal.title,
  strategy: deal.strategy,
  description: deal.description,
  photos: deal.photos,
  isSample: deal.isSample,
  outcode: deal.outcode,
  city: deal.city,
  region: deal.region,
  purchasePrice: deal.purchasePrice,
  refurbCost: deal.refurbCost,
  otherCosts: deal.otherCosts,
  sourcingFee: deal.sourcingFee,
  monthlyRent: deal.monthlyRent,
  serviceChargeAnnual: deal.serviceChargeAnnual,
  groundRentAnnual: deal.groundRentAnnual,
  insuranceAnnual: deal.insuranceAnnual,
  maintenancePct: deal.maintenancePct,
  managementPct: deal.managementPct,
  voidsWeeks: deal.voidsWeeks,
  ltvPct: deal.ltvPct,
  mortgageRatePct: deal.mortgageRatePct,
  status: deal.status,
  createdAt: deal.createdAt,
} as const;

/** Branding only. No contact details here - those are released after NDA. */
export const publicOrgColumns = {
  name: org.name,
  logoUrl: org.logoUrl,
  brandColor: org.brandColor,
  accentColor: org.accentColor,
  ndaText: org.ndaText,
} as const;

export async function getPublicDeal(slug: string) {
  const db = await getDb();
  const rows = await db
    .select({ deal: publicDealColumns, org: publicOrgColumns })
    .from(deal)
    .innerJoin(org, eq(deal.orgId, org.id))
    .where(and(eq(deal.slug, slug), eq(deal.status, "live")))
    .limit(1);
  return rows[0] ?? null;
}

export type PublicDeal = NonNullable<Awaited<ReturnType<typeof getPublicDeal>>>["deal"];
export type PublicOrg = NonNullable<Awaited<ReturnType<typeof getPublicDeal>>>["org"];

/** Post-NDA only. Call this solely after verifying the buyer cookie. */
export async function getLockedAddress(dealId: string) {
  const db = await getDb();
  const rows = await db
    .select({
      addressLine1: deal.addressLine1,
      addressLine2: deal.addressLine2,
      postcode: deal.postcode,
    })
    .from(deal)
    .where(eq(deal.id, dealId))
    .limit(1);
  return rows[0] ?? null;
}

/** Post-NDA only. Sourcer contact details. */
export async function getOrgContact(orgId: string) {
  const db = await getDb();
  const rows = await db
    .select({
      sourcerName: org.sourcerName,
      sourcerPhone: org.sourcerPhone,
      notifyEmail: org.notifyEmail,
    })
    .from(org)
    .where(eq(org.id, orgId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getNdaSignature(id: string, dealId: string) {
  const db = await getDb();
  const rows = await db
    .select({
      buyerName: ndaSignature.buyerName,
      buyerEmail: ndaSignature.buyerEmail,
      ip: ndaSignature.ip,
      signedAt: ndaSignature.signedAt,
    })
    .from(ndaSignature)
    .where(and(eq(ndaSignature.id, id), eq(ndaSignature.dealId, dealId)))
    .limit(1);
  return rows[0] ?? null;
}

type NumericRow = {
  purchasePrice: number;
  refurbCost: number;
  otherCosts: number;
  sourcingFee: number;
  monthlyRent: number;
  serviceChargeAnnual: number;
  groundRentAnnual: number;
  insuranceAnnual: number;
  maintenancePct: string | number;
  managementPct: string | number;
  voidsWeeks: number;
  ltvPct: string | number;
  mortgageRatePct: string | number;
};

export function toInputs(d: NumericRow): DealInputs {
  return {
    purchasePrice: d.purchasePrice,
    refurbCost: d.refurbCost,
    otherCosts: d.otherCosts,
    sourcingFee: d.sourcingFee,
    monthlyRent: d.monthlyRent,
    serviceChargeAnnual: d.serviceChargeAnnual,
    groundRentAnnual: d.groundRentAnnual,
    insuranceAnnual: d.insuranceAnnual,
    maintenancePct: Number(d.maintenancePct),
    managementPct: Number(d.managementPct),
    voidsWeeks: d.voidsWeeks,
    ltvPct: Number(d.ltvPct),
    mortgageRatePct: Number(d.mortgageRatePct),
  };
}
