import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { profileInput } from "@/lib/customers/profile";
import { saveProfile } from "@/lib/customers/repository";

export async function PUT(request: Request) {
  const session = await getSession();
  // Checkout-only access does not prove ownership of the email account.
  if (!session || session.bookingId) return NextResponse.json({ ok: false, error: "Sign in using the link sent to your email to save your profile." }, { status: 403 });
  try {
    const input = profileInput.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ ok: false, error: input.error.issues[0]?.message ?? "Check your details." }, { status: 400 });
    await saveProfile(session.email, input.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[customer-profile]", error);
    return NextResponse.json({ ok: false, error: "Your profile could not be saved. Please try again." }, { status: 500 });
  }
}
