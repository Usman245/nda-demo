"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(() => import("./deal-map-inner"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-slate-200" />,
});

export type MapProps = {
  lat: number;
  lng: number;
  /** "area" = outcode circle, no pin. "exact" = pin on the postcode. */
  mode: "area" | "exact";
};

export function DealMap(props: MapProps) {
  return <Inner {...props} />;
}
