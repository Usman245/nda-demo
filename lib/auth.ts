import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SOURCER_COOKIE = "sourcer_session";
const buyerCookie = (dealId: string) => `buyer_${dealId}`;

function secret() {
  const s = process.env.JWT_SECRET?.trim();
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[WARN] JWT_SECRET environment variable is missing or shorter than 16 chars. Using fallback. Set JWT_SECRET in Vercel."
      );
      return new TextEncoder().encode(
        s || "fallback-secret-please-set-jwt-secret-in-vercel-production-32chars"
      );
    }
    return new TextEncoder().encode("dev-only-insecure-secret-change-me");
  }
  return new TextEncoder().encode(s);
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// ---------------- Sourcer ----------------

export async function setSourcerSession() {
  const token = await new SignJWT({ role: "sourcer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set(SOURCER_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSourcerSession() {
  (await cookies()).delete(SOURCER_COOKIE);
}

export async function isSourcer(): Promise<boolean> {
  const token = (await cookies()).get(SOURCER_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "sourcer";
  } catch {
    return false;
  }
}

// ---------------- Buyer (scoped per deal) ----------------

export type BuyerSession = { dealId: string; email: string; ndaId: string };

export async function setBuyerSession(s: BuyerSession) {
  const token = await new SignJWT({ dealId: s.dealId, email: s.email, ndaId: s.ndaId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(buyerCookie(s.dealId), token, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getBuyerSession(dealId: string): Promise<BuyerSession | null> {
  const token = (await cookies()).get(buyerCookie(dealId))?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.dealId !== dealId) return null;
    return {
      dealId,
      email: String(payload.email),
      ndaId: String(payload.ndaId),
    };
  } catch {
    return null;
  }
}
