import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { dateTime, pct1 } from "@/lib/format";
import { getDealForSourcer, getLeads, statsByDeal, type DealStats } from "@/lib/stats";
import { toInputs } from "@/lib/deals";
import { calculate } from "@/lib/yield";
import { AutoRefresh } from "@/components/auto-refresh";
import { CopyButton } from "@/components/copy-button";

export const dynamic = "force-dynamic";

const TABS = [
  ["share", "Share"],
  ["leads", "Leads"],
  ["stats", "Stats"],
] as const;

async function baseUrl() {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto =
      h.get("x-forwarded-proto") ??
      (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return "http://localhost:3000";
  }
}

export default async function DealAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; new?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  let d;
  try {
    d = await getDealForSourcer(id);
  } catch (err) {
    console.error("Failed to query deal:", err);
    notFound();
  }
  if (!d) notFound();

  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "share";
  const url = `${await baseUrl()}/d/${d.slug}`;
  const calc = calculate(toInputs(d));

  let stats: DealStats = { views: 0, ndaViews: 0, signatures: 0, interests: 0 };
  try {
    const statsMap = await statsByDeal();
    stats = statsMap.get(d.id) ?? stats;
  } catch (err) {
    console.error("Failed to fetch deal stats:", err);
  }

  return (
    <div className="space-y-6">
      {tab === "leads" && <AutoRefresh everyMs={2000} />}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> All deals
        </Link>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{d.title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">
          {d.addressLine1}
          {d.addressLine2 ? `, ${d.addressLine2}` : ""}, {d.city}, {d.postcode} ·{" "}
          <span className="font-semibold text-brand">gross yield {pct1(calc.grossYield)}</span>
        </p>
      </div>

      {sp.new && (
        <div className="glass flex items-center gap-2.5 rounded-2xl !border-emerald-300/70 px-4 py-3 text-emerald-800">
          <Check className="h-5 w-5" /> Deal published. Share the private link below.
        </div>
      )}

      {/* Glass pill tabs */}
      <div className="glass inline-flex gap-1 rounded-2xl p-1.5">
        {TABS.map(([k, label]) => (
          <Link
            key={k}
            href={`/dashboard/deals/${d.id}?tab=${k}`}
            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === k ? "btn-brand" : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
            }`}
          >
            {label}
            {k === "leads" && stats.signatures > 0 && (
              <span
                className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                  tab === k ? "bg-white/25 text-white" : "bg-brand/15 text-brand"
                }`}
              >
                {stats.signatures}
              </span>
            )}
          </Link>
        ))}
      </div>

      {tab === "share" && <ShareTab url={url} title={d.title} gross={pct1(calc.grossYield)} />}
      {tab === "leads" && <LeadsTab dealId={d.id} />}
      {tab === "stats" && <StatsTab s={stats} />}
    </div>
  );
}

async function ShareTab({ url, title, gross }: { url: string; title: string; gross: string }) {
  let qr = "";
  try {
    qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
  } catch (err) {
    console.error("Failed to generate QR code:", err);
  }
  const whatsapp = `New deal: ${title} — ${gross} gross yield. View: ${url} (NDA required for address)`;
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_auto]">
      <div className="glass space-y-5 rounded-3xl p-5 sm:p-6">
        <div>
          <div className="mb-1.5 text-sm font-semibold text-slate-800">Private deal link</div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="glass-input min-w-0 flex-1 break-all rounded-xl px-3.5 py-2.5 text-sm">{url}</code>
            <CopyButton text={url} label="Copy link" />
            <a
              href={url}
              target="_blank"
              className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              <ExternalLink className="h-4 w-4" /> Open
            </a>
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-sm font-semibold text-slate-800">WhatsApp message</div>
          <p className="glass-input mb-2.5 rounded-xl px-3.5 py-2.5 text-sm text-slate-700">{whatsapp}</p>
          <CopyButton text={whatsapp} label="Copy WhatsApp message" />
        </div>
      </div>
      {qr && (
        <div className="glass rounded-3xl p-5 text-center">
          <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code for deal link" width={200} height={200} className="mx-auto" />
          </div>
          <p className="mt-2.5 text-xs font-medium text-slate-500">Scan to open on mobile</p>
        </div>
      )}
    </div>
  );
}

async function LeadsTab({ dealId }: { dealId: string }) {
  let sigs: Awaited<ReturnType<typeof getLeads>>["sigs"] = [];
  let ints: Awaited<ReturnType<typeof getLeads>>["ints"] = [];
  try {
    const leads = await getLeads(dealId);
    sigs = leads.sigs;
    ints = leads.ints;
  } catch (err) {
    console.error("Failed to load leads:", err);
  }

  const interestedBy = new Map<string, typeof ints>();
  for (const i of ints) interestedBy.set(i.ndaId, [...(interestedBy.get(i.ndaId) ?? []), i]);

  if (sigs.length === 0) {
    return (
      <div className="glass rounded-3xl p-10 text-center text-slate-500">
        No buyers have signed the NDA yet. This page updates live every 2 seconds.
      </div>
    );
  }
  return (
    <div className="glass-strong overflow-x-auto rounded-3xl">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-white/60 bg-white/40 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-3.5">Buyer</th>
            <th className="px-3 py-3.5">Email</th>
            <th className="px-3 py-3.5">Phone</th>
            <th className="px-3 py-3.5">Signed</th>
            <th className="px-5 py-3.5">Interested?</th>
          </tr>
        </thead>
        <tbody>
          {sigs.map((s) => {
            const mine = interestedBy.get(s.id) ?? [];
            return (
              <tr key={s.id} className="border-t border-white/50 align-top transition-colors hover:bg-white/40">
                <td className="px-5 py-4 font-semibold">{s.buyerName}</td>
                <td className="px-3 py-4">
                  <a className="font-medium text-brand hover:underline" href={`mailto:${s.buyerEmail}`}>
                    {s.buyerEmail}
                  </a>
                </td>
                <td className="px-3 py-4">{s.buyerPhone ?? "—"}</td>
                <td className="px-3 py-4 text-slate-500">
                  {s.signedAt ? dateTime(s.signedAt) : "—"}
                  <div className="text-xs text-slate-400">IP {s.ip ?? "n/a"}</div>
                </td>
                <td className="px-5 py-4">
                  {mine.length ? (
                    <div>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Yes · {mine[0]?.createdAt ? dateTime(mine[0].createdAt) : "Recently"}
                      </span>
                      {mine.map(
                        (m) =>
                          m.message && (
                            <p key={m.id} className="mt-1.5 max-w-xs text-slate-700">
                              “{m.message}”
                            </p>
                          ),
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">No</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatsTab({ s }: { s: DealStats }) {
  const views = s?.views ?? 0;
  const signatures = s?.signatures ?? 0;
  const conv = views > 0 ? (signatures / views) * 100 : 0;
  const cards = [
    ["Page views", views],
    ["NDA form opened", s?.ndaViews ?? 0],
    ["NDAs signed", signatures],
    ["Interest clicks", s?.interests ?? 0],
    ["View → NDA", pct1(conv)],
  ];
  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
      {cards.map(([label, v], idx) => (
        <div
          key={label}
          className={`rounded-3xl p-4 sm:p-5 ${idx === 4 ? "glass-brand" : "glass"}`}
        >
          <div
            className={`text-xs font-medium uppercase tracking-wider ${
              idx === 4 ? "text-white/80" : "text-slate-500"
            }`}
          >
            {label}
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums sm:text-3xl">{v}</div>
        </div>
      ))}
    </div>
  );
}
