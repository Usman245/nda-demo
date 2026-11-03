# DEMO_SPEC.md — Private Branded Deal Room (Demo Build Spec)

> **Purpose of this file:** complete, buildable specification for the demo that sits behind every outreach email. Build this once, in 3–4 days. It is not a product. It is proof.

---

## 1. What this demo must prove (and nothing else)

The demo exists to make one email believable. A sourcer clicking the link must see, in under 60 seconds:

1. **"Upload a deal in 60 seconds"** → a clean deal page exists with photos, numbers, and a live yield calculation.
2. **"The address stays locked until the buyer digitally signs your NDA"** → they see the address genuinely blocked, sign the NDA themselves, and the address appears.
3. **"Yield/ROI auto-calculates on screen"** → the numbers compute from the deal inputs, not typed in by hand.
4. **"You keep the buyer"** → the "I'm interested" click routes the buyer's details back to the sourcer, not to a marketplace.

If a feature does not serve one of those four sentences, it is out of scope.

---

## 2. Scope

### In scope

- Single sourcer account (passcode login, no signup)
- Create a deal (form + photo upload + live yield preview)
- Public deal page at a shareable slug
- NDA gate: name, email, phone, typed signature, consent checkbox, timestamp, IP
- Server-side address unlock after NDA
- Buyer watermark on unlocked content
- "I'm interested" → stored lead + optional email notification
- Sourcer dashboard: deal list, NDA signers, interest leads, view counts
- Event log (views, NDA views, signatures, interest clicks)
- Per-tenant theming (logo, colours, company name) so you can clone it for a real lead in 3 minutes

### Explicitly out of scope

- ❌ Buyer accounts or buyer payments
- ❌ Credits, subscriptions, billing
- ❌ Marketplace / browsable deal feed
- ❌ Chat, and definitely not chat that blocks contact info
- ❌ Multi-tenant org management, team roles
- ❌ CRM, investor matching, email campaigns
- ❌ Native app, mobile app, PWA

Every one of those is what made TOM the wrong product. Do not add them back "because it's easy."

---

## 3. Definition of done (acceptance criteria)

The demo is finished when all of these are true:

- [ ] A stranger can open the link on a phone, read the deal, sign the NDA, and see the full address in under 90 seconds.
- [ ] The full postcode and house number **do not appear anywhere** in the HTML/JSON of the page before the NDA is signed (verified with View Source and the Network tab).
- [ ] After signing, the buyer's email is faintly watermarked over the page.
- [ ] The yield figures recalculate live as you change purchase price / rent / refurb.
- [ ] Clicking "I'm interested" appears in the sourcer dashboard within 2 seconds.
- [ ] The page works on a 390px-wide phone with no horizontal scroll.
- [ ] Load time under 2s on 4G.
- [ ] A 60-second screen recording of the full flow exists and is uploaded as an unlisted video.

---

## 4. The demo deal fixture (use exactly this)

A believable Liverpool BTL deal. Sourcers must recognise the format instantly.

| Field                                | Value                        |
| ------------------------------------ | ---------------------------- |
| Title                                | 2-Bed Terraced — Anfield, L6 |
| Strategy                             | BTL (light refurb)           |
| Address line 1                       | 42 _(hidden until NDA)_      |
| Street                               | _(hidden until NDA)_         |
| Outcode shown publicly               | **L6**                       |
| City                                 | Liverpool                    |
| Purchase price                       | £85,000                      |
| Refurb budget                        | £20,000                      |
| Other purchase costs (stamp + legal) | £5,000                       |
| Sourcing fee (paid by investor)      | £3,000                       |
| Monthly rent (achievable)            | £850                         |
| Service charge (annual)              | £0                           |
| Ground rent (annual)                 | £0                           |
| Mortgage LTV                         | 75%                          |
| Mortgage rate                        | 5.5% (interest-only)         |
| Management                           | 10% of rent                  |
| Voids                                | 3 weeks/year                 |
| Insurance                            | £350/year                    |
| Maintenance                          | 8% of rent                   |

**Expected computed output (use this to verify your engine):**

```
Annual rent              £10,200
Gross yield              12.00%
Yield on total cost       9.27%   (10,200 / 110,000)
Running costs            £2,774
Net yield (no mortgage)   6.75%
Mortgage interest        £3,506   (63,750 @ 5.5% IO)
Net cash flow            £3,920
Cash invested           £49,250   (deposit 21,250 + refurb 20,000 + costs 5,000 + fee 3,000)
Cash-on-cash ROI          7.96%
```

