import type Stripe from "stripe";
import { DOCUMENT_DEADLINE_HOURS } from "@/lib/booking/schedule";
import { getBooking, updateBooking } from "@/lib/booking/repository";

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
