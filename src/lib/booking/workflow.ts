import type Stripe from "stripe";
import { DOCUMENT_DEADLINE_HOURS } from "@/lib/booking/schedule";
import {
  BookingConflictError,
  completeRentalPaymentRecord,
  findBookingByPaymentIntent,
  getBooking,
  updateBooking,
} from "@/lib/booking/repository";
import { trailers } from "@/lib/data/trailers";
import { getStripe } from "@/lib/stripe/server";

import { bookingCheckoutTotal } from "@/lib/booking/pricing";

export class RentalPaymentRefundedError extends Error {}

function bookingCapacity(trailerId: string): number {
  const trailer = trailers.find((item) => item.id === trailerId);
  if (!trailer) throw new Error("Booking trailer is unavailable.");
  return trailer.inventoryCount + trailer.virtualBoost;
}

export async function markRentalPaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;
  if (!bookingId || paymentIntent.metadata.kind !== "rental") return null;

  const booking = await getBooking(bookingId);
  if (!booking) return null;
  if (paymentIntent.id !== booking.rentalPaymentIntentId ||
      paymentIntent.status !== "succeeded" || paymentIntent.currency !== "usd" ||
      paymentIntent.amount_received !== bookingCheckoutTotal(booking)) {
    throw new Error("Payment does not match the booking amount or has not succeeded.");
  }
  if (booking.paymentStatus === "succeeded") return booking;
  if (booking.paymentStatus === "refunded") {
    throw new RentalPaymentRefundedError(
      "This payment was refunded because the checkout hold was no longer valid.",
    );
  }

  const now = new Date();
  const documentsDue = new Date(
    now.getTime() + DOCUMENT_DEADLINE_HOURS * 60 * 60 * 1000,
  );
  const paymentMethodId =
    typeof paymentIntent.payment_method === "string"
      ? paymentIntent.payment_method
      : paymentIntent.payment_method?.id;

  try {
    return await completeRentalPaymentRecord({
      bookingId,
      paymentIntentId: paymentIntent.id,
      capacity: bookingCapacity(booking.trailerId),
      updates: {
        status: "pending_signature",
        paymentStatus: "succeeded",
        ...(booking.depositCollectedAtCheckout ? {
          depositStatus: "charged" as const,
          depositMethod: "refundable_charge" as const,
          depositPaymentIntentId: paymentIntent.id,
        } : {}),
        stripeCustomerId:
          typeof paymentIntent.customer === "string"
            ? paymentIntent.customer
            : paymentIntent.customer?.id,
        stripePaymentMethodId: paymentMethodId,
        documentsDueAt: documentsDue.toISOString(),
        documentsDueAtMs: documentsDue.getTime(),
      },
    });
  } catch (error) {
    if (!(error instanceof BookingConflictError)) throw error;
    const stripe = getStripe();
    if (!stripe) throw error;
    await stripe.refunds.create(
      { payment_intent: paymentIntent.id, reason: "requested_by_customer" },
      { idempotencyKey: `checkout-hold-refund-${bookingId}` },
    );
    const latest = await getBooking(bookingId);
    if (latest && latest.paymentStatus !== "refunded") {
      await updateBooking(
        bookingId,
        { status: "cancelled", paymentStatus: "refunded", ...(booking.depositCollectedAtCheckout ? { depositStatus: "released" as const } : {}) },
        {
          action: "rental_payment_refunded_after_hold_expired",
          actor: "stripe",
          note: error.message,
        },
      );
    }
    throw new RentalPaymentRefundedError(
      "The checkout hold expired or the time became unavailable. Your payment was refunded automatically.",
    );
  }
}