Include 6–8 photos. Use free stock (Unsplash: "terraced house UK", "living room UK terrace", "kitchen refurb"). Do **not** use a real listing's photos.

---

## 5. Tech stack

| Layer          | Choice                                                          | Why                                                                                           |
| -------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Framework      | **Next.js 15 (App Router) + TypeScript**                        | Server components let you keep the address server-side by default — critical for the NDA gate |
| Styling        | **Tailwind CSS v4 + shadcn/ui**                                 | Fast, clean, professional-looking in hours                                                    |
| DB             | **Postgres (Neon free tier)** + **Drizzle ORM**                 | No filesystem issues on Vercel; typed schema; migrations in seconds                           |
| Auth (sourcer) | `jose` **JWT in an httpOnly cookie** + single passcode from env | No signup flow needed. 20 lines of code                                                       |
| Buyer session  | `jose` **JWT cookie scoped per deal**                           | Issued on NDA signature, verified server-side                                                 |
| File upload    | **Vercel Blob** (or Cloudinary unsigned preset)                 | Zero-config on Vercel                                                                         |
| Email          | **Resend** (optional)                                           | Notify sourcer of interest. Can be skipped in v1 — just log it                                |
| Analytics      | **Custom** `event` **table**                                    | No third-party script, no cookie banner needed                                                |
| Deploy         | **Vercel**                                                      | One command, free HTTPS, custom domain                                                        |
| Video          | **Loom / OBS**, unlisted YouTube                                | For the outreach email                                                                        |

**Do not** use Supabase Auth, NextAuth, Stripe, or a component library heavier than shadcn. All of it is unnecessary for a demo and will cost you a day each.

---

## 6. Architecture

```
Browser (buyer)
   │
   ├─ GET /d/[slug]                → Server Component
   │     • fetches deal WITHOUT address fields (explicit column select)
   │     • checks NDA cookie
   │     • if no cookie → renders locked view + blurred map
   │     • if cookie valid → fetches address server-side, renders unlocked view + watermark
   │
   ├─ POST /api/deals/[id]/nda     → validates form, writes nda_signature,
   │                                 sets signed JWT cookie, logs event
   │
   ├─ GET /api/deals/[id]/address  → requires valid NDA cookie, returns full address
   │                                 (used only if you need client-side reveal)
   │
   └─ POST /api/deals/[id]/interest → writes interest row, logs event, emails sourcer

Browser (sourcer)
   │
   ├─ GET /login                   → passcode form
   ├─ POST /api/auth/login         → sets sourcer JWT cookie
   ├─ GET /dashboard               → deal list + lead counts
   ├─ GET /dashboard/deals/new     → upload form with live yield preview
   ├─ POST /api/deals              → creates deal
   └─ GET /dashboard/deals/[id]    → edit, copy share link, view signers + leads
```

**Golden rule:** the address columns are never included in any query that feeds a public page. Select them explicitly, only in the post-NDA branch. Blurring with CSS is not protection — a buyer will inspect the DOM.

---

## 7. Data model (Drizzle)

