/**
 * Booking price calculation.
 *
 * Single source of truth for what gets charged on a booking. All dollar
 * amounts in the trailer data are integers (whole dollars); Stripe wants
 * integer cents on the PaymentIntent — this module converts at the
 * boundary so the rest of the app never touches floats.
 *
 * Texas state sales tax is computed at TAX_RATE on the rental fee only
 * (deposits are refundable holds, not taxable revenue). The 8.25% rate
 * is Bexar County's combined state + local sales tax — owner should
 * verify with their tax accountant before going live.
 *
 * Sprint 3.4 — Pricing & Block Restructure (replaces Sprint 3.3):
 *   - 3-day block retired; replaced by a 1-week block per owner direction.
 *   - 2-week block extended to 15 calendar days (1 free day baked in),
 *     so DURATION_HOURS.twoWeeks = 360 (was 336). availability + endTime
 *     math automatically deliver the extra day.
 *   - New pricing: $150 / $100 on 24' and 14'; 20' stays at $140 / $90
 *     as the discount option. $200 deposit across the fleet.
 *   - Late fee is a flat $100 (Option B from the Sprint 3.3 owner Q&A).
 *   - Cleaning fee: $100 if returned uncleaned.
 *   - Extension semantics now match block sizes (Half Day / Full Day /
 *     1 Week / 2 Weeks) rather than 4-hour micro-blocks. See Sprint 3.4b.
 */

import type { RentalDuration, Trailer } from "@/types/models";
import { trailers } from "@/lib/data/trailers";

// TODO(owner): confirm with tax accountant — Bexar County combined rate.
const TAX_RATE = 0.0825;

/**
 * Hours per rental-duration key. Used to compute
 * `endTime = startTime + DURATION_HOURS[duration]`.
 * twoWeeks = 360h (not 336) because the 2-week block ships with a free
 * day — the customer holds the trailer for 15 calendar days, not 14.
 */
export const DURATION_HOURS: Record<RentalDuration, number> = {
  halfDay: 12,
  fullDay: 24,
  oneWeek: 168,
  twoWeeks: 360,
};

/** Human-friendly labels for UI surfaces. Single source of truth. */
export const DURATION_LABELS: Record<RentalDuration, string> = {
  halfDay: "Half Day",
  fullDay: "Full Day",
  oneWeek: "1 Week",
  twoWeeks: "2 Weeks",
};

/** Short hour-marker for compact UI ("12h", "24h", "1w", "2w"). */
export const DURATION_SHORT: Record<RentalDuration, string> = {
  halfDay: "12h",
  fullDay: "24h",
  oneWeek: "1w",
  twoWeeks: "2w",
};

/** Ordered list — use this when rendering options in the UI. */
export const ALL_DURATIONS: RentalDuration[] = [
  "halfDay",
  "fullDay",
  "oneWeek",
  "twoWeeks",
];

/**
 * Flat late-return fee. Applies if the trailer is returned after the
 * scheduled return time without an approved extension. Per Sprint 3.3
 * owner decision (Option B): a single flat number is easier for customers
 * to remember than per-trailer half-day math.
 */
export const LATE_FEE_CENTS = 10000; // $100

/**
 * Cleaning fee. Charged if the trailer is returned in a soiled state
 * that requires more than ~15 minutes of cleanup time (trash, mud,
 * debris, manure, paint splatter, etc.). Defined in the rental agreement.
 */
export const CLEANING_FEE_CENTS = 10000; // $100

export interface PriceQuote {
  trailerId: string;
  duration: RentalDuration;
  rentalCents: number; // charged immediately
  depositCents: number; // pre-authorized, captured later if damages
  taxCents: number; // computed on rental only
  totalCents: number; // rentalCents + taxCents (NOT deposit — that's a hold)
}

function getTrailer(trailerId: string): Trailer {
  const t = trailers.find((x) => x.id === trailerId);
  if (!t) throw new Error(`Unknown trailerId: ${trailerId}`);
  return t;
}

/**
 * Compute the full price quote for a booking.
 * Pure function — same inputs always produce same outputs.
 */
export function calculatePrice(
  trailerId: string,
  duration: RentalDuration,
): PriceQuote {
  const trailer = getTrailer(trailerId);
  // Direct lookup — Trailer.pricing keys match RentalDuration values exactly.
  const rentalDollars = trailer.pricing[duration];
  const rentalCents = Math.round(rentalDollars * 100);
  const depositCents = Math.round(trailer.deposit * 100);
  const taxCents = Math.round(rentalCents * TAX_RATE);
  const totalCents = rentalCents + taxCents;

  return {
    trailerId,
    duration,
    rentalCents,
    depositCents,
    taxCents,
    totalCents,
  };
}

/** Human-friendly dollar formatter for display surfaces. */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
