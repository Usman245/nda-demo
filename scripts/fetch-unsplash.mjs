// Downloads real Unsplash photos for the demo deal via the OFFICIAL Unsplash API.
//
//   1. Create a free app at https://unsplash.com/developers and copy the Access Key
//   2. Put UNSPLASH_ACCESS_KEY=... in .env.local
//   3. npm run photos:fetch      (then delete .data/ to re-seed the local DB)
//
// Writes public/demo/photo-1.jpg ... photo-7.jpg and public/demo/credits.json.
// Photos are used under the Unsplash License (free for commercial use, attribution optional).
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const key = process.env.UNSPLASH_ACCESS_KEY;
if (!key) {
  console.error("Missing UNSPLASH_ACCESS_KEY (add it to .env.local).");
  process.exit(1);
}

const QUERIES = [
  "terraced house brick street england",
  "living room sofa interior bright",
  "kitchen interior modern white",
  "bathroom interior modern",
  "bedroom interior cosy",
  "small bedroom interior",
  "terrace house back garden",
];

const headers = { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
const outDir = path.join(process.cwd(), "public", "demo");
fs.mkdirSync(outDir, { recursive: true });

const used = new Set();
const credits = [];

for (let n = 0; n < QUERIES.length; n++) {
  const q = QUERIES[n];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&orientation=landscape&per_page=10`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`Search failed for "${q}": ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const { results } = await res.json();
  const pick = results.find((r) => !used.has(r.id));
  if (!pick) {
    console.error(`No result for "${q}"`);
    process.exit(1);
  }
  used.add(pick.id);

  // Required by the API guidelines: register the download.
  await fetch(pick.links.download_location, { headers }).catch(() => {});

  const img = await fetch(`${pick.urls.raw}&w=1600&q=80&fm=jpg&fit=max`);
  fs.writeFileSync(path.join(outDir, `photo-${n + 1}.jpg`), Buffer.from(await img.arrayBuffer()));
  credits.push({
    file: `photo-${n + 1}.jpg`,
    query: q,
    photographer: pick.user.name,
    page: pick.links.html,
  });
  console.log(`photo-${n + 1}.jpg  ${pick.user.name}  ${pick.links.html}`);
}

fs.writeFileSync(path.join(outDir, "credits.json"), JSON.stringify(credits, null, 2));
console.log("Done.");
