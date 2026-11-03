// Generates neutral placeholder "photos" for the demo deal into public/demo/.
// Replace these with real free stock photos (Unsplash) named photo-1.jpg ... and
// update db/seed-data.ts extensions - see README.
const fs = require("fs");
const path = require("path");
const out = path.join(process.cwd(), "public", "demo");
fs.mkdirSync(out, { recursive: true });

const W = 1600, H = 1000;
const wrap = (bg1, bg2, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>${body}
<text x="40" y="${H - 40}" font-family="Arial,sans-serif" font-size="34" fill="#fff" fill-opacity=".85">${label}</text></svg>`;

const windowEl = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#dbeafe" stroke="#f8fafc" stroke-width="10"/><line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#f8fafc" stroke-width="6"/><line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke="#f8fafc" stroke-width="6"/>`;

const terrace = (x, brick) => `
<rect x="${x}" y="260" width="460" height="560" fill="${brick}"/>
<polygon points="${x - 20},260 ${x + 230},120 ${x + 480},260" fill="#475569"/>
${windowEl(x + 60, 320, 140, 180)}${windowEl(x + 260, 320, 140, 180)}
${windowEl(x + 60, 580, 140, 160)}
<rect x="${x + 280}" y="560" width="110" height="260" fill="#1e3a5f"/><circle cx="${x + 372}" cy="700" r="7" fill="#fbbf24"/>`;

const files = {
  1: wrap("#93c5fd", "#e2e8f0", `<rect y="800" width="${W}" height="200" fill="#64748b"/>${terrace(100, "#9a3412")}${terrace(580, "#b45309")}${terrace(1060, "#9a3412")}`, "Front elevation"),
  2: wrap("#fde68a", "#fef3c7", `<rect y="700" width="${W}" height="300" fill="#a16207"/><rect x="200" y="520" width="700" height="220" rx="40" fill="#475569"/><rect x="240" y="460" width="620" height="120" rx="40" fill="#64748b"/>${windowEl(1000, 200, 400, 360)}<rect x="1000" y="640" width="380" height="60" fill="#92400e"/>`, "Living room"),
  3: wrap("#e2e8f0", "#cbd5e1", `<rect y="720" width="${W}" height="280" fill="#94a3b8"/><rect x="120" y="300" width="1360" height="120" fill="#f1f5f9"/><rect x="120" y="480" width="1360" height="240" fill="#1e293b"/><rect x="120" y="440" width="1360" height="40" fill="#e2e8f0"/><circle cx="500" cy="590" r="50" fill="#475569"/><circle cx="700" cy="590" r="50" fill="#475569"/>`, "Kitchen"),
  4: wrap("#bfdbfe", "#e0f2fe", `<rect y="760" width="${W}" height="240" fill="#cbd5e1"/><rect x="300" y="520" width="520" height="220" rx="110" fill="#f8fafc" stroke="#94a3b8" stroke-width="8"/><rect x="1000" y="200" width="300" height="520" fill="#f1f5f9" stroke="#94a3b8" stroke-width="8"/><circle cx="1150" cy="330" r="70" fill="#bfdbfe"/>`, "Bathroom"),
  5: wrap("#ddd6fe", "#ede9fe", `<rect y="740" width="${W}" height="260" fill="#a1887f"/><rect x="300" y="480" width="800" height="260" rx="30" fill="#e2e8f0"/><rect x="300" y="400" width="800" height="120" rx="30" fill="#c7d2fe"/>${windowEl(1180, 220, 280, 340)}`, "Bedroom 1"),
  6: wrap("#fecdd3", "#ffe4e6", `<rect y="740" width="${W}" height="260" fill="#a1887f"/><rect x="200" y="540" width="520" height="200" rx="26" fill="#e2e8f0"/><rect x="900" y="400" width="360" height="340" fill="#78350f"/>${windowEl(1330, 260, 200, 280)}`, "Bedroom 2"),
  7: wrap("#bbf7d0", "#dcfce7", `<rect y="700" width="${W}" height="300" fill="#4d7c0f"/><rect x="0" y="560" width="${W}" height="180" fill="#9a3412"/><rect x="0" y="540" width="${W}" height="30" fill="#7c2d12"/><rect x="600" y="760" width="400" height="200" fill="#a8a29e"/>`, "Rear yard"),
};

for (const [n, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(out, `photo-${n}.svg`), svg);
}
console.log("wrote", Object.keys(files).length, "placeholder photos");
