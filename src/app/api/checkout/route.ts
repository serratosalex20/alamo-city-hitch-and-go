/**
 * POST /api/checkout
 *
 * Creates two Stripe PaymentIntents for a booking:
 *   1. Rental + tax — capture_method: 'automatic', confirmed by the client
 *      with stripe.js when the customer submits the card form.
 *   2. Security deposit — capture_method: 'manual', pre-authorized only.
 *      Captured later by admin if there's damage; canceled to release
 *      the hold otherwise. Matches rental agreement §5.2.
 *
 * Stub mode (no STRIPE_SECRET_KEY): returns synthetic intent IDs and a
 * fake client secret so the booking wizard's StepPayment can complete
 * its happy path without a live Stripe account.
 *
 * Auth: this route is intentionally NOT session-protected — checkout is
 * a pre-account event. The booking's email is the identity, and the
 * confirmation step fires /api/auth/send-link to give the user dashboard
 * access via magic link.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { calculatePrice, formatUsd } from "@/lib/booking/pricing";
import { getStripe, hasStripe } from "@/lib/stripe/server";
import type { RentalDuration } from "@/types/models";

const Body = z.object({
  trailerId: z.string().min(1, "Missing trailerId"),
  duration: z.union([z.literal(4), z.literal(12), z.literal(24), z.literal(36)]),
  email: z.string().email("Enter a valid email address."),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

interface CheckoutResponse {
  ok: true;
  mode: "stub" | "real";
  rental: { paymentIntentId: string; clientSecret: string; amountCents: number };
  deposit: { paymentIntentId: string; clientSecret: string; amountCents: number };
  display: {
    rental: string;
    deposit: string;
    tax: string;
    total: string;
  };
}

export async function POST(request: Request) {
  // ─── Parse + validate ───
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues[0]?.message : "Invalid request body.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  // ─── Compute prices server-side (never trust the client) ───
  let quote;
  try {
    quote = calculatePrice(body.trailerId, body.duration as RentalDuration);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Pricing failed." },
      { status: 400 },
    );
  }

  // ─── Stub mode: synthesize ───
  if (!hasStripe) {
    const stubId = `pi_stub_${Date.now().toString(36)}`;
    const response: CheckoutResponse = {
      ok: true,
      mode: "stub",
      rental: {
        paymentIntentId: `${stubId}_rental`,
        clientSecret: `${stubId}_rental_secret_stub`,
        amountCents: quote.totalCents,
      },
      deposit: {
        paymentIntentId: `${stubId}_deposit`,
        clientSecret: `${stubId}_deposit_secret_stub`,
        amountCents: quote.depositCents,
      },
      display: {
        rental: formatUsd(quote.rentalCents),
        deposit: formatUsd(quote.depositCents),
        tax: formatUsd(quote.taxCents),
        total: formatUsd(quote.totalCents),
      },
    };
    console.log(
      `[checkout] STUB MODE — booking ${body.email} ` +
        `→ rental=${response.display.rental} deposit=${response.display.deposit}`,
    );
    return NextResponse.json(response);
  }

  // ─── Real mode ───
  const stripe = getStripe();
  if (!stripe) {
    // Belt-and-suspenders: hasStripe was true but getStripe returned null.
    return NextResponse.json(
      { ok: false, error: "Stripe is configured but failed to initialize." },
      { status: 500 },
    );
  }

  try {
    // Find or create a Stripe Customer keyed by email so repeat renters
    // accumulate history under one record.
    const existing = await stripe.customers.list({ email: body.email, limit: 1 });
    const customer =
      existing.data[0] ??
      (await stripe.customers.create({
        email: body.email,
        name: `${body.firstName} ${body.lastName}`,
        metadata: { trailerId: body.trailerId },
      }));

    const rental = await stripe.paymentIntents.create({
      amount: quote.totalCents,
      currency: "usd",
      customer: customer.id,
      capture_method: "automatic",
      description: `Trailer rental ${body.duration}h — ${body.trailerId}`,
      metadata: { trailerId: body.trailerId, duration: String(body.duration), kind: "rental" },
    });

    const deposit = await stripe.paymentIntents.create({
      amount: quote.depositCents,
      currency: "usd",
      customer: customer.id,
      capture_method: "manual",
      description: `Security deposit (hold) — ${body.trailerId}`,
      metadata: { trailerId: body.trailerId, kind: "deposit" },
    });

    const response: CheckoutResponse = {
      ok: true,
      mode: "real",
      rental: {
        paymentIntentId: rental.id,
        clientSecret: rental.client_secret ?? "",
        amountCents: quote.totalCents,
      },
      deposit: {
        paymentIntentId: deposit.id,
        clientSecret: deposit.client_secret ?? "",
        amountCents: quote.depositCents,
      },
      display: {
        rental: formatUsd(quote.rentalCents),
        deposit: formatUsd(quote.depositCents),
        tax: formatUsd(quote.taxCents),
        total: formatUsd(quote.totalCents),
      },
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Payment setup failed.",
      },
      { status: 502 },
    );
  }
}
