import { NextResponse } from "next/server";
import { getCustomerBooking } from "@/lib/auth/authorization";
import { updateBooking } from "@/lib/booking/repository";
import { getStripe, hasStripe } from "@/lib/stripe/server";
import { stripePublishableKey } from "@/lib/env";
import { syncDepositPayment } from "@/lib/stripe/deposits";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorized = await getCustomerBooking(id);
  if (!authorized) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const { booking } = authorized;
  if (booking.depositStatus !== "requires_action") {
    return NextResponse.json({
      ok: true,
      status: booking.depositStatus,
      method: booking.depositMethod,
    });
  }
  if (!hasStripe || !stripePublishableKey || !booking.depositPaymentIntentId) {
    return NextResponse.json({ ok: false, error: "Deposit authorization is not available." }, { status: 409 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, error: "Stripe is unavailable." }, { status: 503 });
  const paymentIntent = await stripe.paymentIntents.retrieve(booking.depositPaymentIntentId);
  return NextResponse.json({
    ok: true,
    clientSecret: paymentIntent.client_secret,
    publishableKey: stripePublishableKey,
    method: booking.depositMethod,
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorized = await getCustomerBooking(id);
  if (!authorized) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const { booking, session } = authorized;
  if (!hasStripe || !booking.depositPaymentIntentId) {
    return NextResponse.json({ ok: false, error: "Deposit authorization is not available." }, { status: 409 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, error: "Stripe is unavailable." }, { status: 503 });
  const paymentIntent = await stripe.paymentIntents.retrieve(booking.depositPaymentIntentId, {
    expand: ["latest_charge"],
  });
  const updated = await syncDepositPayment(booking, paymentIntent);
  if (updated.status === "ready_for_pickup") {
    await updateBooking(id, {}, { action: "deposit_customer_action_completed", actor: session.email });
  }
  return NextResponse.json({ ok: true, status: updated.depositStatus });
}
