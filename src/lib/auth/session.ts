/**
 * HMAC-signed session + magic-link tokens.
 *
 * Sprint 2 auth uses our own short token instead of Firebase Auth's session
 * cookies. Reasons documented in tasks/todo.md "ACTIVE SPRINT" section:
 *   - No transactional email provider integrated yet.
 *   - Firebase magic-link flow needs the client SDK to complete sign-in.
 *   - We want a real working flow today, swappable to Firebase Auth later.
 *
 * Token format: base64url(payload).base64url(signature)
 *   payload   = JSON { email, kind: "session" | "link", iat, exp }
 *   signature = HMAC-SHA256(payload, AUTH_SECRET)
 *
 * Cookie name: `acg_session` (HttpOnly, Secure in production, SameSite=Lax).
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authSecret } from "@/lib/env";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export { SESSION_COOKIE_NAME };
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days
const LINK_TTL_SECONDS = 60 * 10; // 10 minutes

export type TokenKind = "session" | "link";

export interface TokenPayload {
  email: string;
  kind: TokenKind;
  iat: number; // seconds since epoch
  exp: number;
}

// ─── base64url helpers (RFC 4648 §5) ─────────────────────
function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

// ─── Sign / verify ───────────────────────────────────────
function sign(payload: string): string {
  return b64url(createHmac("sha256", authSecret).update(payload).digest());
}

/** Mint a token. Email is normalized (lower-case, trimmed). */
export function createToken(email: string, kind: TokenKind): string {
  const now = Math.floor(Date.now() / 1000);
  const ttl = kind === "session" ? SESSION_TTL_SECONDS : LINK_TTL_SECONDS;
  const payload: TokenPayload = {
    email: email.trim().toLowerCase(),
    kind,
    iat: now,
    exp: now + ttl,
  };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = sign(body);
  return `${body}.${sig}`;
}

/**
 * Verify a token. Returns the payload if valid + unexpired, otherwise null.
 * Uses timing-safe comparison to prevent signature-oracle attacks.
 */
export function verifyToken(token: string, expectedKind: TokenKind): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  // Recompute the expected signature and compare in constant time.
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(body).toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }

  if (payload.kind !== expectedKind) return null;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (typeof payload.email !== "string" || payload.email.length === 0) return null;

  return payload;
}

// ─── Cookie helpers (App Router — cookies() is async in Next 15+) ──
export async function setSessionCookie(email: string): Promise<void> {
  const token = createToken(email, "session");
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}

/** Read + verify the current session. Returns the payload or null. */
export async function getSession(): Promise<TokenPayload | null> {
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyToken(cookie.value, "session");
}
