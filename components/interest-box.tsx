"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail, Phone, Send } from "lucide-react";

type Sourcer = { name: string; email: string; phone: string | null };

export function InterestBox({
  dealId,
  sourcer,
}: {
  dealId: string;
  sourcer: Sourcer;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-5">
      {sent ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-slate-900">Sent. {sourcer.name || "The sourcer"} will contact you directly.</p>
            <p className="mt-1 text-sm text-slate-500">You can also reach them using the details below.</p>
          </div>
        </div>
      ) : open ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Message to {sourcer.name || "the sourcer"} <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="e.g. Cash buyer, can proceed this week. Can I view?"
              className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-base"
            />
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="button"
            onClick={send}
            disabled={busy}
            className="btn-brand inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 font-semibold disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send my details
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-accent w-full rounded-2xl px-5 py-3.5 text-lg font-semibold"
        >
          I&apos;m interested
        </button>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-white/70 pt-3 text-sm text-slate-600">
        <span className="font-medium text-slate-900">{sourcer.name}</span>
        <a href={`mailto:${sourcer.email}`} className="inline-flex items-center gap-1.5 hover:text-brand">
          <Mail className="h-4 w-4" /> {sourcer.email}
        </a>
        {sourcer.phone && (
          <a href={`tel:${sourcer.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-brand">
            <Phone className="h-4 w-4" /> {sourcer.phone}
          </a>
        )}
      </div>
    </div>
  );
}
