import Link from "next/link";
import { Eye, FileSignature, HeartHandshake, Plus, Sparkles } from "lucide-react";
import { dateTime } from "@/lib/format";
import { listDeals, statsByDeal } from "@/lib/stats";
import { AutoRefresh } from "@/components/auto-refresh";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [deals, stats] = await Promise.all([listDeals(), statsByDeal()]);

  const totals = deals.reduce(
    (acc, d) => {
      const s = stats.get(d.id) ?? { views: 0, ndaViews: 0, signatures: 0, interests: 0 };
      acc.views += s.views;
      acc.signatures += s.signatures;
      acc.interests += s.interests;
      return acc;
    },
    { views: 0, signatures: 0, interests: 0 },
  );

  return (
    <div className="space-y-6">
      <AutoRefresh everyMs={5000} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-brand">
            <Sparkles className="h-3.5 w-3.5" /> Live overview
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Your deal rooms</h1>
        </div>
        <Link
          href="/dashboard/deals/new"
          className="btn-brand inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Upload deal (60s)
        </Link>
      </div>

      {/* Summary glass cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="glass rounded-3xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            <Eye className="h-4 w-4 text-brand" /> Total views
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums sm:text-3xl">{totals.views}</div>
        </div>
        <div className="glass rounded-3xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            <FileSignature className="h-4 w-4 text-brand" /> NDAs signed
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums sm:text-3xl">{totals.signatures}</div>
        </div>
        <div className="glass-brand rounded-3xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/80">
            <HeartHandshake className="h-4 w-4" /> Interested buyers
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums sm:text-3xl">{totals.interests}</div>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-slate-600">
          No deals yet.{" "}
          <Link href="/dashboard/deals/new" className="font-semibold text-brand underline">
            Create your first deal room
          </Link>
          .
        </div>
      ) : (
        <div className="glass-strong overflow-x-auto rounded-3xl">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-white/60 bg-white/40 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Deal</th>
                <th className="px-3 py-3.5 text-right">Views</th>
                <th className="px-3 py-3.5 text-right">NDAs</th>
                <th className="px-3 py-3.5 text-right">Interested</th>
                <th className="px-5 py-3.5">Created</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => {
                const s = stats.get(d.id) ?? { views: 0, ndaViews: 0, signatures: 0, interests: 0 };
                return (
                  <tr
                    key={d.id}
                    className="border-t border-white/50 transition-colors hover:bg-white/45"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/deals/${d.id}`}
                        className="font-semibold text-slate-900 hover:text-brand"
                      >
                        {d.title}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand">
                          {d.strategy}
                        </span>
                        <span>{d.outcode}</span>
                        <span>· {d.status}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right font-medium tabular-nums">{s.views}</td>
                    <td className="px-3 py-4 text-right font-medium tabular-nums">{s.signatures}</td>
                    <td className="px-3 py-4 text-right font-bold tabular-nums text-emerald-700">
                      {s.interests}
                    </td>
                    <td className="px-5 py-4 text-slate-500">{dateTime(d.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
