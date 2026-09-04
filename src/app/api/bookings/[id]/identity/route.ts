import { NextResponse } from "next/server";
import { getCustomerBooking } from "@/lib/auth/authorization";
import { updateBooking } from "@/lib/booking/repository";
import { appUrl, isDemoEnvironment, stripePublishableKey } from "@/lib/env";
import { getStripe, hasStripe } from "@/lib/stripe/server";
import { syncIdentityVerificationSession } from "@/lib/booking/workflow";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorized = await getCustomerBooking(id);
  if (!authorized) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const { booking, session } = authorized;
  if (booking.agreementStatus !== "signed") {
    return NextResponse.json({ ok: false, error: "Sign the rental agreement first." }, { status: 409 });
  }
  if (booking.identityStatus === "verified") {
    return NextResponse.json({ ok: true, mode: "complete" as const });
  }

  if (!hasStripe) {
    if (!isDemoEnvironment) {
      return NextResponse.json({ ok: false, error: "Identity verification is unavailable." }, { status: 503 });
    }
    await updateBooking(
      id,
      { identityStatus: "verified", identityVerifiedAt: new Date().toISOString(), status: "pending_insurance" },
      { action: "demo_identity_verified", actor: session.email },
    );
    return NextResponse.json({ ok: true, mode: "demo" as const });
  }

  try {
    const stripe = getStripe();
    if (!stripe || !stripePublishableKey) throw new Error("Stripe Identity is unavailable.");
    const verification = booking.stripeIdentitySessionId
      ? await stripe.identity.verificationSessions.retrieve(booking.stripeIdentitySessionId)
      : await stripe.identity.verificationSessions.create(
          {
            type: "document",
            provided_details: { email: booking.customerEmail },
            options: {
              document: {
                allowed_types: ["driving_license", "id_card"],
                require_matching_selfie: true,
              },
            },
            return_url: `${appUrl}/booking/${id}/documents?identity=returned`,
            metadata: { bookingId: id },
          },
          { idempotencyKey: `identity-${id}` },
        );
    await updateBooking(
      id,
      { stripeIdentitySessionId: verification.id, identityStatus: "pending" },
      { action: "identity_verification_started", actor: session.email },
    );
    return NextResponse.json({
      ok: true,
      mode: "real" as const,
      clientSecret: verification.client_secret,
      publishableKey: stripePublishableKey,
    });
  } catch (error) {
    console.error("[identity-create]", error);
    return NextResponse.json({ ok: false, error: "Could not start identity verification." }, { status: 502 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorized = await getCustomerBooking(id);
  if (!authorized) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const { booking, session } = authorized;
  if (!booking.stripeIdentitySessionId || !hasStripe) {
    return NextResponse.json({ ok: true, status: booking.identityStatus });
  }
  try {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe Identity is unavailable.");
    const verification = await stripe.identity.verificationSessions.retrieve(
      booking.stripeIdentitySessionId,
    );
    const status = verification.status;
    await syncIdentityVerificationSession(verification);
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("[identity-status]", error);
    return NextResponse.json({ ok: false, error: "Could not verify identity status." }, { status: 502 });
  }
}
