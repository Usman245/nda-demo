import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { isSourcer } from "@/lib/auth";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX = 8 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await isSourcer())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use JPG, PNG or WebP" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Max 8MB per photo" }, { status: 400 });

  const name = `${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`deals/${name}`, file, { access: "public", addRandomSuffix: false });
    return NextResponse.json({ url: blob.url });
  }

  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Set BLOB_READ_WRITE_TOKEN to enable photo uploads" },
      { status: 500 },
    );
  }

  // Local dev fallback: served by /uploads/[name]
  const dir = path.join(process.cwd(), ".data", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
