/**
 * Server-side Stripe initialization.
 *
 * Used in API routes for:
 *   - /api/checkout         — creates rental + deposit PaymentIntents
 *   - /api/webhooks/stripe  — verifies event signatures, handles updates
 *   - /api/admin/release-deposit (Sprint 3) — captures or cancels the deposit hold
 *
 * In STUB mode, `getStripe()` returns null and /api/checkout synthesizes
 * a fake PaymentIntent ID so the full booking flow works offline.
 */

import Stripe from "stripe";
import { stripeSecretKey, hasStripe } from "@/lib/env";

let cached: Stripe | null = null;

/**
 * Returns the server-side Stripe client, or null in stub mode.
 * Always import dynamically inside API route handlers — pinning a global
 * instance at module scope makes Next.js bundle Stripe into the edge runtime.
 */
export function getStripe(): Stripe | null {
  if (!hasStripe) return null;
  if (cached) return cached;
  // Intentionally omit `apiVersion` — let the installed Stripe SDK use its
  // bundled default. Pinning a literal here couples this file to a specific
  // SDK version and breaks the build whenever Stripe ships a new release.
  cached = new Stripe(stripeSecretKey as string, { typescript: true });
  return cached;
}

export { hasStripe };