export async function markDemoRentalPaymentSucceeded(bookingId: string) {
  const booking = await getBooking(bookingId);
  if (!booking) throw new Error("Booking not found.");
  if (booking.paymentStatus === "succeeded") return booking;
  const now = new Date();
  const due = new Date(now.getTime() + DOCUMENT_DEADLINE_HOURS * 60 * 60 * 1000);
  return completeRentalPaymentRecord({
    bookingId,
    paymentIntentId: booking.rentalPaymentIntentId ?? `pi_demo_${bookingId}`,
    capacity: bookingCapacity(booking.trailerId),
    updates: {
      status: "pending_signature",
      paymentStatus: "succeeded",
      ...(booking.depositCollectedAtCheckout ? {
        depositStatus: "charged" as const,
        depositMethod: "refundable_charge" as const,
        depositPaymentIntentId: booking.rentalPaymentIntentId ?? `pi_demo_${bookingId}`,
      } : {}),
      stripeCustomerId: `cus_demo_${bookingId}`,
      stripePaymentMethodId: `pm_demo_${bookingId}`,
      documentsDueAt: due.toISOString(),
      documentsDueAtMs: due.getTime(),
    },
  });
}

export async function markPaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const booking = await findBookingByPaymentIntent(paymentIntent.id);
  if (!booking) return null;
  const kind = paymentIntent.metadata.kind;
  if (kind === "rental") {
    if (["failed", "succeeded", "refunded"].includes(booking.paymentStatus)) return booking;
    return updateBooking(
      booking.id,
      { paymentStatus: "failed" },
      { action: "rental_payment_failed", actor: "stripe", note: paymentIntent.last_payment_error?.message },
    );
  }
  if (kind === "deposit") {
    if (["failed", "authorized", "charged", "released", "captured", "partially_captured"].includes(booking.depositStatus)) return booking;
    if (!["confirmed", "deposit_action_required"].includes(booking.status)) return booking;
    return updateBooking(
      booking.id,
      { depositStatus: "failed", status: "confirmed" },
      { action: "deposit_payment_failed", actor: "stripe", note: paymentIntent.last_payment_error?.message },
      (current) => current.status === booking.status && current.depositStatus === booking.depositStatus,
    );
  }
  return booking;
}

export async function markPaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const booking = await findBookingByPaymentIntent(paymentIntent.id);
  if (!booking) return null;
  if (paymentIntent.metadata.kind === "deposit") {
    if (["released", "captured", "partially_captured"].includes(booking.depositStatus)) return booking;
    if (["completed", "cancelled"].includes(booking.status)) return booking;
    return updateBooking(
      booking.id,
      { depositStatus: "failed", status: ["active", "return_inspection"].includes(booking.status) ? booking.status : "confirmed" },
      { action: "deposit_authorization_expired_or_canceled", actor: "stripe" },
      (current) => current.status === booking.status && current.depositStatus === booking.depositStatus,
    );
  }
  if (paymentIntent.metadata.kind === "rental" && booking.paymentStatus !== "succeeded") {
    return updateBooking(
      booking.id,
      { paymentStatus: "failed", status: "cancelled" },
      { action: "rental_payment_canceled", actor: "stripe" },
    );
  }
  return booking;
}

export async function syncIdentityVerificationSession(
  verification: Stripe.Identity.VerificationSession,
) {
  const bookingId = verification.metadata.bookingId;
  if (!bookingId) return null;
  const booking = await getBooking(bookingId);
  if (!booking || booking.stripeIdentitySessionId !== verification.id) return null;
  if (verification.status === "verified") {
    if (booking.identityStatus === "verified") return booking;
    return updateBooking(
      bookingId,
      { identityStatus: "verified", identityVerifiedAt: new Date().toISOString(), status: "pending_insurance" },
      { action: "identity_verified", actor: "stripe" },
    );
  }
  if (verification.status === "requires_input" || verification.status === "canceled") {
    if (booking.identityStatus === verification.status) return booking;
    return updateBooking(
      bookingId,
      { identityStatus: verification.status },
      { action: `identity_${verification.status}`, actor: "stripe" },
    );
  }
  return booking;
}
