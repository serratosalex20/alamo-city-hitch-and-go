import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCustomerBooking } from "@/lib/auth/authorization";
import { updateBooking } from "@/lib/booking/repository";
import { formatBusinessDate } from "@/lib/booking/schedule";
import { getStorageBucket } from "@/lib/firebase/admin";
import { bookingStoragePrefix, isDemoEnvironment } from "@/lib/env";
import { sendOwnerReviewEmail } from "@/lib/email/server";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

function cleanFileName(name: string) {
  return name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-120) || "insurance-document";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorized = await getCustomerBooking(id);
  if (!authorized) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const { booking, session } = authorized;
  if (booking.agreementStatus !== "signed" || booking.identityStatus !== "verified") {
    return NextResponse.json(
      { ok: false, error: "Complete the agreement and identity verification first." },
      { status: 409 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const carrier = String(form.get("carrier") ?? "").trim();
    const policyholder = String(form.get("policyholder") ?? "").trim();
    const expiresAt = String(form.get("expiresAt") ?? "").trim();
    if (!(file instanceof File)) throw new Error("Choose an insurance photo or PDF.");
    if (!ALLOWED_MIME_TYPES.has(file.type)) throw new Error("Upload a JPG, PNG, or PDF file.");
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error("Insurance file must be 10 MB or smaller.");
    if (carrier.length < 2 || policyholder.length < 2) {
      throw new Error("Enter the insurance company and policyholder name.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) throw new Error("Enter the policy expiration date.");
    if (expiresAt < formatBusinessDate(booking.endTimeMs)) {
      throw new Error("Insurance must remain current through the scheduled return date.");
    }

    const safeName = cleanFileName(file.name);
    const storagePath = `${bookingStoragePrefix}/${booking.id}/insurance/${randomUUID()}-${safeName}`;
    const bucket = getStorageBucket();
    if (!bucket) {
      if (!isDemoEnvironment) throw new Error("Secure document storage is unavailable.");
    } else {
      await bucket.file(storagePath).save(Buffer.from(await file.arrayBuffer()), {
        resumable: false,
        validation: "crc32c",
        metadata: {
          contentType: file.type,
          contentDisposition: `attachment; filename="${safeName}"`,
          metadata: { bookingId: booking.id, documentType: "insurance" },
        },
      });
    }

    const updated = await updateBooking(
      id,
      {
        insuranceStatus: "uploaded",
        insuranceStoragePath: storagePath,
        insuranceFileName: safeName,
        insuranceMimeType: file.type,
        insuranceCarrier: carrier,
        insurancePolicyholder: policyholder,
        insuranceExpiresAt: expiresAt,
        status: "under_review",
      },
      { action: bucket ? "insurance_uploaded" : "demo_insurance_uploaded", actor: session.email },
    );
    try {
      await sendOwnerReviewEmail(updated);
    } catch (error) {
      console.error(`[booking-email:owner-review:${updated.id}]`, error);
    }
    return NextResponse.json({ ok: true, status: updated.insuranceStatus });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Insurance upload failed." },
      { status: 400 },
    );
  }
}
