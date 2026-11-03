"use client";

import { useState } from "react";
import { ExternalLink, Lock, MapPin } from "lucide-react";

export type MapProps = {
  /** "area" = outcode district view, address hidden. "exact" = street level with pin. */
  mode: "area" | "exact";
  /** Search query for Google Maps (e.g. "L6, Liverpool, UK" or "42 Demo Street, Liverpool, L6 4BX") */
  query: string;
  /** Display outcode for badge (e.g. "L6") */
  outcode?: string;
};

export function DealMap({ mode, query, outcode }: MapProps) {
  const [loaded, setLoaded] = useState(false);
  const zoom = mode === "exact" ? 16 : 13;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    query
  )}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-80">
      {/* Loading Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <MapPin className="h-6 w-6 animate-bounce text-brand" />
            <span className="text-xs font-medium">Loading Google Map...</span>
          </div>
        </div>
      )}

      {/* Google Public Map Iframe */}
      <iframe
        title={
          mode === "exact"
            ? "Exact property location on Google Maps"
            : "Property district area on Google Maps"
        }
        src={embedUrl}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full border-0 transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen={false}
      />

      {/* Top Left Badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-10">
        {mode === "exact" ? (
          <span className="glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <MapPin className="h-3.5 w-3.5 text-rose-500" /> Exact Property Location
          </span>
        ) : (
          <span className="glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-md">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            Area view {outcode ? `(${outcode})` : ""} · Pin locked
          </span>
        )}
      </div>

      {/* Top Right Direct Link */}
      {mode === "exact" && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-dark absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-md transition hover:scale-105 hover:bg-black/60"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Google Maps</span>
        </a>
      )}
    </div>
  );
}
