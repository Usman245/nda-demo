/**
 * Tiled diagonal watermark as an SVG data-URI, used as a CSS background on a
 * pointer-events:none overlay. Opacity is baked into the SVG (~4%).
 */
export function watermarkSvg(email: string) {
  const safe = email.replace(/[<>&"']/g, "");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">` +
    `<text x="160" y="90" text-anchor="middle" transform="rotate(-25 160 90)" ` +
    `font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#000" fill-opacity="0.06">` +
    `${safe}</text></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}
