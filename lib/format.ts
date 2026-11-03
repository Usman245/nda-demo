const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export const money = (n: number) => gbp.format(Math.round(n));

/** Always one decimal, per spec ("12.0%"). */
export const pct1 = (n: number) => `${n.toFixed(1)}%`;

export const dateTime = (d: Date | string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(d));
