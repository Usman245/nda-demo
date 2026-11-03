import { calculate, type DealInputs } from "@/lib/yield";
import { money, pct1 } from "@/lib/format";

type Row = { label: string; value: string; formula: string; strong?: boolean; tone?: "pos" | "neg" };

function Tip({ text }: { text: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[16rem] rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-normal text-white shadow-lg group-hover:block group-focus:block"
    >
      {text}
    </span>
  );
}

function Line({ row }: { row: Row }) {
  return (
    <tr className="border-b border-white/60 last:border-0 transition-colors hover:bg-white/30">
      <td className="py-2 pr-3">
        <span
          tabIndex={0}
          className="group relative inline-block cursor-help border-b border-dotted border-slate-300 outline-none"
        >
          <span className={row.strong ? "font-semibold text-slate-900" : "text-slate-600"}>
            {row.label}
          </span>
          <Tip text={row.formula} />
        </span>
      </td>
      <td
        className={`py-2 text-right tabular-nums ${row.strong ? "font-semibold" : ""} ${
          row.tone === "neg" ? "text-rose-600" : row.tone === "pos" ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {row.value}
      </td>
    </tr>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h4 className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-widest text-brand first:mt-0">
        {title}
      </h4>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <Line key={r.label} row={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Pure presentational component: used on the public deal page and the live preview. */
export function YieldTable({ inputs }: { inputs: DealInputs }) {
  const c = calculate(inputs);
  const b = c.breakdown;
  const neg = (n: number) => (n < 0 ? ("neg" as const) : ("pos" as const));

  return (
    <div>
      <Section
        title="Yields"
        rows={[
          { label: "Annual rent", value: money(c.annualRent), formula: "Monthly rent × 12" },
          {
            label: "Gross yield",
            value: pct1(c.grossYield),
            formula: "Annual rent ÷ purchase price",
            strong: true,
          },
          {
            label: "Yield on total cost",
            value: pct1(c.yieldOnCost),
            formula: "Annual rent ÷ (purchase + refurb + other costs)",
          },
          {
            label: "Net yield (no mortgage)",
            value: pct1(c.netYieldNoMortgage),
            formula: "(Annual rent − running costs) ÷ (purchase + refurb + other costs)",
          },
        ]}
      />
      <Section
        title="Annual running costs"
        rows={[
          {
            label: `Management (${inputs.managementPct}%)`,
            value: money(b.management),
            formula: "Annual rent × management %",
          },
          {
            label: `Maintenance (${inputs.maintenancePct}%)`,
            value: money(b.maintenance),
            formula: "Annual rent × maintenance %",
          },
          {
            label: `Voids (${inputs.voidsWeeks} wks)`,
            value: money(b.voids),
            formula: "Annual rent × voids weeks ÷ 52",
          },
          { label: "Insurance", value: money(b.insurance), formula: "Annual insurance cost" },
          ...(b.serviceCharge
            ? [{ label: "Service charge", value: money(b.serviceCharge), formula: "Annual service charge" }]
            : []),
          ...(b.groundRent
            ? [{ label: "Ground rent", value: money(b.groundRent), formula: "Annual ground rent" }]
            : []),
          {
            label: "Total running costs",
            value: money(b.runningCosts),
            formula: "Sum of the lines above",
            strong: true,
          },
        ]}
      />
      <Section
        title={`Finance (${inputs.ltvPct}% LTV, ${inputs.mortgageRatePct}% interest-only)`}
        rows={[
          { label: "Mortgage loan", value: money(c.mortgage.loan), formula: "Purchase price × LTV %" },
          {
            label: "Deposit",
            value: money(c.mortgage.deposit),
            formula: "Purchase price − mortgage loan",
          },
          {
            label: "Mortgage interest",
            value: money(c.mortgage.mortgageInterest),
            formula: "Loan × rate % (interest-only)",
          },
        ]}
      />
      <Section
        title="Returns"
        rows={[
          {
            label: "Net cash flow / year",
            value: money(c.netCashFlow),
            formula: "Annual rent − running costs − mortgage interest",
            strong: true,
            tone: neg(c.netCashFlow),
          },
          {
            label: "Cash invested",
            value: money(c.cashInvested),
            formula: "Deposit + refurb + other costs + sourcing fee",
          },
          {
            label: "Cash-on-cash ROI",
            value: pct1(c.cashOnCash),
            formula: "Net cash flow ÷ cash invested",
            strong: true,
            tone: neg(c.cashOnCash),
          },
          ...(c.paybackYears
            ? [
                {
                  label: "Payback",
                  value: `${c.paybackYears.toFixed(1)} yrs`,
                  formula: "Cash invested ÷ net cash flow",
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
