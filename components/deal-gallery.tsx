"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

export function DealGallery({
  photos,
  alt,
  children,
}: {
  photos: string[];
  alt: string;
  /** Rendered over the bottom-left of the hero image (e.g. the glass title card). */
  children?: ReactNode;
}) {
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="glass aspect-[16/10] w-full rounded-3xl lg:aspect-auto lg:h-[60vh]" />
    );
  }

  const go = (d: number) => setI((n) => (n + d + photos.length) % photos.length);

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-slate-300 shadow-[0_30px_80px_-30px_rgb(15_23_42/0.55)] ring-1 ring-white/60 lg:aspect-auto lg:h-[60vh]"
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (startX.current == null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          startX.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photos[i]}
          src={photos[i]}
          alt={`${alt} - photo ${i + 1}`}
          className="rise h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          draggable={false}
          fetchPriority="high"
        />
        {/* legibility gradient under overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/10" />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(-1)}
              className="glass-dark absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full p-2.5 transition hover:scale-110 sm:block"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(1)}
              className="glass-dark absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full p-2.5 transition hover:scale-110 sm:block"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="glass-dark absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <Images className="h-3.5 w-3.5" /> {i + 1} / {photos.length}
            </span>
          </>
        )}

        {children && <div className="absolute inset-x-3 bottom-3 sm:inset-x-5 sm:bottom-5">{children}</div>}
      </div>

      {photos.length > 1 && (
        <div className="glass flex gap-2 overflow-x-auto rounded-2xl p-2">
          {photos.map((p, n) => (
            <button
              key={p}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show photo ${n + 1}`}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-xl transition sm:h-16 sm:w-24 ${
                n === i
                  ? "ring-2 ring-brand ring-offset-2 ring-offset-white/60"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
