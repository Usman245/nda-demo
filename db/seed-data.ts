import { statSync } from "node:fs";
import path from "node:path";
import { count } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { deal, org } from "./schema";

export const DEMO_SLUG = "anfield-l6-2bed";

export const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&w=1400&q=80",
];

/** Uses downloaded local Unsplash photos in /public/demo when non-empty, else direct Unsplash CDN URLs. */
function demoPhotos() {
  return DEMO_PHOTOS.map((remote, idx) => {
    const file = path.join(process.cwd(), "public", "demo", `photo-${idx + 1}.jpg`);
    try {
      if (statSync(file).size > 10_000) return `/demo/photo-${idx + 1}.jpg`;
    } catch {
      /* fall through to remote Unsplash URL */
    }
    return remote;
  });
}

export const DEFAULT_NDA_TEXT = `NON-DISCLOSURE AND NON-CIRCUMVENTION AGREEMENT

By signing below I confirm that:

1. I will keep the address and any non-public details of this opportunity strictly confidential and will not share them with any third party.
2. I will not contact the vendor, tenant, agent or any other party connected with the property directly, and will make all enquiries through the sourcer named on this page.
3. I understand that my name, email address, IP address and the date and time of signing are recorded as evidence of this agreement.
4. I am entering this agreement electronically and agree that my typed signature has the same effect as a handwritten one.`;

export const DEMO_DESCRIPTION = `Two-bed mid-terrace in a high-demand rental pocket close to the stadium and the new regeneration area. Solid structure, newly instructed roofer's report is clean, and a light cosmetic refurb (kitchen, bathroom, decorating, flooring) is all it needs.

Comparable two-beds on the same streets are achieving £825–£875 pcm with short void periods. Local agents have confirmed demand from professional sharers and families, and there is a waiting list on similar stock.

Vendor wants a quick sale and has accepted a price subject to contract. Sourcing fee of £3,000 is paid by the investor on completion. Cash and mortgage buyers welcome.`;

/** Creates the neutral demo org + the plan.md fixture deal if the DB is empty. */
export async function seedIfEmpty(db: Db) {
  const [{ value }] = await db.select({ value: count() }).from(org);
  if (value > 0) return;

  const [o] = await db
    .insert(org)
    .values({
      name: "Northline Property Partners",
      brandColor: "#0F766E",
      accentColor: "#F59E0B",
      ndaText: DEFAULT_NDA_TEXT,
      notifyEmail: "sam@northline.example",
      sourcerName: "Sam Carter",
      sourcerPhone: "07700 900123",
    })
    .returning({ id: org.id });

  await db.insert(deal).values({
    orgId: o.id,
    slug: DEMO_SLUG,
    title: "2-Bed Terraced — Anfield, L6",
    strategy: "BTL",
    description: DEMO_DESCRIPTION,
    photos: demoPhotos(),
    isSample: true,
    outcode: "L6",
    city: "Liverpool",
    region: "Merseyside",
    addressLine1: "42 Demo Street",
    addressLine2: null,
    postcode: "L6 4BX",
    purchasePrice: 85000,
    refurbCost: 20000,
    otherCosts: 5000,
    sourcingFee: 3000,
    monthlyRent: 850,
    serviceChargeAnnual: 0,
    groundRentAnnual: 0,
    insuranceAnnual: 350,
    maintenancePct: "8",
    managementPct: "10",
    voidsWeeks: 3,
    ltvPct: "75",
    mortgageRatePct: "5.5",
    status: "live",
  });
}
