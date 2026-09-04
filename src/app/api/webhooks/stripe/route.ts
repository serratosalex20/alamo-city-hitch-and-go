import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeWebhookSecret } from "@/lib/env";
import { getStripe, hasStripe } from "@/lib/stripe/server";
import { findBookingByPaymentIntent } from "@/lib/booking/repository";
import {
  markPaymentIntentCanceled,
  markPaymentIntentFailed,
  markRentalPaymentSucceeded,
  syncIdentityVerificationSession,
} from "@/lib/booking/workflow";
import { syncDepositPayment } from "@/lib/stripe/deposits";

export async function POST(request: Request) {
  if (!hasStripe || !stripeWebhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook endpoint is not configured." }, { status: 501 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, error: "Stripe initialization failed." }, { status: 500 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ ok: false, error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, stripeWebhookSecret);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (paymentIntent.metadata.kind === "rental") {
          await markRentalPaymentSucceeded(paymentIntent);
        } else if (paymentIntent.metadata.kind === "deposit") {
          const booking = await findBookingByPaymentIntent(paymentIntent.id);
          if (booking) await syncDepositPayment(booking, paymentIntent);
        }
        break;
      }
      case "payment_intent.amount_capturable_updated": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (paymentIntent.metadata.kind === "deposit") {
          const booking = await findBookingByPaymentIntent(paymentIntent.id);
          if (booking) await syncDepositPayment(booking, paymentIntent);
        }
        break;
      }
      case "payment_intent.payment_failed":
        await markPaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.canceled":
        await markPaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      case "identity.verification_session.verified":
      case "identity.verification_session.requires_input":
      case "identity.verification_session.canceled":
        await syncIdentityVerificationSession(event.data.object as Stripe.Identity.VerificationSession);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe-webhook:${event.id}]`, error);
    return NextResponse.json({ ok: false, error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
