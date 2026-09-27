import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/authorization";
import { getBooking } from "@/lib/booking/repository";
import { getStorageBucket } from "@/lib/firebase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking?.insuranceStoragePath || !booking.insuranceFileName) {
    return NextResponse.json({ ok: false, error: "Insurance document not found." }, { status: 404 });
  }
  const bucket = getStorageBucket();
  if (!bucket) {
    return NextResponse.json({ ok: false, error: "Demo uploads do not store document bytes." }, { status: 404 });
  }
  try {
    const [bytes] = await bucket.file(booking.insuranceStoragePath).download();
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": booking.insuranceMimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${booking.insuranceFileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[insurance-download]", error);
    return NextResponse.json({ ok: false, error: "Could not retrieve the document." }, { status: 502 });
  }
}