```ts
// db/schema.ts
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
  name: text("name").notNull(), // "Sample Sourcing Co"
  logoUrl: text("logo_url"),
  brandColor: text("brand_color").notNull().default("#0F766E"),
  accentColor: text("accent_color").notNull().default("#F59E0B"),
  domain: text("domain"), // dealroom.samplesourcing.co.uk
  ndaText: text("nda_text").notNull(), // editable NDA copy
  notifyEmail: text("notify_email").notNull(),
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

    // ---- PUBLIC FIELDS (safe to send to anyone) ----
    outcode: text("outcode").notNull(), // "L6"
    city: text("city").notNull(), // "Liverpool"
    region: text("region"), // "Merseyside"

    // ---- LOCKED FIELDS (never in public queries) ----
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    postcode: text("postcode").notNull(),

    // ---- NUMBERS ----
    purchasePrice: integer("purchase_price").notNull(), // pence or whole £ — pick whole £
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
  (t) => ({ slugIdx: index("deal_slug_idx").on(t.slug) }),
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
  (t) => ({ dealIdx: index("nda_deal_idx").on(t.dealId) }),
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

export const event = pgTable("event", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .references(() => deal.id)
    .notNull(),
  type: text("type").notNull(), // view | nda_view | nda_signed | address_revealed | interest_clicked
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 8. Routing map

| Route                      | Access     | Purpose                                     |
| -------------------------- | ---------- | ------------------------------------------- |
| `/`                        | public     | Redirect to `/d/[demo-slug]`                |
| `/login`                   | public     | Sourcer passcode                            |
| `/api/auth/login`          | public     | Sets sourcer JWT                            |
| `/dashboard`               | sourcer    | Deal list + counts                          |
| `/dashboard/deals/new`     | sourcer    | Upload form                                 |
| `/api/deals`               | sourcer    | Create deal                                 |
| `/dashboard/deals/[id]`    | sourcer    | Edit, share link, signers, leads, analytics |
| `/d/[slug]`                | public     | Locked or unlocked deal page                |
| `/api/deals/[id]/nda`      | public     | Sign NDA → set cookie                       |
| `/api/deals/[id]/address`  | NDA cookie | Returns full address                        |
| `/api/deals/[id]/interest` | NDA cookie | Records interest                            |

---

## 9. Page-by-page spec

### 9.1 `/d/[slug]` — locked state

Layout, top to bottom:

1. **Header bar** — org logo (left), org name, small "Private deal room" label. Thin accent line in brand colour.
2. **Deal title + strategy badge** — "2-Bed Terraced — Anfield, L6" and a `BTL` pill.
3. **Photo gallery** — main image + 4 thumbnails, 60vh on desktop, swipeable on mobile.
4. **Key numbers strip** — 4 cards: Purchase £85,000 · Refurb £20,000 · Rent £850 pcm · **Gross yield 12.0%**
5. **Location card** — map centred on **outcode only** (L6), radius circle, no pin on the house. Caption: _"Exact address released after NDA."_
6. **Address block (locked)** — `42 ██████████, Liverpool, L6 ███` with a lock icon and a button **"Unlock address — sign NDA (30 sec)"**.
7. **Full yield table** — every line item computed from the engine (Section 12). This is the comps-killer.
8. **Description** — 3 short paragraphs.
9. **Sticky CTA on mobile** — "Sign NDA to see address".

Do not show a "Buyer login", "Plans", or "Chat" anywhere. Not even greyed out.

### 9.2 `/d/[slug]` — NDA modal

Fields:

- Full name (required)
- Email (required, validated)
- Phone (optional)
- Signature — typed full name in a script font preview (required, must be ≥3 chars)
- Checkbox: _"I agree not to contact the vendor directly and not to share this address with third parties."_ (required)
- Micro-copy: _"Signed electronically. Your name, email, IP and timestamp are recorded."_
- Button: **Sign & unlock address**

On submit: `POST /api/deals/[id]/nda` → validate → insert `nda_signature` → insert `event('nda_signed')` → sign JWT `{ dealId, email, ndaId }` (30-day expiry, httpOnly, secure, sameSite=lax) → `router.refresh()`.

### 9.3 `/d/[slug]` — unlocked state

- Address block now shows full address + postcode, plus a copy button.
- Map shows exact pin.
- **Watermark**: buyer's email repeated diagonally at 4% opacity across the gallery and yield table, via a CSS overlay (`pointer-events:none`, `user-select:none`). Caption: _"Licensed to [jane@example.com](mailto:jane@example.com) — do not distribute."_
- "I'm interested" button → textarea (optional) → `POST /api/deals/[id]/interest`.
- Confirmation: _"Sent. [Sourcer name] will contact you directly."_
- Sourcer email + phone shown so the buyer can reach them — **this is the opposite of TOM.**

### 9.4 `/dashboard/deals/new` — the "60 second upload"

Single-column form, grouped:

- **Deal basics** — title, strategy select, city, outcode, full address (2 lines + postcode)
- **Photos** — drag-drop, up to 8, instant preview
- **Numbers** — purchase, refurb, other costs, sourcing fee, rent, service charge, ground rent, insurance
- **Assumptions** — management %, voids weeks, maintenance %, LTV %, rate % (pre-filled with 10 / 3 / 8 / 75 / 5.5)
- **Live preview panel** (sticky right column on desktop) — yield table recomputes on every keystroke. This _is_ the demo moment: they type a number, the yield moves.
- **Publish** → creates deal, generates slug, shows share link + copy button + QR code.

Target: a sourcer can fill this in under 60 seconds. Time yourself.

### 9.5 `/dashboard/deals/[id]`

Three tabs:

- **Share** — the deal URL, copy button, QR, "copy WhatsApp message" button that outputs: `New deal: 2-Bed Anfield L6 — 12% gross yield. View: [url] (NDA required for address)`
- **Leads** — table of NDA signers (name, email, phone, signed at, interested?) + interest messages
- **Stats** — views, NDA views, signatures, interest clicks, conversion %.

---

## 10. Address protection (do not get this wrong)

Three rules:

1. **Never select address columns in a public query.** Write a helper `getPublicDeal(slug)` that uses Drizzle's `.select({ ...only public columns })`.
2. **Verify with DevTools before shipping.** Open `/d/[slug]`, View Source, search the postcode. It must return zero results. Search the Network tab response bodies too.
3. **The unlock is server-side.** The unlocked render happens in the same Server Component after cookie verification. The `/address` API route exists only as a fallback.

Also: `robots: noindex, nofollow` on `/d/*`, and `Referrer-Policy: no-referrer` so the slug does not leak to third-party hosts.

---

## 11. Yield engine (exact formulas)

Put this in `lib/yield.ts` as pure functions. Write 3 unit tests against the fixture in Section 4.

```ts
export type DealInputs = {
  purchasePrice: number;
  refurbCost: number;
  otherCosts: number;
  sourcingFee: number;
  monthlyRent: number;
  serviceChargeAnnual: number;
  groundRentAnnual: number;
  insuranceAnnual: number;
  maintenancePct: number;
  managementPct: number;
  voidsWeeks: number;
  ltvPct: number;
  mortgageRatePct: number;
};

export function calculate(i: DealInputs) {
  const annualRent = i.monthlyRent * 12;

  const totalCost = i.purchasePrice + i.refurbCost + i.otherCosts;

  const grossYield = pct(annualRent, i.purchasePrice);
  const yieldOnCost = pct(annualRent, totalCost);

  const management = annualRent * (i.managementPct / 100);
  const maintenance = annualRent * (i.maintenancePct / 100);
  const voids = annualRent * (i.voidsWeeks / 52);
  const runningCosts =
    management +
    maintenance +
    voids +
    i.insuranceAnnual +
    i.serviceChargeAnnual +
    i.groundRentAnnual;

  const netYieldNoMortgage = pct(annualRent - runningCosts, totalCost);

  const loan = i.purchasePrice * (i.ltvPct / 100);
  const deposit = i.purchasePrice - loan;
  const mortgageInterest = loan * (i.mortgageRatePct / 100);

  const netCashFlow = annualRent - runningCosts - mortgageInterest;
  const cashInvested = deposit + i.refurbCost + i.otherCosts + i.sourcingFee;
  const cashOnCash = pct(netCashFlow, cashInvested);

  return {
    annualRent,
    totalCost,
    grossYield,
    yieldOnCost,
    breakdown: {
      management,
      maintenance,
      voids,
      insurance: i.insuranceAnnual,
      serviceCharge: i.serviceChargeAnnual,
      groundRent: i.groundRentAnnual,
      runningCosts,
    },
    netYieldNoMortgage,
    mortgage: { loan, deposit, mortgageInterest },
    netCashFlow,
    cashInvested,
    cashOnCash,
    paybackYears: netCashFlow > 0 ? cashInvested / netCashFlow : null,
  };
}

const pct = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100);
```

**Display rules:** always show one decimal (12.0%), always show the formula tooltip on hover ("Annual rent ÷ purchase price"). Sourcers get challenged by buyers on this exact point — showing your working is the trust signal.

---

## 12. Per-lead branded clone (how you scale without lying)

Theming lives in the `org` row: `name`, `logoUrl`, `brandColor`, `accentColor`, `domain`, `ndaText`, `notifyEmail`.

For a real lead who replies:

1. Insert a new `org` row with their name/logo/colours (5 min).
2. Insert one `deal` row with a plausible deal from their patch (10 min).
3. Deploy to a subdomain or a path like `/p/[org-slug]/d/[deal-slug]` (path is fine for the demo).
4. Now "I built this for you" is **true**, because you actually did.

For the very first cold demo (before anyone replies), use a neutral brand: **"Northline Property Partners"** or **"Sample Sourcing Co"** — and the email must say _"here is a live example"_, not _"I built this for you"_. Honesty is a design constraint, not a nicety.

---

## 13. Environment variables

```bash
DATABASE_URL=postgres://...
SOURCER_PASSCODE=change-me-please
JWT_SECRET=<32+ random chars>
NEXT_PUBLIC_APP_URL=https://usman-devs.online
BLOB_READ_WRITE_TOKEN=vercel_blob_...
RESEND_API_KEY=re_...           # optional
DEMO_ORG_ID=<uuid of seeded org>
```

---

## 14. Folder structure

```
app/
  page.tsx                       → redirect to demo deal
  login/page.tsx
  dashboard/
    page.tsx
    deals/new/page.tsx
    deals/[id]/page.tsx
  d/[slug]/page.tsx              → locked / unlocked render
  api/
    auth/login/route.ts
    deals/route.ts
    deals/[id]/nda/route.ts
    deals/[id]/address/route.ts
    deals/[id]/interest/route.ts
lib/
  db.ts  schema.ts  auth.ts  yield.ts  slug.ts  watermark.ts
components/
  deal-gallery.tsx  yield-table.tsx  nda-modal.tsx  lock-address.tsx
  photo-uploader.tsx  live-yield-preview.tsx
db/seed.ts                       → org + fixture deal
```

---

## 15. Build order (4 days)

**Day 1 — Foundation**
Schema + migrations, seed org + fixture deal, passcode login, dashboard list, upload form with live yield preview. _Checkpoint: you can create a deal and see it in the dashboard._

**Day 2 — Buyer side**
`/d/[slug]` locked render, gallery, outcode map, NDA modal, `/api/nda`, cookie, unlocked render, address API. _Checkpoint: sign NDA in incognito, see full address._

**Day 3 — Leads + polish**
Interest flow, sourcer leads tab, event logging + stats, watermark, mobile pass, `noindex`, DevTools address leak test. _Checkpoint: acceptance criteria 1–8 all green._

**Day 4 — Deploy + video**
Vercel deploy, custom domain, Lighthouse check, record the 60-second video, write the outreach email with the real link.

If Day 1 slips, cut the photo gallery to 3 static images. If Day 3 slips, cut stats. Never cut the address protection or the live yield calculation — those are the only two things the email actually promises.

---

## 16. Deployment checklist

- [ ] `DATABASE_URL` and `JWT_SECRET` set in Vercel
- [ ] Migrations run against prod DB
- [ ] Seed script run once
- [ ] Custom domain with HTTPS
- [ ] `robots.txt` disallows `/d/` and `/dashboard/`
- [ ] DevTools test: postcode not in source or network before NDA
- [ ] Test on real iPhone + Android
- [ ] Test in incognito (cookie flow)
- [ ] Test NDA with a fake email; confirm dashboard shows it
- [ ] Lighthouse mobile ≥ 85

---

## 17. The 60-second video script

No talking. Screen recording, clean captions, subtle background music. 1440×900, 30fps.

| Time   | On screen                                 | Caption                              |
| ------ | ----------------------------------------- | ------------------------------------ |
| 0–6s   | Sourcer form, typing numbers              | "Upload a deal in 60 seconds"        |
| 6–14s  | Yield table updating as rent is typed     | "Yield and ROI calculate live"       |
| 14–22s | Share link + copy button                  | "Send one private link"              |
| 22–32s | Buyer view, address blurred, click unlock | "Address locked until NDA"           |
| 32–42s | NDA form, sign, address appears           | "Buyer signs. Address revealed."     |
| 42–50s | Watermark + "I'm interested" click        | "Watermarked. Lead comes to you."    |
| 50–58s | Dashboard leads table                     | "Every buyer in your dashboard"      |
| 58–60s | Logo + URL                                | "Private deal rooms for UK sourcers" |

Upload unlisted. Use that link in the email. Do not link the live demo page in the cold email — link the video. Send the live page only when they reply.

---

## 18. Risks and gotchas

| Risk                                    | Mitigation                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Address leaks via client bundle         | Server-side select only; DevTools test before every deploy                                                      |
| Photos make it look like a real listing | Stock photos only; add a small "Sample deal" ribbon                                                             |
| NDA looks fake/weak                     | Show the recorded fields (name, email, IP, timestamp) on the confirmation screen — it must feel legally serious |
| Buyer spam-signing NDAs                 | Rate limit `POST /nda` to 5/min per IP; email validation                                                        |
| Yield numbers look wrong to a pro       | Show formulas on hover; keep assumptions visible and editable                                                   |
| You spend a week adding features        | The out-of-scope list in Section 2 is binding                                                                   |

---
