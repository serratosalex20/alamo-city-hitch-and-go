import { NextResponse } from "next/server";
import { getBooking } from "@/lib/booking/repository";
import {
  markDemoRentalPaymentSucceeded,
  markRentalPaymentSucceeded,
} from "@/lib/booking/workflow";
import { isDemoEnvironment } from "@/lib/env";
import { getStripe, hasStripe } from "@/lib/stripe/server";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) {
    return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
  }

  try {
    let updated;
    if (!hasStripe) {
      if (!isDemoEnvironment) {
        return NextResponse.json({ ok: false, error: "Payment service unavailable." }, { status: 503 });
      }
      updated = await markDemoRentalPaymentSucceeded(id);
    } else {
      const stripe = getStripe();
      if (!stripe || !booking.rentalPaymentIntentId) throw new Error("Payment was not initialized.");
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.rentalPaymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return NextResponse.json(
          { ok: false, error: "Payment has not completed. Please try again." },
          { status: 409 },
        );
      }
      updated = await markRentalPaymentSucceeded(paymentIntent);
    }

    if (!updated) throw new Error("Could not update the booking payment.");
    await setSessionCookie(updated.customerEmail);
    return NextResponse.json({
      ok: true,
      bookingId: updated.id,
      nextUrl: `/booking/${updated.id}/documents`,
    });
  } catch (error) {
    console.error("[payment-confirmation]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Payment confirmation failed." },
      { status: 502 },
    );
  }
}
