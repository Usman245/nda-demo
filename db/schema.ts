import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const org = pgTable("org", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // "Northline Property Partners"
  logoUrl: text("logo_url"),
  brandColor: text("brand_color").notNull().default("#0F766E"),
  accentColor: text("accent_color").notNull().default("#F59E0B"),
  domain: text("domain"), // dealroom.samplesourcing.co.uk
  ndaText: text("nda_text").notNull(), // editable NDA copy
  notifyEmail: text("notify_email").notNull(),
  // Shown to the buyer after NDA so they can reach the sourcer directly.
  sourcerName: text("sourcer_name").notNull().default(""),
  sourcerPhone: text("sourcer_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deal = pgTable(
  "deal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => org.id)
      .notNull(),
    slug: text("slug").notNull().unique(), // "anfield-l6-2bed"

    title: text("title").notNull(),
    strategy: text("strategy").notNull(), // BTL | BRRR | HMO | Flip | Development
    description: text("description"),
    photos: jsonb("photos").$type<string[]>().notNull().default([]),
    isSample: boolean("is_sample").notNull().default(false),

    // ---- PUBLIC FIELDS (safe to send to anyone) ----
    outcode: text("outcode").notNull(), // "L6"
    city: text("city").notNull(), // "Liverpool"
    region: text("region"), // "Merseyside"

    // ---- LOCKED FIELDS (never in public queries) ----
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    postcode: text("postcode").notNull(),

    // ---- NUMBERS (whole £) ----
    purchasePrice: integer("purchase_price").notNull(),
    refurbCost: integer("refurb_cost").notNull().default(0),
    otherCosts: integer("other_costs").notNull().default(0),
    sourcingFee: integer("sourcing_fee").notNull().default(0),
    monthlyRent: integer("monthly_rent").notNull(),
    serviceChargeAnnual: integer("service_charge_annual").notNull().default(0),
    groundRentAnnual: integer("ground_rent_annual").notNull().default(0),
    insuranceAnnual: integer("insurance_annual").notNull().default(0),
    maintenancePct: numeric("maintenance_pct", { precision: 5, scale: 2 })
      .notNull()
      .default("8"),
    managementPct: numeric("management_pct", { precision: 5, scale: 2 })
      .notNull()
      .default("10"),
    voidsWeeks: integer("voids_weeks").notNull().default(3),
    ltvPct: numeric("ltv_pct", { precision: 5, scale: 2 })
      .notNull()
      .default("75"),
    mortgageRatePct: numeric("mortgage_rate_pct", { precision: 5, scale: 2 })
      .notNull()
      .default("5.5"),

    status: text("status").notNull().default("live"), // draft | live | reserved | sold
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("deal_slug_idx").on(t.slug)],
);

export const ndaSignature = pgTable(
  "nda_signature",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id")
      .references(() => deal.id)
      .notNull(),
    buyerName: text("buyer_name").notNull(),
    buyerEmail: text("buyer_email").notNull(),
    buyerPhone: text("buyer_phone"),
    signatureText: text("signature_text").notNull(), // typed full name
    consented: boolean("consented").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    signedAt: timestamp("signed_at").defaultNow().notNull(),
  },
  (t) => [index("nda_deal_idx").on(t.dealId)],
);

export const interest = pgTable("interest", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .references(() => deal.id)
    .notNull(),
  ndaId: uuid("nda_id")
    .references(() => ndaSignature.id)
    .notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const event = pgTable(
  "event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id")
      .references(() => deal.id)
      .notNull(),
    type: text("type").notNull(), // view | nda_view | nda_signed | address_revealed | interest_clicked
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("event_deal_idx").on(t.dealId)],
);
