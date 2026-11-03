"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Wand2 } from "lucide-react";
import { calculate, type DealInputs } from "@/lib/yield";
import { YieldTable } from "./yield-table";
import { PhotoUploader } from "./photo-uploader";
import { money, pct1 } from "@/lib/format";

type F = {
  title: string;
  strategy: string;
  city: string;
  outcode: string;
  addressLine1: string;
  addressLine2: string;
  postcode: string;
  description: string;
  purchasePrice: string;
  refurbCost: string;
  otherCosts: string;
  sourcingFee: string;
  monthlyRent: string;
  serviceChargeAnnual: string;
  groundRentAnnual: string;
  insuranceAnnual: string;
  managementPct: string;
  voidsWeeks: string;
  maintenancePct: string;
  ltvPct: string;
  mortgageRatePct: string;
};

const blank: F = {
  title: "",
  strategy: "BTL",
  city: "",
  outcode: "",
  addressLine1: "",
  addressLine2: "",
  postcode: "",
  description: "",
  purchasePrice: "",
  refurbCost: "",
  otherCosts: "",
  sourcingFee: "",
  monthlyRent: "",
  serviceChargeAnnual: "",
  groundRentAnnual: "",
  insuranceAnnual: "",
  managementPct: "10",
  voidsWeeks: "3",
  maintenancePct: "8",
  ltvPct: "75",
  mortgageRatePct: "5.5",
};

const example: Partial<F> = {
  title: "3-Bed Semi — Wavertree, L15",
  city: "Liverpool",
  outcode: "L15",
  addressLine1: "17 Example Road",
  postcode: "L15 1AA",
  purchasePrice: "110000",
  refurbCost: "15000",
  otherCosts: "5000",
  sourcingFee: "3000",
  monthlyRent: "950",
  insuranceAnnual: "350",
};

const n = (s: string) => (Number.isFinite(parseFloat(s)) ? parseFloat(s) : 0);

export function DealForm() {
  const router = useRouter();
  const [f, setF] = useState<F>(blank);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const inputs: DealInputs = useMemo(
    () => ({
      purchasePrice: n(f.purchasePrice),
      refurbCost: n(f.refurbCost),
      otherCosts: n(f.otherCosts),
      sourcingFee: n(f.sourcingFee),
      monthlyRent: n(f.monthlyRent),
      serviceChargeAnnual: n(f.serviceChargeAnnual),
      groundRentAnnual: n(f.groundRentAnnual),
      insuranceAnnual: n(f.insuranceAnnual),
      managementPct: n(f.managementPct),
      voidsWeeks: n(f.voidsWeeks),
      maintenancePct: n(f.maintenancePct),
      ltvPct: n(f.ltvPct),
      mortgageRatePct: n(f.mortgageRatePct),
    }),
    [f],
  );
  const calc = calculate(inputs);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, photos }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const issues = j.issues ? Object.entries(j.issues).map(([k, v]) => `${k}: ${(v as string[])[0]}`).join(" · ") : "";
        throw new Error(issues || j.error || "Could not create deal");
      }
      router.push(`/dashboard/deals/${j.id}?tab=share&new=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create deal");
      setBusy(false);
    }
  }

  const field = "glass-input mt-1 w-full rounded-xl px-3.5 py-2.5 text-base";
  const label = "block text-sm font-medium text-slate-700";
  const card = "glass rounded-3xl p-5 sm:p-6";

  const num = (k: keyof F, text: string, prefix?: string) => (
    <label className={label}>
      {text}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400">{prefix}</span>}
        <input
          inputMode="decimal"
          value={f[k]}
          onChange={set(k)}
          className={`${field} ${prefix ? "pl-7" : ""}`}
          required={k === "purchasePrice" || k === "monthlyRent"}
        />
      </div>
    </label>
  );

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">New deal</h1>
          <button
            type="button"
            onClick={() => setF((p) => ({ ...p, ...example }))}
            className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700"
          >
            <Wand2 className="h-4 w-4 text-brand" /> Fill example
          </button>
        </div>

        <section className={card}>
          <h2 className="mb-3 font-semibold">Deal basics</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`${label} sm:col-span-2`}>
              Title
              <input className={field} value={f.title} onChange={set("title")} required placeholder="2-Bed Terraced — Anfield, L6" />
            </label>
            <label className={label}>
              Strategy
              <select className={field} value={f.strategy} onChange={set("strategy")}>
                {["BTL", "BRRR", "HMO", "Flip", "Development"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              City
              <input className={field} value={f.city} onChange={set("city")} required />
            </label>
            <label className={label}>
              Outcode <span className="font-normal text-slate-400">(shown publicly)</span>
              <input className={`${field} uppercase`} value={f.outcode} onChange={set("outcode")} required placeholder="L6" />
            </label>
            <div />
            <label className={label}>
              Address line 1 <span className="font-normal text-slate-400">(locked)</span>
              <input className={field} value={f.addressLine1} onChange={set("addressLine1")} required />
            </label>
            <label className={label}>
              Address line 2
              <input className={field} value={f.addressLine2} onChange={set("addressLine2")} />
            </label>
            <label className={label}>
              Full postcode <span className="font-normal text-slate-400">(locked)</span>
              <input className={`${field} uppercase`} value={f.postcode} onChange={set("postcode")} required />
            </label>
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 font-semibold">Photos</h2>
          <PhotoUploader onChange={setPhotos} />
        </section>

        <section className={card}>
          <h2 className="mb-3 font-semibold">Numbers</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {num("purchasePrice", "Purchase price", "£")}
            {num("refurbCost", "Refurb budget", "£")}
            {num("otherCosts", "Other purchase costs (stamp + legal)", "£")}
            {num("sourcingFee", "Sourcing fee (paid by investor)", "£")}
            {num("monthlyRent", "Monthly rent", "£")}
            {num("insuranceAnnual", "Insurance (annual)", "£")}
            {num("serviceChargeAnnual", "Service charge (annual)", "£")}
            {num("groundRentAnnual", "Ground rent (annual)", "£")}
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 font-semibold">Assumptions</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {num("managementPct", "Management %")}
            {num("voidsWeeks", "Voids (weeks/yr)")}
            {num("maintenancePct", "Maintenance %")}
            {num("ltvPct", "Mortgage LTV %")}
            {num("mortgageRatePct", "Mortgage rate %")}
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 font-semibold">Description</h2>
          <textarea
            className={field}
            rows={5}
            value={f.description}
            onChange={set("description")}
            placeholder="Public text. Do NOT include the address, street name or postcode."
          />
        </section>

        {error && <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
        <button
          disabled={busy}
          className="btn-brand inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
          Publish deal
        </button>
      </div>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="glass-strong rounded-3xl p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Live yield preview</h2>
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">Real-time</span>
          </div>
          <div className="mb-4 flex gap-3">
            <div className="glass-brand flex-1 rounded-2xl p-3.5">
              <div className="text-xs text-white/80">Gross yield</div>
              <div className="text-2xl font-extrabold tabular-nums">{pct1(calc.grossYield)}</div>
            </div>
            <div className="glass flex-1 rounded-2xl p-3.5">
              <div className="text-xs text-slate-500">Cash-on-cash</div>
              <div className="text-2xl font-extrabold tabular-nums">{pct1(calc.cashOnCash)}</div>
            </div>
          </div>
          <div className="mb-3 text-sm text-slate-600">
            Net cash flow <b className="text-slate-900">{money(calc.netCashFlow)}</b> / yr
          </div>
          <YieldTable inputs={inputs} />
        </div>
      </aside>
    </form>
  );
}
