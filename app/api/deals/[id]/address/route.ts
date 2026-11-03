import { NextResponse } from "next/server";
import { getBuyerSession } from "@/lib/auth";
import { getLockedAddress } from "@/lib/deals";

// Fallback only - the main unlock happens server-side in /d/[slug]/page.tsx.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getBuyerSession(id);
  if (!session) return NextResponse.json({ error: "NDA required" }, { status: 403 });
  const address = await getLockedAddress(id);
  if (!address) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(address, { headers: { "Cache-Control": "private, no-store" } });
}
