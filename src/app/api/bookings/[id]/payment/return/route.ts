import { NextResponse } from "next/server";
import { getBooking } from "@/lib/booking/repository";
import { markRentalPaymentSucceeded } from "@/lib/booking/workflow";
import { getStripe } from "@/lib/stripe/server";
import { createToken, setSessionCookie } from "@/lib/auth/session";
import { sendAccessLinkEmail } from "@/lib/email/server";
import { appUrl } from "@/lib/env";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking?.rentalPaymentIntentId) {
    return NextResponse.redirect(new URL("/book?payment=missing", appUrl));
  }

  try {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is unavailable.");
    const paymentIntent = await stripe.paymentIntents.retrieve(booking.rentalPaymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.redirect(new URL("/book?payment=incomplete", appUrl));
    }
    const updated = await markRentalPaymentSucceeded(paymentIntent);
    if (!updated) throw new Error("Booking could not be updated.");
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
    return NextResponse.redirect(new URL(nextUrl, appUrl));
  } catch (error) {
    console.error("[payment-return]", error, new URL(request.url).searchParams.get("redirect_status"));
    return NextResponse.redirect(new URL("/book?payment=error", appUrl));
  }
}
