import { NextResponse } from "next/server";
import { z } from "zod";
import { setSourcerSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const Body = z.object({ passcode: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Passcode required" }, { status: 400 });

  const expected =
    process.env.SOURCER_PASSCODE ?? (process.env.NODE_ENV === "production" ? null : "demo");
  if (!expected || parsed.data.passcode !== expected) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }
  await setSourcerSession();
  return NextResponse.json({ ok: true });
}
