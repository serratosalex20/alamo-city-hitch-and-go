/**
 * POST /api/webhooks/stripe
 *
 * Receives Stripe webhook events. Verifies the signature against the
 * STRIPE_WEBHOOK_SECRET, then routes by event type.
 *
 * Sprint 2 handles the minimum set:
 *   - payment_intent.succeeded   — booking is paid; mark booking confirmed
 *   - payment_intent.canceled    — auth or rental canceled; reverse state
 *   - payment_intent.payment_failed — surface failure for retry
 *
 * Persisting these into Firestore is Phase 4 future work; for now we log
 * verified events to the server console so the wiring is in place when
 * Firestore arrives. Real keys are required to verify signatures — in
 * stub mode this route returns 501 because there's nothing to verify.
 *
 * IMPORTANT: this endpoint must consume the raw request body, not the
 * parsed JSON. Stripe's signature is over the bytes. Use request.text()
 * and pass the string to stripe.webhooks.constructEvent.
 */

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, hasStripe } from "@/lib/stripe/server";
import { stripeWebhookSecret } from "@/lib/env";

export async function POST(request: Request) {
  if (!hasStripe || !stripeWebhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Stripe webhook endpoint is not configured. " +
          "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env.local.",
      },
      { status: 501 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe init failed." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  // Stripe signs the raw bytes; never parse to JSON first.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed.";
    console.error("[stripe-webhook] signature error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  // ─── Handle event ─── (persisting to Firestore lands in Phase 4)
  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(
        `[stripe-webhook] payment_intent.succeeded id=${pi.id} ` +
          `amount=${pi.amount} customer=${pi.customer}`,
      );
      break;
    }
    case "payment_intent.canceled": {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(`[stripe-webhook] payment_intent.canceled id=${pi.id}`);
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(
        `[stripe-webhook] payment_intent.payment_failed id=${pi.id} ` +
          `last_error=${pi.last_payment_error?.message ?? "(unknown)"}`,
      );
      break;
    }
    default:
      console.log(`[stripe-webhook] unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
