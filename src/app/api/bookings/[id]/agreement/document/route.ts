import { NextResponse } from "next/server";
import { getCustomerBooking } from "@/lib/auth/authorization";
import { AgreementDocumentError, getSignedAgreementPdf } from "@/lib/docusign/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorized = await getCustomerBooking(id);
  const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!authorized) return NextResponse.json({ error: "Please sign in to the account that owns this booking." }, { status: 403, headers: privateHeaders });
  try {
    const bytes = await getSignedAgreementPdf(authorized.booking);
    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
    const safeId = authorized.booking.id.replace(/[^a-zA-Z0-9-]/g, "");
    return new NextResponse(bytes, { headers: {
      ...privateHeaders, "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="rental-agreement-${safeId}.pdf"`,
    } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof AgreementDocumentError ? error.message : "Could not retrieve your signed agreement. Please try again." }, { status: error instanceof AgreementDocumentError ? error.status : 502, headers: privateHeaders });
  }
}
