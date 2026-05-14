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
 */

import type { RentalDuration, Trailer } from "@/types/models";
import { trailers } from "@/lib/data/trailers";

// TODO(owner): confirm with tax accountant — Bexar County combined rate.
const TAX_RATE = 0.0825;

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

function rateForDuration(trailer: Trailer, duration: RentalDuration): number {
  switch (duration) {
    case 4:
      return trailer.pricing.rate4h;
    case 12:
      return trailer.pricing.rate12h;
    case 24:
      return trailer.pricing.rate24h;
    case 36:
      return trailer.pricing.rate36h;
  }
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
  const rentalDollars = rateForDuration(trailer, duration);
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
