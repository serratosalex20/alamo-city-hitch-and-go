import { NextResponse } from "next/server";
import { getCustomerBooking } from "@/lib/auth/authorization";
import { updateBooking } from "@/lib/booking/repository";
import {
  createEmbeddedSigningSession,
  getEnvelopeStatus,
  hasDocuSign,
} from "@/lib/docusign/server";
import { isDemoEnvironment } from "@/lib/env";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorized = await getCustomerBooking(id);
  if (!authorized) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const { booking, session } = authorized;
  if (booking.paymentStatus !== "succeeded") {
    return NextResponse.json({ ok: false, error: "Rental payment is required first." }, { status: 409 });
  }
  if (booking.agreementStatus === "signed") {
    return NextResponse.json({ ok: true, mode: "complete" as const });
  }

  if (!hasDocuSign) {
    if (!isDemoEnvironment) {
      return NextResponse.json(
        { ok: false, error: "Agreement signing is temporarily unavailable." },
        { status: 503 },
      );
    }
    await updateBooking(
      id,
      {
        agreementStatus: "signed",
        agreementSignedAt: new Date().toISOString(),
        status: "pending_identity",
      },
      { action: "demo_agreement_signed", actor: session.email },
    );
    return NextResponse.json({ ok: true, mode: "demo" as const });
  }

  try {
    const signing = await createEmbeddedSigningSession(booking);
    await updateBooking(
      id,
      { docusignEnvelopeId: signing.envelopeId, agreementStatus: "sent" },
      { action: "agreement_sent", actor: session.email },
    );
    return NextResponse.json({ ok: true, mode: "real" as const, url: signing.url });
  } catch (error) {
    console.error("[agreement-create]", error);
    return NextResponse.json(
      { ok: false, error: "We could not open the rental agreement. Please try again." },
      { status: 502 },
    );
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
  if (booking.agreementStatus === "signed") {
    return NextResponse.json({ ok: true, status: "signed" });
  }
  if (!booking.docusignEnvelopeId || !hasDocuSign) {
    return NextResponse.json({ ok: true, status: booking.agreementStatus });
  }

  try {
    const envelope = await getEnvelopeStatus(booking.docusignEnvelopeId);
    const completed = envelope.status === "completed";
    if (completed) {
      await updateBooking(
        id,
        {
          agreementStatus: "signed",
          agreementSignedAt: envelope.completedDateTime ?? new Date().toISOString(),
          status: "pending_identity",
        },
        { action: "agreement_signed", actor: session.email },
      );
    }
    return NextResponse.json({ ok: true, status: completed ? "signed" : envelope.status });
  } catch (error) {
    console.error("[agreement-status]", error);
    return NextResponse.json({ ok: false, error: "Could not verify the agreement status." }, { status: 502 });
  }
}
