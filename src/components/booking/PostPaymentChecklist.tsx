"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Icon } from "@/components/ui/Icon";
import { DepositConfirmation } from "@/components/booking/DepositConfirmation";
import { formatUsd } from "@/lib/booking/pricing";
import type { AgreementStatus, BookingStatus, DepositMethod, DepositStatus, IdentityStatus, InsuranceStatus } from "@/types/models";

interface Props {
  bookingId: string;
  customerName: string;
  agreementStatus: AgreementStatus;
  identityStatus: IdentityStatus;
  insuranceStatus: InsuranceStatus;
  defaultPolicyholder: string;
  bookingStatus: BookingStatus;
  depositStatus: DepositStatus;
  depositMethod?: DepositMethod;
  depositAmount: number;
}

function StatusBadge({ complete, label }: { complete: boolean; label: string }) {
  return (
    <span className={`text-xs font-bold uppercase tracking-widest ${complete ? "text-green-400" : "text-primary"}`}>
      {complete ? "Complete" : label}
    </span>
  );
}

export function PostPaymentChecklist(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function syncStatus(kind: "agreement" | "identity") {
    try {
      await fetch(`/api/bookings/${props.bookingId}/${kind}`);
      router.refresh();
    } catch {
      setError(`Could not refresh ${kind} status.`);
    }
  }

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const kinds = (["agreement", "identity"] as const).filter((kind) => search.has(kind));
    if (kinds.length > 0) {
      void Promise.all(kinds.map((kind) => fetch(`/api/bookings/${props.bookingId}/${kind}`)))
        .then(() => router.refresh())
        .catch(() => setError("Could not refresh document status."));
    }
  }, [props.bookingId, router]);

  async function startAgreement() {
    setBusy("agreement");
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${props.bookingId}/agreement`, { method: "POST" });
      const result = (await response.json()) as { ok: boolean; mode?: string; url?: string; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Could not open agreement.");
      if (result.mode === "real" && result.url) window.location.assign(result.url);
      else router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open agreement.");
      setBusy(null);
    }
  }

  async function startIdentity() {
    setBusy("identity");
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${props.bookingId}/identity`, { method: "POST" });
      const result = (await response.json()) as {
        ok: boolean;
        mode?: string;
        clientSecret?: string;
        publishableKey?: string;
        error?: string;
      };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Could not start verification.");
      if (result.mode === "real" && result.clientSecret && result.publishableKey) {
        const stripe = await loadStripe(result.publishableKey);
        if (!stripe) throw new Error("Identity verification failed to load.");
        const verified = await stripe.verifyIdentity(result.clientSecret);
        if (verified.error) throw new Error(verified.error.message ?? "Identity verification was not completed.");
        await syncStatus("identity");
      } else {
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not complete verification.");
    } finally {
      setBusy(null);
    }
  }

  async function uploadInsurance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("insurance");
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${props.bookingId}/insurance`, {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Insurance upload failed.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Insurance upload failed.");
    } finally {
      setBusy(null);
    }
  }

  const agreementComplete = props.agreementStatus === "signed";
  const identityComplete = props.identityStatus === "verified";
  const insuranceComplete = props.insuranceStatus === "uploaded" || props.insuranceStatus === "approved";
  const reviewComplete = ["confirmed", "deposit_action_required", "ready_for_pickup", "active", "return_inspection", "completed"].includes(props.bookingStatus);
  const depositComplete = ["authorized", "charged", "partially_captured", "captured", "released"].includes(props.depositStatus);
  const inputClass = "w-full bg-surface-container-high px-4 py-3 text-on-surface ghost-border outline-none focus:border-b-2 focus:border-primary-action";

  return (
    <div className="space-y-5">
      <section className="bg-surface-container-low p-6 ghost-border" aria-labelledby="agreement-step">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 id="agreement-step" className="font-headline text-xl font-bold uppercase">1. Rental Agreement</h2>
          <StatusBadge complete={agreementComplete} label="Required" />
        </div>
        <p className="text-sm text-on-surface-variant mb-5">Review and sign the complete rental agreement through DocuSign.</p>
        {!agreementComplete && (
          <button onClick={startAgreement} disabled={busy !== null} className="min-h-[44px] bg-primary-action px-6 py-3 font-headline font-bold uppercase tracking-widest text-white disabled:opacity-50">
            {busy === "agreement" ? "Opening…" : "Review & Sign"}
          </button>
        )}
      </section>

      <section className="bg-surface-container-low p-6 ghost-border" aria-labelledby="identity-step">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 id="identity-step" className="font-headline text-xl font-bold uppercase">2. Verify ID</h2>
          <StatusBadge complete={identityComplete} label={agreementComplete ? "Required" : "Locked"} />
        </div>
        <p className="text-sm text-on-surface-variant mb-2">Stripe verifies a valid driver&apos;s license or government ID and a matching selfie.</p>
        <p className="text-xs text-on-surface-variant mb-5">Stripe collects sensitive identity data. Read our <a href="/privacy" target="_blank" className="text-primary underline">privacy notice</a> before continuing.</p>
        {!identityComplete && (
          <button onClick={startIdentity} disabled={!agreementComplete || busy !== null} className="min-h-[44px] bg-primary-action px-6 py-3 font-headline font-bold uppercase tracking-widest text-white disabled:opacity-40">
            {busy === "identity" ? "Verifying…" : props.identityStatus === "requires_input" ? "Try Verification Again" : "Verify My Identity"}
          </button>
        )}
      </section>

      <section className="bg-surface-container-low p-6 ghost-border" aria-labelledby="insurance-step">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 id="insurance-step" className="font-headline text-xl font-bold uppercase">3. Current Insurance</h2>
          <StatusBadge complete={insuranceComplete} label={identityComplete ? "Required" : "Locked"} />
        </div>
        {insuranceComplete ? (
          <p className="text-sm text-on-surface-variant">Insurance received. The owner will review it with the rest of your booking.</p>
        ) : (
          <form onSubmit={uploadInsurance} className="space-y-4">
            <p className="text-sm text-on-surface-variant">Upload a clear photo or PDF. The policy must remain current through your return date.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label htmlFor="insurance-carrier" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Insurance Company</label><input id="insurance-carrier" name="carrier" required disabled={!identityComplete} className={inputClass} /></div>
              <div><label htmlFor="insurance-policyholder" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Policyholder</label><input id="insurance-policyholder" name="policyholder" required disabled={!identityComplete} defaultValue={props.defaultPolicyholder} className={inputClass} /></div>
              <div><label htmlFor="insurance-expiration" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Expiration Date</label><input id="insurance-expiration" name="expiresAt" type="date" required disabled={!identityComplete} className={inputClass} /></div>
              <div><label htmlFor="insurance-file" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Insurance Photo or PDF</label><input id="insurance-file" name="file" type="file" accept="image/jpeg,image/png,application/pdf" required disabled={!identityComplete} className={inputClass} /></div>
            </div>
            <button type="submit" disabled={!identityComplete || busy !== null} className="min-h-[44px] bg-primary-action px-6 py-3 font-headline font-bold uppercase tracking-widest text-white disabled:opacity-40">
              {busy === "insurance" ? "Uploading…" : "Upload Insurance"}
            </button>
          </form>
        )}
      </section>

      {error && <p role="alert" className="border-l-4 border-error bg-error/10 px-4 py-3 text-sm text-error">{error}</p>}
      {agreementComplete && identityComplete && insuranceComplete && (
        <div className="flex items-start gap-3 border-l-4 border-primary bg-primary/10 px-5 py-4">
          <Icon name="schedule" className="text-primary" />
          <p className="text-sm text-on-surface-variant">Everything has been submitted. Your reservation is under owner review; it is not ready for pickup until you receive confirmation.</p>
        </div>
      )}

      {reviewComplete && (
        <section className="bg-surface-container-low p-6 ghost-border" aria-labelledby="deposit-step">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 id="deposit-step" className="font-headline text-xl font-bold uppercase">4. Security Deposit</h2>
            <StatusBadge complete={depositComplete} label={props.bookingStatus === "deposit_action_required" ? "Action Required" : "Pending Owner"} />
          </div>
          {props.bookingStatus === "deposit_action_required" ? (
            <DepositConfirmation bookingId={props.bookingId} />
          ) : depositComplete ? (
            <p className="text-sm text-on-surface-variant">
              {props.depositStatus === "released"
                ? `${formatUsd(props.depositAmount)} deposit release initiated after return inspection.`
                : `${formatUsd(props.depositAmount)} ${props.depositMethod === "refundable_charge" ? "refundable deposit charge" : "authorization"} is in place.`}
            </p>
          ) : (
            <p className="text-sm text-on-surface-variant">No action is needed yet. The owner will request the {formatUsd(props.depositAmount)} deposit within 48 hours of pickup to avoid an early authorization expiration.</p>
          )}
        </section>
      )}
    </div>
  );
}
