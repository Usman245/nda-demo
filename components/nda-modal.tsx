"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck, X } from "lucide-react";

type Props = {
  dealId: string;
  ndaText: string;
  className?: string;
  children: React.ReactNode;
};

export function NdaButton({ dealId, ndaText, className, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          // Fire-and-forget analytics: NDA form viewed.
          fetch(`/api/deals/${dealId}/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "nda_view" }),
            keepalive: true,
          }).catch(() => {});
        }}
        className={className}
      >
        {children}
      </button>
      {open && <NdaModal dealId={dealId} ndaText={ndaText} onClose={() => setOpen(false)} />}
    </>
  );
}

function NdaModal({
  dealId,
  ndaText,
  onClose,
}: {
  dealId: string;
  ndaText: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signature, setSignature] = useState("");
  const [consent, setConsent] = useState(false);
  const [showText, setShowText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (signature.trim().length < 3) return setError("Type your full name to sign.");
    if (!consent) return setError("Please tick the agreement box.");
    setBusy(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/nda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, signature, consent }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Something went wrong");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const input =
    "glass-input w-full rounded-xl px-3 py-2.5 text-base";

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Sign NDA"
    >
      <form
        onSubmit={submit}
        className="glass-strong rise max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Lock className="h-5 w-5 text-brand" /> Sign NDA to unlock the address
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Takes about 30 seconds.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-500 hover:bg-white/70">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input type="email" className={`${input} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone <span className="font-normal text-slate-400">(optional)</span>
            <input type="tel" className={`${input} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Signature <span className="font-normal text-slate-400">(type your full name)</span>
            <input className={`${input} mt-1`} value={signature} onChange={(e) => setSignature(e.target.value)} required minLength={3} />
          </label>
          <div
            aria-label="Signature preview"
            className="flex h-16 items-center rounded-xl border border-dashed border-slate-300/80 bg-white/50 px-4 backdrop-blur font-script text-3xl text-slate-800"
          >
            {signature || <span className="text-base text-slate-300 font-sans">Your signature appears here</span>}
          </div>

          <button type="button" onClick={() => setShowText((s) => !s)} className="text-sm font-medium text-brand underline">
            {showText ? "Hide" : "Read"} full NDA text
          </button>
          {showText && (
            <div className="max-h-40 overflow-y-auto whitespace-pre-line rounded-xl bg-white/50 p-3 backdrop-blur text-xs leading-relaxed text-slate-600">
              {ndaText}
            </div>
          )}

          <label className="flex items-start gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand)]"
            />
            I agree not to contact the vendor directly and not to share this address with third parties.
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-rose-50/80 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-brand mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-semibold disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          Sign &amp; unlock address
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Signed electronically. Your name, email, IP and timestamp are recorded.
        </p>
      </form>
    </div>,
    document.body,
  );
}
