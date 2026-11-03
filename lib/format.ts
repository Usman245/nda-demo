const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export const money = (n: number) => gbp.format(Math.round(n || 0));

/** Always one decimal, per spec ("12.0%"). */
export const pct1 = (n: number) => `${(Number.isFinite(n) ? n : 0).toFixed(1)}%`;

export const dateTime = (d: Date | string | null | undefined) => {
  if (!d) return "—";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/London",
    }).format(date);
  } catch {
    return "—";
  }
};
