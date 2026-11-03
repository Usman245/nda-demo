import { NextResponse } from "next/server";
import { clearSourcerSession } from "@/lib/auth";

export async function POST(req: Request) {
  await clearSourcerSession();
  return NextResponse.redirect(new URL("/login", req.url), 303);
}
