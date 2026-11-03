import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Local-dev photo storage only (production uses Vercel Blob URLs).
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const buf = await readFile(path.join(process.cwd(), ".data", "uploads", name));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[name.split(".").pop()!],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
