import type Stripe from "stripe";
import { getStripe, hasStripe } from "@/lib/stripe/server";
import { isDemoEnvironment } from "@/lib/env";
import { getBooking, updateBooking } from "@/lib/booking/repository";
import type { Booking, DepositMethod } from "@/types/models";

function usesRefundableCharge(booking: Booking): boolean {
  return booking.duration === "oneWeek" || booking.duration === "twoWeeks";
}

function captureDeadline(paymentIntent: Stripe.PaymentIntent) {
  if (!paymentIntent.latest_charge || typeof paymentIntent.latest_charge === "string") return {};
  const card = paymentIntent.latest_charge.payment_method_details?.card;
  const timestamp = card?.capture_before;
  return timestamp
    ? { depositCaptureBefore: new Date(timestamp * 1000).toISOString(), depositCaptureBeforeMs: timestamp * 1000 }
    : {};
}

export async function syncDepositPayment(booking: Booking, paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata.bookingId !== booking.id || paymentIntent.metadata.kind !== "deposit") {
    throw new Error("Deposit payment does not match this booking.");
  }
  const method = paymentIntent.metadata.depositMethod as DepositMethod;
  if (paymentIntent.status === "requires_capture") {
    if (booking.depositStatus === "authorized" && booking.status === "ready_for_pickup") {
      return booking;
    }
    return updateBooking(
      booking.id,
      {
        depositMethod: "authorization",
        depositStatus: "authorized",
        status: "ready_for_pickup",
        ...captureDeadline(paymentIntent),
      },
      { action: "deposit_authorized", actor: "stripe" },
    );
  }
  if (paymentIntent.status === "succeeded") {
    if (booking.depositStatus === "charged" && booking.status === "ready_for_pickup") {
      return booking;
    }
    return updateBooking(
      booking.id,
      {
        depositMethod: method === "refundable_charge" ? "refundable_charge" : booking.depositMethod,
        depositStatus: "charged",
        status: "ready_for_pickup",
      },
      { action: "refundable_deposit_charged", actor: "stripe" },
    );
  }
  if (
    paymentIntent.status === "requires_action" ||
    paymentIntent.status === "requires_confirmation" ||
    paymentIntent.status === "requires_payment_method" ||
    paymentIntent.status === "processing"
  ) {
    if (booking.depositStatus === "requires_action" && booking.status === "deposit_action_required") {
      return booking;
    }
    return updateBooking(
      booking.id,
      { depositMethod: method, depositStatus: "requires_action", status: "deposit_action_required" },
      { action: "deposit_customer_action_required", actor: "stripe" },
    );
  }
  return updateBooking(
    booking.id,
    { depositMethod: method, depositStatus: "failed" },
    { action: `deposit_${paymentIntent.status}`, actor: "stripe" },
  );
}

export async function requestDeposit(bookingId: string, actor: string) {
  const booking = await getBooking(bookingId);
  if (!booking) throw new Error("Booking not found.");
  if (!booking.stripeCustomerId || !booking.stripePaymentMethodId) {
    throw new Error("The saved payment method is missing.");
  }
  if (!hasStripe) {
    if (!isDemoEnvironment) throw new Error("Stripe is unavailable.");
    const method: DepositMethod = usesRefundableCharge(booking) ? "refundable_charge" : "authorization";
    return updateBooking(
      bookingId,
      {
        depositPaymentIntentId: `pi_demo_deposit_${bookingId}`,
        depositMethod: method,
        depositStatus: method === "authorization" ? "authorized" : "charged",
        status: "ready_for_pickup",
      },
      { action: "demo_deposit_ready", actor },
    );
  }

  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is unavailable.");
  if (booking.depositPaymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(booking.depositPaymentIntentId, {
      expand: ["latest_charge"],
    });
    return syncDepositPayment(booking, existing);
  }

  const method: DepositMethod = usesRefundableCharge(booking) ? "refundable_charge" : "authorization";
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: booking.depositAmount,
      currency: "usd",
      customer: booking.stripeCustomerId,
      payment_method: booking.stripePaymentMethodId,
      payment_method_types: ["card"],
      capture_method: method === "authorization" ? "manual" : "automatic",
      confirm: true,
      off_session: true,
      error_on_requires_action: false,
      description:
        method === "authorization"
          ? `Security deposit authorization — ${booking.trailerName}`
          : `Refundable security deposit — ${booking.trailerName}`,
      metadata: { bookingId, kind: "deposit", depositMethod: method },
      expand: ["latest_charge"],
    },
    { idempotencyKey: `deposit-${bookingId}` },
  );
  const withIntent = await updateBooking(
    bookingId,
    { depositPaymentIntentId: paymentIntent.id, depositMethod: method },
    { action: "deposit_requested", actor },
  );
  return syncDepositPayment(withIntent, paymentIntent);
}

export async function releaseDeposit(bookingId: string, actor: string, note?: string) {
  const booking = await getBooking(bookingId);
  if (!booking?.depositPaymentIntentId || !booking.depositMethod) throw new Error("Deposit not found.");
  if (!hasStripe) {
    if (!isDemoEnvironment) throw new Error("Stripe is unavailable.");
  } else {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is unavailable.");
    if (booking.depositMethod === "authorization") {
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.depositPaymentIntentId);
      if (paymentIntent.status === "requires_capture") {
        await stripe.paymentIntents.cancel(booking.depositPaymentIntentId);
      }
    } else {
      await stripe.refunds.create(
        { payment_intent: booking.depositPaymentIntentId },
        { idempotencyKey: `deposit-release-${bookingId}` },
      );
    }
  }
  const now = new Date().toISOString();
  return updateBooking(
    bookingId,
    { depositStatus: "released", depositResolvedAt: now, depositAmountRetained: 0, status: "completed" },
    { action: "deposit_release_initiated", actor, note },
  );
}

export async function captureDeposit(
  bookingId: string,
  amountCents: number,
  actor: string,
  note: string,
) {
  const booking = await getBooking(bookingId);
  if (!booking?.depositPaymentIntentId || !booking.depositMethod) throw new Error("Deposit not found.");
  if (!Number.isInteger(amountCents) || amountCents <= 0 || amountCents > booking.depositAmount) {
    throw new Error("Enter an amount between $0.01 and the deposit amount.");
  }
  if (note.trim().length < 5) throw new Error("Add a clear inspection note for the retained amount.");

  if (!hasStripe) {
    if (!isDemoEnvironment) throw new Error("Stripe is unavailable.");
  } else {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is unavailable.");
    if (booking.depositMethod === "authorization") {
      await stripe.paymentIntents.capture(
        booking.depositPaymentIntentId,
        { amount_to_capture: amountCents },
        { idempotencyKey: `deposit-capture-${bookingId}-${amountCents}` },
      );
    } else if (amountCents < booking.depositAmount) {
      await stripe.refunds.create(
        {
          payment_intent: booking.depositPaymentIntentId,
          amount: booking.depositAmount - amountCents,
        },
        { idempotencyKey: `deposit-partial-refund-${bookingId}-${amountCents}` },
      );
    }
  }

  const now = new Date().toISOString();
  return updateBooking(
    bookingId,
    {
      depositStatus: amountCents < booking.depositAmount ? "partially_captured" : "captured",
      depositResolvedAt: now,
      depositAmountRetained: amountCents,
      status: "completed",
    },
    { action: "deposit_amount_retained", actor, note, amountCents },
  );
}
