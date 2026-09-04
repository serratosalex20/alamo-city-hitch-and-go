import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculatePrice, formatUsd } from "@/lib/booking/pricing";
import {
  CHECKOUT_HOLD_MINUTES,
  buildRentalSchedule,
} from "@/lib/booking/schedule";
import {
  BookingConflictError,
  BookingPersistenceError,
  createBookingHold,
  getBooking,
  updateBooking,
} from "@/lib/booking/repository";
import { checkoutSchema } from "@/lib/booking/validation";
import { trailers } from "@/lib/data/trailers";
import { isDemoEnvironment, isProductionBookingReady, stripePublishableKey } from "@/lib/env";
import { getStripe, hasStripe } from "@/lib/stripe/server";
import type { Booking } from "@/types/models";

function displayQuote(quote: ReturnType<typeof calculatePrice>) {
  return {
    rental: formatUsd(quote.rentalCents),
    deposit: formatUsd(quote.depositCents),
    tax: formatUsd(quote.taxCents),
    total: formatUsd(quote.totalCents),
  };
}

export async function POST(request: Request) {
  let input: z.infer<typeof checkoutSchema>;
  try {
    input = checkoutSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid checkout.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  if (!isDemoEnvironment && !isProductionBookingReady) {
    return NextResponse.json(
      { ok: false, error: "Online checkout is temporarily unavailable. Please call us to book." },
      { status: 503 },
    );
  }

  const trailer = trailers.find((item) => item.id === input.trailerId);
  if (!trailer || trailer.status !== "available") {
    return NextResponse.json(
      { ok: false, error: "This trailer is not currently available to book." },
      { status: 400 },
    );
  }

  try {
    const quote = calculatePrice(input.trailerId, input.duration);
    const schedule = buildRentalSchedule(input.date, input.time, input.duration);
    const now = new Date();
    const checkoutExpires = new Date(now.getTime() + CHECKOUT_HOLD_MINUTES * 60 * 1000);
    const bookingId = input.checkoutKey;
    const booking: Booking = {
      id: bookingId,
      schemaVersion: 2,
      checkoutKey: input.checkoutKey,
      customerEmail: input.email,
      customer: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        address: input.address,
        referralSource: input.referralSource,
        ...(input.referralDetail ? { referralDetail: input.referralDetail } : {}),
      },
      towVehicle: input.towVehicle,
      trailerId: trailer.id,
      trailerName: trailer.name,
      unitId: `${trailer.slug.toUpperCase()}-01`,
      status: "pending_payment",
      fulfillmentType: "pickup",
      duration: input.duration,
      ...schedule,
      checkoutExpiresAt: checkoutExpires.toISOString(),
      checkoutExpiresAtMs: checkoutExpires.getTime(),
      policiesAcceptedAt: now.toISOString(),
      extensions: [],
      rentalSubtotal: quote.rentalCents,
      taxAmount: quote.taxCents,
      rentalTotal: quote.totalCents,
      depositAmount: quote.depositCents,
      paymentStatus: "pending",
      depositStatus: "not_requested",
      agreementStatus: "not_started",
      identityStatus: "not_started",
      insuranceStatus: "not_uploaded",
      preInspectionPhotos: [],
      postInspectionPhotos: [],
      auditTrail: [
        {
          action: "checkout_hold_created",
          actor: input.email,
          createdAt: now.toISOString(),
          createdAtMs: now.getTime(),
        },
      ],
      createdAt: now.toISOString(),
      createdAtMs: now.getTime(),
      updatedAt: now.toISOString(),
      updatedAtMs: now.getTime(),
    };

    const held = await createBookingHold(
      booking,
      trailer.inventoryCount + trailer.virtualBoost,
    );

    if (!hasStripe) {
      if (!isDemoEnvironment) throw new Error("Stripe is not configured.");
      const paymentIntentId = held.rentalPaymentIntentId ?? `pi_demo_${randomUUID()}`;
      if (!held.rentalPaymentIntentId) {
        await updateBooking(
          held.id,
          { rentalPaymentIntentId: paymentIntentId },
          { action: "demo_payment_initialized", actor: "development-demo" },
        );
      }
      return NextResponse.json({
        ok: true,
        mode: "demo" as const,
        bookingId: held.id,
        rental: {
          paymentIntentId,
          clientSecret: "",
          amountCents: quote.totalCents,
        },
        display: displayQuote(quote),
        checkoutExpiresAt: held.checkoutExpiresAt,
      });
    }

    const stripe = getStripe();
    if (!stripe || !stripePublishableKey) throw new Error("Stripe failed to initialize.");

    let customerId = held.stripeCustomerId;
    if (!customerId) {
      const existingCustomers = await stripe.customers.list({ email: input.email, limit: 1 });
      const customer =
        existingCustomers.data[0] ??
        (await stripe.customers.create(
          {
            email: input.email,
            name: `${input.firstName} ${input.lastName}`,
            phone: input.phone,
            address: {
              line1: input.address.street,
              city: input.address.city,
              state: input.address.state,
              postal_code: input.address.zip,
              country: "US",
            },
            metadata: { latestBookingId: held.id },
          },
          { idempotencyKey: `customer-${held.id}` },
        ));
      customerId = customer.id;
    }

    const rental = held.rentalPaymentIntentId
      ? await stripe.paymentIntents.retrieve(held.rentalPaymentIntentId)
      : await stripe.paymentIntents.create(
          {
            amount: quote.totalCents,
            currency: "usd",
            customer: customerId,
            payment_method_types: ["card"],
            setup_future_usage: "off_session",
            receipt_email: input.email,
            description: `${trailer.name} — ${input.duration} rental`,
            metadata: {
              bookingId: held.id,
              trailerId: trailer.id,
              duration: input.duration,
              kind: "rental",
            },
          },
          { idempotencyKey: `rental-${held.id}` },
        );

    await updateBooking(
      held.id,
      {
        stripeCustomerId: customerId,
        rentalPaymentIntentId: rental.id,
      },
      { action: "rental_payment_initialized", actor: input.email },
    );

    return NextResponse.json({
      ok: true,
      mode: "real" as const,
      bookingId: held.id,
      publishableKey: stripePublishableKey,
      rental: {
        paymentIntentId: rental.id,
        clientSecret: rental.client_secret ?? "",
        amountCents: quote.totalCents,
      },
      display: displayQuote(quote),
      checkoutExpiresAt: held.checkoutExpiresAt,
    });
  } catch (error) {
    const status =
      error instanceof BookingConflictError ? 409 : error instanceof BookingPersistenceError ? 503 : 502;
    console.error("[checkout]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Checkout failed." },
      { status },
    );
  }
}

