import type { ReactNode } from "react";
import { watermarkSvg } from "@/lib/watermark";

/** Faint diagonal buyer-email overlay. pointer-events:none, user-select:none. */
export function Watermark({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 select-none"
        style={{ backgroundImage: watermarkSvg(email), backgroundRepeat: "repeat" }}
      />
    </div>
  );
}
