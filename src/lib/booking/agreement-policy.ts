import type { Booking } from "@/types/models";

/** A changed policy invalidates the agreement that described the previous policy. */
export function agreementUpdatesForInsuranceChange(
  booking: Booking,
  policyChanged: boolean,
  mode: "in_person" | "docusign",
): Partial<Pick<Booking, "agreementStatus" | "agreementSignedAt" | "agreementVerifiedAt" | "agreementVerifiedBy" | "docusignEnvelopeId" | "supersededAgreementEnvelopeIds">> {
  if (!policyChanged || !["signed", "sent", "signed_in_person", "awaiting_in_person"].includes(booking.agreementStatus)) return {};
  return {
    agreementStatus: mode === "in_person" ? "awaiting_in_person" : "not_started",
    agreementSignedAt: undefined,
    agreementVerifiedAt: undefined,
    agreementVerifiedBy: undefined,
    docusignEnvelopeId: undefined,
    supersededAgreementEnvelopeIds: [
      ...(booking.supersededAgreementEnvelopeIds ?? []),
      ...(booking.docusignEnvelopeId ? [booking.docusignEnvelopeId] : []),
    ],
  };
}
