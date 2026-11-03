export type LatLng = { lat: number; lng: number };

// Offline fallbacks so the demo still renders if postcodes.io is unreachable.
const OUTCODE_FALLBACK: Record<string, LatLng> = {
  L6: { lat: 53.4219, lng: -2.9539 },
};

/** Public: centre of an outcode (district). Safe for locked view. */
export async function outcodeCentre(outcode: string): Promise<LatLng | null> {
  try {
    const res = await fetch(
      `https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`,
      { next: { revalidate: 60 * 60 * 24 * 30 }, signal: AbortSignal.timeout(2500) },
    );
    if (res.ok) {
      const j = await res.json();
      if (j?.result?.latitude) return { lat: j.result.latitude, lng: j.result.longitude };
    }
  } catch {
    /* fall through */
  }
  return OUTCODE_FALLBACK[outcode.toUpperCase()] ?? null;
}

/** Post-NDA only: exact point for a full postcode (postcode precision). */
export async function postcodePoint(postcode: string): Promise<LatLng | null> {
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
      { next: { revalidate: 60 * 60 * 24 * 30 }, signal: AbortSignal.timeout(2500) },
    );
    if (res.ok) {
      const j = await res.json();
      if (j?.result?.latitude) return { lat: j.result.latitude, lng: j.result.longitude };
    }
  } catch {
    /* fall through */
  }
  return null;
}
