"use client";

/**
 * StepPayment — booking wizard step that collects card details and
 * confirms the rental PaymentIntent.
 *
 * Two render modes:
 *
 *   STUB  — when /api/checkout returns mode="stub", we don't render
 *           real Stripe Elements. The submit button just confirms the
 *           stub and advances the wizard. A banner makes the mode
 *           explicit so nobody mistakes it for a real charge.
 *
 *   REAL  — when mode="real", we'd mount Stripe Elements via
 *           @stripe/react-stripe-js's <Elements> provider and a
 *           <CardElement>. This branch is wired up but kept guarded
 *           so the stub flow remains buildable without env keys.
 *
 * Either way, on successful "payment":
 *   1. POST /api/auth/send-link with the booking email so the customer
 *      gets magic-link access to their dashboard.
 *   2. Advance the wizard to the confirmation step.
 */

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { trailers } from "@/lib/data/trailers";
import type { BookingFormData } from "@/app/book/page";

interface Props {
  formData: BookingFormData;
  onBack: () => void;
  onSuccess: (result: { rentalIntentId: string; depositIntentId: string }) => void;
}

interface CheckoutOk {
  ok: true;
  mode: "stub" | "real";
  rental: { paymentIntentId: string; clientSecret: string; amountCents: number };
  deposit: { paymentIntentId: string; clientSecret: string; amountCents: number };
  display: { rental: string; deposit: string; tax: string; total: string };
}
type CheckoutErr = { ok: false; error: string };
type CheckoutResponse = CheckoutOk | CheckoutErr;

export function StepPayment({ formData, onBack, onSuccess }: Props) {
  const trailer = trailers.find((t) => t.id === formData.trailerId);
  const [checkout, setCheckout] = useState<CheckoutOk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create the PaymentIntents up front so the displayed total reflects
  // the server-computed prices (never trust client-side math at this step).
  useEffect(() => {
    if (!trailer) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailerId: formData.trailerId,
            duration: formData.duration,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
          }),
        });
        const data = (await res.json()) as CheckoutResponse;
        if (cancelled) return;
        if (!data.ok) {
          setError(data.error);
          return;
        }
        setCheckout(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not initialize checkout. Try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trailer, formData.trailerId, formData.duration, formData.email, formData.firstName, formData.lastName]);

  if (!trailer) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!checkout) return;
    setSubmitting(true);
    setError(null);

    try {
      if (checkout.mode === "real") {
        // TODO(Sprint 2.1): mount @stripe/react-stripe-js <CardElement>
        // and call stripe.confirmCardPayment(checkout.rental.clientSecret).
        // Until card UI is mounted, real mode short-circuits with a clear error.
        setError(
          "Real Stripe mode requires the card form (not yet mounted). " +
            "Unset STRIPE_SECRET_KEY to use stub mode for testing.",
        );
        return;
      }

      // STUB: pretend the payment confirmed instantly.
      // Send the magic-link email so the customer can reach their dashboard.
      await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      onSuccess({
        rentalIntentId: checkout.rental.paymentIntentId,
        depositIntentId: checkout.deposit.paymentIntentId,
      });
    } catch (err) {
      console.error(err);
      setError("Payment failed. Try again, or contact support.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase mb-2">
        Payment
      </h2>
      <p className="text-on-surface-variant mb-10">
        Card is charged for the rental fee; deposit is a refundable hold.
      </p>

      {checkout?.mode === "stub" && (
        <div
          role="status"
          className="mb-8 border-l-4 border-primary bg-surface-container-low px-5 py-4"
        >
          <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary mb-1">
            Stub Mode
          </div>
          <p className="text-on-surface-variant text-sm font-light leading-relaxed">
            Stripe is not configured. Clicking <strong>Complete Booking</strong> below
            will simulate a successful payment so you can walk the rest of the flow.
            Set <code>STRIPE_SECRET_KEY</code> in <code>.env.local</code> to enable
            real card collection.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-surface-container-high p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="receipt_long" className="text-primary text-xl" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Payment Summary
            </span>
          </div>
          {checkout ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Rental Fee ({formData.duration}h)
                </span>
                <span className="font-bold">{checkout.display.rental}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Sales Tax (Bexar Co.)</span>
                <span className="font-bold">{checkout.display.tax}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Security Deposit{" "}
                  <span className="text-[10px]">(hold only — not charged)</span>
                </span>
                <span className="font-bold">{checkout.display.deposit}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-headline font-bold uppercase">
                  Total Charged Today
                </span>
                <span className="text-primary font-headline font-bold">
                  {checkout.display.total}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm">Calculating total…</p>
          )}
        </div>

        {/* Card form placeholder — Sprint 2 stub. Real Stripe Elements lands
            when stub mode is dropped and STRIPE_SECRET_KEY is set in env. */}
        <div className="bg-surface-container p-6 mb-8 ghost-border">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="credit_card" className="text-primary text-xl" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Card Details
            </span>
          </div>
          <p className="text-on-surface-variant text-sm font-light">
            {checkout?.mode === "stub"
              ? "Card collection is disabled in stub mode."
              : "Card field renders here in real mode (Stripe Elements)."}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-error text-sm font-medium mb-6">
            {error}
          </p>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="flex-1 min-h-[44px] bg-surface-container-highest text-on-surface py-4 font-headline font-bold uppercase tracking-widest hover:bg-surface-bright transition-all disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!checkout || submitting}
            aria-label="Complete booking — confirm payment"
            className="flex-1 min-h-[44px] bg-primary-action text-white py-5 font-headline font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Icon name="lock" className="text-sm" />
            {submitting ? "Processing…" : "Complete Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