const releaseCheckoutSchema = z.object({
  checkoutKey: z.string().uuid("Invalid checkout."),
});

export async function DELETE(request: Request) {
  let checkoutKey: string;
  try {
    checkoutKey = releaseCheckoutSchema.parse(await request.json()).checkoutKey;
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid checkout.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    const booking = await getBooking(checkoutKey);
    if (!booking) return NextResponse.json({ ok: true });
    if (
      booking.checkoutKey !== checkoutKey ||
      booking.status !== "pending_payment" ||
      booking.paymentStatus !== "pending"
    ) {
      return NextResponse.json(
        { ok: false, error: "This checkout can no longer be changed." },
        { status: 409 },
      );
    }

    if (hasStripe && booking.rentalPaymentIntentId) {
      const stripe = getStripe();
      if (!stripe) throw new Error("Stripe failed to initialize.");
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.rentalPaymentIntentId);
      if (paymentIntent.status === "succeeded" || paymentIntent.status === "processing") {
        return NextResponse.json(
          { ok: false, error: "Payment is already processing and the checkout cannot be edited." },
          { status: 409 },
        );
      }
      if (paymentIntent.status !== "canceled") {
        await stripe.paymentIntents.cancel(
          booking.rentalPaymentIntentId,
          {},
          { idempotencyKey: `checkout-release-${booking.id}` },
        );
      }
    }

    const now = new Date();
    await updateBooking(
      booking.id,
      {
        status: "cancelled",
        paymentStatus: "failed",
        checkoutExpiresAt: now.toISOString(),
        checkoutExpiresAtMs: now.getTime(),
      },
      { action: "checkout_hold_released", actor: booking.customerEmail },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[checkout-release]", error);
    return NextResponse.json(
      { ok: false, error: "We could not release this checkout. Please try again." },
      { status: 502 },
    );
  }
}
