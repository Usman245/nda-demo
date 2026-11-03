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
  refurbCost?: number | null;
  otherCosts?: number | null;
  sourcingFee?: number | null;
  monthlyRent: number;
  serviceChargeAnnual?: number | null;
  groundRentAnnual?: number | null;
  insuranceAnnual?: number | null;
  maintenancePct?: string | number | null;
  managementPct?: string | number | null;
  voidsWeeks?: number | null;
  ltvPct?: string | number | null;
  mortgageRatePct?: string | number | null;
};

export function toInputs(d: NumericRow): DealInputs {
  return {
    purchasePrice: Number(d.purchasePrice) || 0,
    refurbCost: Number(d.refurbCost) || 0,
    otherCosts: Number(d.otherCosts) || 0,
    sourcingFee: Number(d.sourcingFee) || 0,
    monthlyRent: Number(d.monthlyRent) || 0,
    serviceChargeAnnual: Number(d.serviceChargeAnnual) || 0,
    groundRentAnnual: Number(d.groundRentAnnual) || 0,
    insuranceAnnual: Number(d.insuranceAnnual) || 0,
    maintenancePct: Number(d.maintenancePct) || 0,
    managementPct: Number(d.managementPct) || 0,
    voidsWeeks: Number(d.voidsWeeks) || 0,
    ltvPct: Number(d.ltvPct) || 0,
    mortgageRatePct: Number(d.mortgageRatePct) || 0,
  };
}
