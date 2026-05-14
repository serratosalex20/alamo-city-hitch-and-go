/**
 * Next.js middleware — route protection for /account/* and /admin/*.
 *
 * Runs on every matched request. We only check **cookie presence + format**
 * here, not the HMAC signature, because middleware runs on the Edge runtime
 * (when deployed on Vercel) and Node's `crypto` module is not available
 * there. The route handler (e.g. /account/page.tsx) performs full
 * verification via getSession() in the Node runtime.
 *
 * That's a conservative two-stage check:
 *   1. Middleware: cookie absent → redirect to /sign-in. Cookie present
 *      with valid shape → let through.
 *   2. Page/API: verifyToken() in Node — only here do we trust the email.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

function looksLikeOurToken(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  // base64url alphabet only, both parts non-empty.
  const ok = (s: string) => s.length > 0 && /^[A-Za-z0-9_-]+$/.test(s);
  return ok(parts[0]) && ok(parts[1]);
}

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (looksLikeOurToken(cookie)) return NextResponse.next();

  // Unauthenticated: bounce to /sign-in, remembering where they were headed.
  const url = request.nextUrl.clone();
  const next = url.pathname + url.search;
  url.pathname = "/sign-in";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
