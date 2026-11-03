"use client";

import { useState } from "react";
import { Check, Copy, MapPin } from "lucide-react";

export function UnlockedAddress({ lines }: { lines: string[] }) {
  const [done, setDone] = useState(false);
  const text = lines.join(", ");
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-300/70 bg-emerald-400/15 p-4 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <p className="text-lg font-semibold text-slate-900">{text}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(text).catch(() => {});
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        }}
        className="inline-flex shrink-0 items-center gap-1.5 btn-glass rounded-xl px-3 py-1.5 text-sm font-medium text-emerald-800"
      >
        {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
