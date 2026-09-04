import { NextResponse } from "next/server";
import { getBooking } from "@/lib/booking/repository";
import { markRentalPaymentSucceeded } from "@/lib/booking/workflow";
import { getStripe } from "@/lib/stripe/server";
import { setSessionCookie } from "@/lib/auth/session";
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
    return NextResponse.redirect(new URL(`/booking/${updated.id}/documents`, appUrl));
  } catch (error) {
    console.error("[payment-return]", error, new URL(request.url).searchParams.get("redirect_status"));
    return NextResponse.redirect(new URL("/book?payment=error", appUrl));
  }
}
