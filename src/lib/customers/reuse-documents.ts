import type { Booking } from "@/types/models";
import { formatBusinessDate } from "@/lib/booking/schedule";
import { getStripe } from "@/lib/stripe/server";
import { paidBookings, reusableInsurance, sameRenter, validThrough } from "./returning";

// Called only for an email-verified session matching the new booking's email.
// Never accept a document path, prior booking ID, or verification status from the browser.
export async function reuseDocuments(target: Booking, history: Booking[]) {
  const previous = paidBookings(target.customerEmail, history).filter(b => b.id !== target.id);
  const returnDate = formatBusinessDate(Math.max(target.endTimeMs, Date.now()));
  const insurance = previous.find(b => sameRenter(b, target) && b.insuranceStoragePath);
  if (insurance && reusableInsurance(insurance, target, returnDate)) {
    Object.assign(target, {
      insuranceStatus: "uploaded", // Owner reviews applicability for this rental.
      insuranceSourceBookingId: insurance.id,
      insuranceStoragePath: insurance.insuranceStoragePath,
      insuranceExpiresAt: insurance.insuranceExpiresAt,
      ...Object.fromEntries((["insuranceFileName", "insuranceMimeType", "insuranceCarrier", "insurancePolicyholder", "insurancePolicyNumber"] as const)
        .filter(key => insurance[key] !== undefined).map(key => [key, insurance[key]])),
    });
  }
  const identity = previous.find(b => sameRenter(b, target) && (b.stripeIdentitySessionId || b.identityVerificationSourceId));
  const stripe = getStripe();
  if (identity?.identityStatus === "verified" && stripe) {
    try {
      const sourceId = identity.stripeIdentitySessionId ?? identity.identityVerificationSourceId!;
      const verification = await stripe.identity.verificationSessions.retrieve(sourceId);
      const reportId = typeof verification.last_verification_report === "string" ? verification.last_verification_report : verification.last_verification_report?.id;
      if (verification.status === "verified" && reportId && !verification.redaction) {
        const report = await stripe.identity.verificationReports.retrieve(reportId, { expand: ["document.expiration_date"] });
        const date = report.document?.expiration_date;
        const expiration = date?.year && date.month && date.day ? `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}` : undefined;
        if (report.document?.status === "verified" && validThrough(expiration, returnDate)) {
          Object.assign(target, { identityStatus: "verified", identityExpiresAt: expiration, identityVerificationSourceId: sourceId,
            identitySourceBookingId: identity.id, ...(identity.identityVerifiedAt ? { identityVerifiedAt: identity.identityVerifiedAt } : {}) });
        }
      }
    } catch {
      // Missing/redacted/unsupported results require verification again; never silently approve.
      console.warn("[identity-reuse] Could not confirm a current identity document.");
    }
  }
  for (const [kind, source] of [["insurance", target.insuranceSourceBookingId], ["identity", target.identitySourceBookingId]]) {
    if (source) target.auditTrail.push({ action: `${kind}_reused`, actor: target.customerEmail, note: `Source booking: ${source}`, createdAt: target.createdAt, createdAtMs: target.createdAtMs });
  }
  return target;
}
