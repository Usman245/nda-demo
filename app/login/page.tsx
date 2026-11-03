"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Aurora } from "@/components/aurora";

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      router.replace("/dashboard");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <Aurora />
      <form
        onSubmit={submit}
        className="glass-strong rise w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3.5">
          <div className="btn-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Sourcer portal</h1>
            <p className="text-xs text-slate-500">Enter your private passcode to manage deal rooms</p>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Passcode
          <div className="relative mt-1.5">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••••"
              className="glass-input w-full rounded-xl py-3 pl-10 pr-3.5 text-base"
            />
          </div>
        </label>

        {error && (
          <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <button
          disabled={busy || !passcode}
          className="btn-brand mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          Sign in to dashboard
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          Demo passcode: <code className="rounded bg-white/60 px-1.5 py-0.5 font-mono text-slate-700">demo</code>
        </p>
      </form>
    </main>
  );
}
