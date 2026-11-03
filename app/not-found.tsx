import Link from "next/link";
import { Lock } from "lucide-react";
import { Aurora } from "@/components/aurora";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <Aurora />
      <div className="glass-strong rise w-full max-w-md rounded-3xl p-8 text-center">
        <div className="btn-brand mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Deal Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This deal link is invalid or is no longer live.
        </p>
        <Link
          href="/"
          className="btn-brand mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold"
        >
          Return to Deal Room
        </Link>
      </div>
    </div>
  );
}
