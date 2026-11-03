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

  // 1. If Vercel Blob token is configured, use Vercel Blob (CDN storage)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`deals/${name}`, file, { access: "public", addRandomSuffix: false });
      return NextResponse.json({ url: blob.url });
    } catch (err) {
      console.error("Vercel Blob upload failed, falling back:", err);
    }
  }

  // 2. If running locally (not on Vercel), store to local disk
  if (!process.env.VERCEL) {
    try {
      const dir = path.join(process.cwd(), ".data", "uploads");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
      return NextResponse.json({ url: `/uploads/${name}` });
    } catch (err) {
      console.error("Local file write failed:", err);
    }
  }

  // 3. Fallback on Vercel when BLOB_READ_WRITE_TOKEN is not yet connected:
  // Convert image to a base64 Data URL so photo uploads still work seamlessly without failing!
  if (file.size <= 4 * 1024 * 1024) {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ url: dataUrl });
  }

  return NextResponse.json(
    { error: "Connect Vercel Blob in your Vercel Dashboard > Storage tab to upload photos over 4MB." },
    { status: 400 }
  );
}
