import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Banknote, Hammer, KeyRound, Lock, MapPin, ShieldCheck, TrendingUp } from "lucide-react";
import { event } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getBuyerSession, isSourcer } from "@/lib/auth";
import {
  getLockedAddress,
  getNdaSignature,
  getOrgContact,
  getPublicDeal,
  toInputs,
} from "@/lib/deals";
import { calculate } from "@/lib/yield";
import { dateTime, money, pct1 } from "@/lib/format";
import { Aurora } from "@/components/aurora";
import { DealGallery } from "@/components/deal-gallery";
import { DealMap } from "@/components/deal-map";
import { YieldTable } from "@/components/yield-table";
import { NdaButton } from "@/components/nda-modal";
import { InterestBox } from "@/components/interest-box";
import { UnlockedAddress } from "@/components/unlocked-address";
import { Watermark } from "@/components/watermark";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const row = await getPublicDeal(slug);
    return {
      title: row ? `${row.deal.title} | ${row.org.name}` : "Deal not found",
      robots: { index: false, follow: false },
      referrer: "no-referrer",
    };
  } catch {
    return {
      title: "Deal room",
      robots: { index: false, follow: false },
    };
  }
}

export default async function DealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let row;
  try {
    row = await getPublicDeal(slug);
  } catch (err) {
    console.error("Failed to fetch public deal:", err);
    notFound();
  }
  if (!row) notFound();
  const { deal, org } = row;

  const session = await getBuyerSession(deal.id);
  const unlocked = !!session;

  // Log a page view - but not for the sourcer previewing, and not for
  // router.refresh() calls (those are RSC requests, e.g. right after signing).
  const h = await headers();
  if (!h.get("rsc") && !(await isSourcer())) {
    after(async () => {
      const db = await getDb();
      await db
        .insert(event)
        .values({ dealId: deal.id, type: "view", meta: { unlocked } })
        .catch(() => {});
    });
  }

  const inputs = toInputs(deal);
  const calc = calculate(inputs);

  // ---- Post-NDA branch: the ONLY place address columns are read. ----
  let address: { lines: string[]; postcode: string } | null = null;
  let contact: Awaited<ReturnType<typeof getOrgContact>> | null = null;
  let signature: Awaited<ReturnType<typeof getNdaSignature>> | null = null;
  let mapMode: "area" | "exact" = "area";
  let mapQuery = `${deal.outcode}, ${deal.city}, UK`;

  if (session) {
    const [a, c, s] = await Promise.all([
      getLockedAddress(deal.id),
      getOrgContact(deal.orgId),
      getNdaSignature(session.ndaId, deal.id),
    ]);
    contact = c;
    signature = s;
    if (a) {
      address = {
        lines: [a.addressLine1, a.addressLine2, deal.city, a.postcode].filter(Boolean) as string[],
        postcode: a.postcode,
      };
      mapMode = "exact";
      mapQuery = `${address.lines.join(", ")}, UK`;
    }
  }

  const theme = {
    "--brand": org.brandColor,
    "--accent": org.accentColor,
  } as React.CSSProperties;

  const paragraphs = (deal.description ?? "").split(/\n{2,}/).filter(Boolean);

  const stats = [
    { label: "Purchase", value: money(deal.purchasePrice), Icon: Banknote },
    { label: "Refurb", value: money(deal.refurbCost), Icon: Hammer },
    { label: "Rent", value: `${money(deal.monthlyRent)} pcm`, Icon: KeyRound },
  ];

  const heroOverlay = (
    <div className="glass-dark hidden items-end justify-between gap-4 rounded-2xl p-4 sm:flex sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold tracking-wide backdrop-blur">
            {deal.strategy}
          </span>
          {deal.isSample && (
            <span className="rounded-full bg-accent/90 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-900">
              Sample deal
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight lg:text-3xl">{deal.title}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
          <MapPin className="h-4 w-4" /> {deal.outcode} · {deal.city}
          {deal.region ? `, ${deal.region}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/70">Gross yield</div>
        <div className="text-4xl font-extrabold tabular-nums leading-none lg:text-5xl">
          {pct1(calc.grossYield)}
        </div>
      </div>
    </div>
  );

  const gallery = (
    <DealGallery photos={deal.photos} alt={deal.title}>
      {heroOverlay}
    </DealGallery>
  );

  const yieldCard = (
    <div className="glass rounded-3xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Yield &amp; ROI breakdown</h2>
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">Live maths</span>
      </div>
      <YieldTable inputs={inputs} />
      <p className="mt-4 rounded-xl bg-white/40 p-3 text-xs leading-relaxed text-slate-600">
        Hover (or tap) any line to see how it is calculated. Assumptions: {inputs.managementPct}% management,{" "}
        {inputs.voidsWeeks} weeks voids, {inputs.maintenancePct}% maintenance.
      </p>
    </div>
  );

  return (
    <div style={theme} className="relative min-h-screen pb-32 lg:pb-14">
      <Aurora />

      {/* Header */}
      <header className="glass-strong sticky top-0 z-30 !rounded-none !border-x-0 !border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt="" className="h-9 w-9 rounded-xl object-contain" />
            ) : (
              <div className="btn-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold">
                {org.name.charAt(0)}
              </div>
            )}
            <span className="truncate font-semibold tracking-tight text-slate-900">{org.name}</span>
          </div>
          <span className="glass inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-slate-700">
            <Lock className="h-3 w-3 text-brand" /> Private deal room
          </span>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-brand via-accent to-brand" />
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:space-y-6 sm:py-8">
        {/* Mobile title (desktop title lives on the photo) */}
        <div className="sm:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="btn-brand rounded-full px-3 py-0.5 text-xs font-semibold">{deal.strategy}</span>
            {deal.isSample && (
              <span className="rounded-full bg-accent/25 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Sample deal
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight">{deal.title}</h1>
        </div>

        {/* Gallery / hero */}
        {unlocked ? <Watermark email={session!.email}>{gallery}</Watermark> : gallery}

        {/* Key numbers */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {stats.map(({ label, value, Icon }) => (
            <div key={label} className="glass rounded-3xl p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
              </div>
              <div className="mt-2 text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{value}</div>
            </div>
          ))}
          <div className="glass-brand relative overflow-hidden rounded-3xl p-4">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/80">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
              Gross yield
            </div>
            <div className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl">
              {pct1(calc.grossYield)}
            </div>
          </div>
        </div>

        <div className="grid items-start gap-5 sm:gap-6 lg:grid-cols-[1.05fr_1fr]">
          {/* NDA confirmation (post-sign) */}
          {unlocked && signature && (
            <div className="glass lg:col-start-1 flex items-start gap-3 rounded-3xl !border-emerald-300/70 p-4 text-sm text-emerald-900">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
              </span>
              <div>
                <p className="font-semibold">NDA signed — address unlocked</p>
                <p className="mt-0.5 break-words text-emerald-800/90">
                  Recorded: {signature.buyerName} · {signature.buyerEmail} · IP {signature.ip ?? "n/a"} ·{" "}
                  {dateTime(signature.signedAt)}
                </p>
              </div>
            </div>
          )}

          {/* Location + address */}
          <section className="glass rounded-3xl p-4 sm:p-6 lg:col-start-1">
            <h2 className="mb-3 text-lg font-semibold">Location</h2>
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/70">
              <DealMap query={mapQuery} mode={mapMode} outcode={deal.outcode} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {unlocked && mapMode === "exact"
                ? "Exact location of the property on Google Maps."
                : "Exact property address and pin released after NDA."}
            </p>

            <div className="mt-4">
              {address ? (
                <UnlockedAddress lines={address.lines} />
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/40 p-4 backdrop-blur-md">
                  <div className="shimmer pointer-events-none absolute inset-0" />
                  <p
                    aria-label="Address locked"
                    className="relative flex items-center gap-3 font-mono text-base text-slate-700 sm:text-lg"
                  >
                    <span className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                      <Lock className="h-4 w-4 text-brand" />
                    </span>
                    <span className="break-words tracking-wide">
                      ██ ██████████, {deal.city}, {deal.outcode} ███
                    </span>
                  </p>
                  <NdaButton
                    dealId={deal.id}
                    ndaText={org.ndaText}
                    className="btn-brand relative mt-4 w-full rounded-2xl px-4 py-3.5 text-base font-semibold sm:w-auto sm:px-6"
                  >
                    Unlock address — sign NDA (30 sec)
                  </NdaButton>
                </div>
              )}
            </div>
          </section>

          {/* Interest (post-NDA) */}
          {unlocked && contact && (
            <div className="lg:col-start-1">
              <InterestBox
                dealId={deal.id}
                sourcer={{
                  name: contact.sourcerName,
                  email: contact.notifyEmail,
                  phone: contact.sourcerPhone,
                }}
              />
            </div>
          )}

          {/* Yield table: right column on desktop, sticky */}
          <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:row-span-6">
            {unlocked ? <Watermark email={session!.email}>{yieldCard}</Watermark> : yieldCard}
          </div>

          {/* Description */}
          {paragraphs.length > 0 && (
            <section className="glass rounded-3xl p-4 sm:p-6 lg:col-start-1">
              <h2 className="mb-3 text-lg font-semibold">About this deal</h2>
              <div className="space-y-3 leading-relaxed text-slate-700">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}
        </div>

        {unlocked && session && (
          <p className="text-center text-xs text-slate-500">
            Licensed to {session.email} — do not distribute.
          </p>
        )}
      </main>

      {/* Sticky CTA (mobile) - floating glass bar */}
      {!unlocked && (
        <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
          <div className="glass-strong rounded-3xl p-2">
            <NdaButton
              dealId={deal.id}
              ndaText={org.ndaText}
              className="btn-brand flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-semibold"
            >
              <Lock className="h-4 w-4" /> Sign NDA to see address
            </NdaButton>
          </div>
        </div>
      )}
    </div>
  );
}
