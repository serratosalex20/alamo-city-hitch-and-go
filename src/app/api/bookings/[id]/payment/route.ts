import { NextResponse } from "next/server";
import { getBooking } from "@/lib/booking/repository";
import {
  markDemoRentalPaymentSucceeded,
  markRentalPaymentSucceeded,
  RentalPaymentRefundedError,
} from "@/lib/booking/workflow";
import { BookingConflictError } from "@/lib/booking/repository";
import { appUrl, isDemoEnvironment } from "@/lib/env";
import { getStripe, hasStripe } from "@/lib/stripe/server";
import { createToken, setSessionCookie } from "@/lib/auth/session";
import { sendAccessLinkEmail } from "@/lib/email/server";

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
    const nextUrl = `/booking/${updated.id}/documents`;
    const linkToken = createToken(updated.customerEmail, "link", nextUrl);
    try {
      await sendAccessLinkEmail({
        to: updated.customerEmail,
        link: `${appUrl}/api/auth/callback?token=${encodeURIComponent(linkToken)}`,
        subject: "Payment received — complete your trailer booking",
        intro: "Your rental payment was received. Sign the agreement, verify your ID, and upload current insurance to finish your reservation.",
        idempotencyKey: `booking-access-${updated.id}`,
      });
    } catch (emailError) {
      console.error("[booking-access-email]", emailError);
    }
    return NextResponse.json({
      ok: true,
      bookingId: updated.id,
      nextUrl,
    });
  } catch (error) {
    console.error("[payment-confirmation]", error);
    const checkoutUnavailable =
      error instanceof BookingConflictError || error instanceof RentalPaymentRefundedError;
    return NextResponse.json(
      {
        ok: false,
        error: checkoutUnavailable
          ? error.message
          : "Payment confirmation failed. Please contact us before trying another payment.",
      },
      { status: checkoutUnavailable ? 409 : 502 },
    );
  }
}
