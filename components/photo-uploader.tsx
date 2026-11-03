"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

type Item = { key: string; preview: string; url?: string; error?: string };

const MAX = 8;

export function PhotoUploader({ onChange }: { onChange: (urls: string[]) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);

  const commit = (next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
    onChange(next.filter((i) => i.url).map((i) => i.url!));
  };

  async function addFiles(files: FileList | File[]) {
    const room = MAX - itemsRef.current.length;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room);
    const fresh: Item[] = picked.map((f) => ({
      key: crypto.randomUUID(),
      preview: URL.createObjectURL(f),
    }));
    commit([...itemsRef.current, ...fresh]);

    await Promise.all(
      picked.map(async (file, n) => {
        const key = fresh[n].key;
        const fd = new FormData();
        fd.append("file", file);
        let patch: Partial<Item>;
        try {
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const j = await res.json();
          patch = res.ok ? { url: j.url } : { error: j.error ?? "Upload failed" };
        } catch {
          patch = { error: "Upload failed" };
        }
        commit(itemsRef.current.map((i) => (i.key === key ? { ...i, ...patch } : i)));
      }),
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-6 text-center text-sm transition ${
          drag ? "border-brand bg-brand/10" : "border-white/80 bg-white/40 hover:bg-white/60"
        }`}
      >
        <ImagePlus className="h-6 w-6 text-slate-400" />
        <span className="font-medium text-slate-700">Drop photos or click to upload</span>
        <span className="text-xs text-slate-500">Up to {MAX} · JPG, PNG, WebP · 8MB each</span>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {items.map((i) => (
            <div key={i.key} className="relative aspect-square overflow-hidden rounded-lg bg-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.preview} alt="" className="h-full w-full object-cover" />
              {!i.url && !i.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              {i.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-rose-100/90 p-1 text-center text-[10px] font-medium text-rose-700">
                  {i.error}
                </div>
              )}
              <button
                type="button"
                aria-label="Remove photo"
                onClick={(e) => {
                  e.stopPropagation();
                  commit(itemsRef.current.filter((x) => x.key !== i.key));
                }}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
