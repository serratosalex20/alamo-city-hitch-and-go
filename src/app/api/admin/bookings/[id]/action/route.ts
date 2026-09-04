import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/authorization";
import {
  performAdminBookingAction,
  type AdminBookingAction,
} from "@/lib/booking/admin-actions";

const Body = z.object({
  action: z.enum([
    "approve",
    "request_insurance_resubmission",
    "reject",
    "request_deposit",
    "mark_picked_up",
    "mark_returned",
    "release_deposit",
    "retain_deposit",
  ]),
  note: z.string().max(1000).optional(),
  amountCents: z.number().int().positive().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

  try {
    const { id } = await params;
    const input = Body.parse(await request.json());
    const booking = await performAdminBookingAction({
      bookingId: id,
      action: input.action as AdminBookingAction,
      actor: session.email,
      note: input.note,
      amountCents: input.amountCents,
    });
    return NextResponse.json({ ok: true, status: booking.status, depositStatus: booking.depositStatus });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message
      : error instanceof Error
        ? error.message
        : "Booking update failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
