import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, LogOut, Plus } from "lucide-react";
import { isSourcer } from "@/lib/auth";
import { Aurora } from "@/components/aurora";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isSourcer())) redirect("/login");
  return (
    <div className="relative min-h-screen pb-14">
      <Aurora />
      <nav className="glass-strong sticky top-0 z-30 !rounded-none !border-x-0 !border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-slate-900">
            <span className="btn-brand flex h-8 w-8 items-center justify-center rounded-xl">
              <Building2 className="h-4 w-4" />
            </span>
            <span>
              Deal Room <span className="font-normal text-slate-500">· Sourcer Portal</span>
            </span>
          </Link>
          <div className="flex items-center gap-2.5 text-sm">
            <Link
              href="/dashboard/deals/new"
              className="btn-brand inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-medium"
            >
              <Plus className="h-4 w-4" /> New deal
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-slate-600 hover:text-slate-900">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-brand via-accent to-brand" />
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
