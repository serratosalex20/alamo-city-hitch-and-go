import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "acg_checkout_";
export function newCheckoutProof() { return randomBytes(32).toString("hex"); }
export function hashCheckoutProof(proof: string) {
  return createHash("sha256").update(proof).digest("hex");
}
export function matchesCheckoutProof(hash: string | undefined, proof: string | undefined) {
  if (!hash || !proof || !/^[a-f0-9]{64}$/.test(hash) || !/^[a-f0-9]{64}$/.test(proof)) return false;
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(hashCheckoutProof(proof), "hex"));
}
export async function readCheckoutProof(id: string) {
  return (await cookies()).get(`${COOKIE_PREFIX}${id}`)?.value;
}
export async function saveCheckoutProof(id: string, proof: string) {
  (await cookies()).set(`${COOKIE_PREFIX}${id}`, proof, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/api", maxAge: 60 * 60,
  });
}
export async function hasCheckoutProof(booking: { id: string; checkoutAccessHash?: string }) {
  return matchesCheckoutProof(booking.checkoutAccessHash, await readCheckoutProof(booking.id));
}
