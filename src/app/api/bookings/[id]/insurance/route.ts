import { nextDocumentStatus, validThrough } from "@/lib/customers/returning";
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
  if (booking.paymentStatus !== "succeeded" || booking.identityStatus !== "verified") {
    return NextResponse.json(
      { ok: false, error: "Complete payment and identity verification first." },
      { status: 409 },
    );
  }

  if (!["pending_identity", "pending_insurance", "pending_signature", "under_review"].includes(booking.status)) {
    return NextResponse.json({ ok: false, error: "Insurance can no longer be changed for this booking. Contact the owner for help." }, { status: 409 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const carrier = String(form.get("carrier") ?? "").trim();
    const policyNumber = String(form.get("policyNumber") ?? "").trim();
    const policyholder = String(form.get("policyholder") ?? "").trim();
    const expiresAt = String(form.get("expiresAt") ?? "").trim();
    const newFile = file instanceof File && file.size > 0 ? file : null;
    if (!newFile && (booking.insuranceStatus === "resubmit_requested" || !booking.insuranceStoragePath)) throw new Error("Choose an insurance photo or PDF.");
    if (newFile && !ALLOWED_MIME_TYPES.has(newFile.type)) throw new Error("Upload a JPG, PNG, or PDF file.");
    if (newFile && newFile.size > MAX_FILE_BYTES) throw new Error("Insurance file must be 10 MB or smaller.");
    if (!policyNumber || policyNumber.length > 100) throw new Error("Enter your policy number (up to 100 characters).");
    if (!newFile && (carrier !== booking.insuranceCarrier || policyholder !== booking.insurancePolicyholder || expiresAt !== booking.insuranceExpiresAt || (booking.insurancePolicyNumber && policyNumber !== booking.insurancePolicyNumber))) {
      throw new Error("Upload your current insurance document when changing the policy details.");
    }
    if (carrier.length < 2 || policyholder.length < 2) {
      throw new Error("Enter the insurance company and policyholder name.");
    }
    if (!validThrough(expiresAt, formatBusinessDate(Math.max(booking.endTimeMs, Date.now())))) {
      throw new Error("Insurance must remain current through the scheduled return date.");
    }

    const safeName = newFile ? cleanFileName(newFile.name) : booking.insuranceFileName ?? "insurance-document";
    const storagePath = newFile ? `${bookingStoragePrefix}/${booking.id}/insurance/${randomUUID()}-${safeName}` : booking.insuranceStoragePath!;
    const bucket = getStorageBucket();
    if (!bucket) {
      if (!isDemoEnvironment) throw new Error("Secure document storage is unavailable.");
    } else if (newFile) {
      await bucket.file(storagePath).save(Buffer.from(await newFile.arrayBuffer()), {
        resumable: false,
        validation: "crc32c",
        metadata: {
          contentType: newFile.type,
          contentDisposition: `attachment; filename="${safeName}"`,
          metadata: { bookingId: booking.id, documentType: "insurance" },
        },
      });
    }

    const policyChanged = carrier !== booking.insuranceCarrier || policyNumber !== booking.insurancePolicyNumber || expiresAt !== booking.insuranceExpiresAt || policyholder !== booking.insurancePolicyholder;
    const agreementUpdates = booking.agreementStatus === "signed" && policyChanged ? {
      agreementStatus: "not_started" as const,
      agreementSignedAt: undefined,
      docusignEnvelopeId: undefined,
      supersededAgreementEnvelopeIds: [...(booking.supersededAgreementEnvelopeIds ?? []), ...(booking.docusignEnvelopeId ? [booking.docusignEnvelopeId] : [])],
    } : {};
    const updated = await updateBooking(
      id,
      {
        ...agreementUpdates,
        insuranceStatus: "uploaded",
        insuranceStoragePath: storagePath,
        insuranceFileName: safeName,
        insuranceMimeType: newFile?.type ?? booking.insuranceMimeType ?? "application/octet-stream",
        insuranceCarrier: carrier,
        insurancePolicyNumber: policyNumber,
        insurancePolicyholder: policyholder,
        insuranceExpiresAt: expiresAt,
        status: nextDocumentStatus({ ...booking, ...agreementUpdates, insuranceStatus: "uploaded", insurancePolicyNumber: policyNumber }),
      },
      { action: bucket ? "insurance_uploaded" : "demo_insurance_uploaded", actor: session.email },
    );
    try {
      if (updated.status === "under_review") await sendOwnerReviewEmail(updated);
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
