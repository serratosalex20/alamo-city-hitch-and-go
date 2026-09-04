import type Stripe from "stripe";
import { DOCUMENT_DEADLINE_HOURS } from "@/lib/booking/schedule";
import { findBookingByPaymentIntent, getBooking, updateBooking } from "@/lib/booking/repository";

export async function markRentalPaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;
  if (!bookingId || paymentIntent.metadata.kind !== "rental") return null;

  const booking = await getBooking(bookingId);
  if (!booking) return null;
  if (booking.paymentStatus === "succeeded") return booking;

  const now = new Date();
  const documentsDue = new Date(
    now.getTime() + DOCUMENT_DEADLINE_HOURS * 60 * 60 * 1000,
  );
  const paymentMethodId =
    typeof paymentIntent.payment_method === "string"
      ? paymentIntent.payment_method
      : paymentIntent.payment_method?.id;

  return updateBooking(
    bookingId,
    {
      status: "pending_signature",
      paymentStatus: "succeeded",
      stripeCustomerId:
        typeof paymentIntent.customer === "string"
          ? paymentIntent.customer
          : paymentIntent.customer?.id,
      stripePaymentMethodId: paymentMethodId,
      documentsDueAt: documentsDue.toISOString(),
      documentsDueAtMs: documentsDue.getTime(),
    },
    { action: "rental_payment_succeeded", actor: "stripe" },
  );
}

export async function markDemoRentalPaymentSucceeded(bookingId: string) {
  const booking = await getBooking(bookingId);
  if (!booking) throw new Error("Booking not found.");
  if (booking.paymentStatus === "succeeded") return booking;
  const now = new Date();
  const due = new Date(now.getTime() + DOCUMENT_DEADLINE_HOURS * 60 * 60 * 1000);
  return updateBooking(
    bookingId,
    {
      status: "pending_signature",
      paymentStatus: "succeeded",
      stripeCustomerId: `cus_demo_${bookingId}`,
      stripePaymentMethodId: `pm_demo_${bookingId}`,
      documentsDueAt: due.toISOString(),
      documentsDueAtMs: due.getTime(),
    },
    { action: "demo_rental_payment_succeeded", actor: "development-demo" },
  );
}

export async function markPaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const booking = await findBookingByPaymentIntent(paymentIntent.id);
  if (!booking) return null;
  const kind = paymentIntent.metadata.kind;
  if (kind === "rental") {
    if (booking.paymentStatus === "failed") return booking;
    return updateBooking(
      booking.id,
      { paymentStatus: "failed" },
      { action: "rental_payment_failed", actor: "stripe", note: paymentIntent.last_payment_error?.message },
    );
  }
  if (kind === "deposit") {
    if (booking.depositStatus === "failed") return booking;
    return updateBooking(
      booking.id,
      { depositStatus: "failed", status: "confirmed" },
      { action: "deposit_payment_failed", actor: "stripe", note: paymentIntent.last_payment_error?.message },
    );
  }
  return booking;
}

export async function markPaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const booking = await findBookingByPaymentIntent(paymentIntent.id);
  if (!booking) return null;
  if (paymentIntent.metadata.kind === "deposit") {
    if (booking.depositStatus === "released") return booking;
    return updateBooking(
      booking.id,
      { depositStatus: "failed", status: booking.status === "return_inspection" ? "return_inspection" : "confirmed" },
      { action: "deposit_authorization_expired_or_canceled", actor: "stripe" },
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
