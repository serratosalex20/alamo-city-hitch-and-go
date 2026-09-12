"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Icon } from "@/components/ui/Icon";
import { DURATION_LABELS } from "@/lib/booking/pricing";
import type { BookingFormData } from "@/app/book/page";

interface Props {
  formData: BookingFormData;
  checkoutKey: string;
  onBack: () => void;
  onSuccess: (nextUrl: string) => void;
}

interface CheckoutOk {
  ok: true;
  mode: "demo" | "real";
  bookingId: string;
  publishableKey?: string;
  rental: { paymentIntentId: string; clientSecret: string; amountCents: number };
  display: { rental: string; deposit: string; tax: string; total: string };
  checkoutExpiresAt: string;
}

type CheckoutResponse = CheckoutOk | { ok: false; error: string };

async function finalizePayment(bookingId: string): Promise<string> {
  const response = await fetch(`/api/bookings/${bookingId}/payment`, { method: "POST" });
  const result = (await response.json()) as { ok: boolean; nextUrl?: string; error?: string };
  if (!response.ok || !result.ok || !result.nextUrl) {
    throw new Error(result.error ?? "Payment completed, but the booking could not be updated.");
  }
  return result.nextUrl;
}

function RealPaymentForm({ checkout, onBack, onSuccess, expired = false }: {
  checkout: CheckoutOk;
  onBack: () => void;
  onSuccess: (nextUrl: string) => void;
  expired?: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;
    if (expired) {
      setError("This checkout hold expired. Go back to review and start payment again.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/api/bookings/${checkout.bookingId}/payment/return`,
        },
        redirect: "if_required",
      });
      if (result.error) throw new Error(result.error.message ?? "Payment was not completed.");
      onSuccess(await finalizePayment(checkout.bookingId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="bg-surface-container p-6 mb-8 ghost-border">
        <div className="flex items-center gap-2 mb-5">
          <Icon name="credit_card" className="text-primary text-xl" />
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Secure Card Payment
          </span>
        </div>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      {error && <p role="alert" className="text-error text-sm font-medium mb-6">{error}</p>}
      <div className="flex gap-4">
        <button type="button" onClick={onBack} disabled={submitting} className="flex-1 min-h-[44px] bg-surface-container-highest text-on-surface py-4 font-headline font-bold uppercase tracking-widest hover:bg-surface-bright transition-all disabled:opacity-50">
          Back
        </button>
        <button type="submit" disabled={!stripe || !elements || submitting || expired} className="flex-1 min-h-[44px] bg-primary-action text-white py-5 font-headline font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3">
          <Icon name="lock" className="text-sm" />
          {submitting ? "Processing…" : `Pay ${checkout.display.total}`}
        </button>
      </div>
    </form>
  );
}

function DemoPaymentForm({ checkout, onBack, onSuccess, expired = false }: {
  checkout: CheckoutOk;
  onBack: () => void;
  onSuccess: (nextUrl: string) => void;
  expired?: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (expired) {
      setError("This checkout hold expired. Go back to review and start payment again.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      onSuccess(await finalizePayment(checkout.bookingId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Demo payment failed.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div role="status" className="mb-8 border-l-4 border-primary bg-surface-container-low px-5 py-4">
        <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary mb-1">
          Development Demo — No Charge
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          This local test does not collect a card or create a real reservation. Production disables this mode automatically.
        </p>
      </div>
      {error && <p role="alert" className="text-error text-sm font-medium mb-6">{error}</p>}
      <div className="flex gap-4">
        <button type="button" onClick={onBack} disabled={submitting} className="flex-1 min-h-[44px] bg-surface-container-highest text-on-surface py-4 font-headline font-bold uppercase tracking-widest disabled:opacity-50">
          Back
        </button>
        <button type="button" onClick={submit} disabled={submitting || expired} className="flex-1 min-h-[44px] bg-primary-action text-white py-5 font-headline font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3">
          <Icon name="science" className="text-sm" />
          {submitting ? "Processing…" : "Complete Demo Payment"}
        </button>
      </div>
    </div>
  );
}

export function StepPayment({ formData, checkoutKey, onBack, onSuccess }: Props) {
  const [checkout, setCheckout] = useState<CheckoutOk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, checkoutKey }),
        });
        const result = (await response.json()) as CheckoutResponse;
        if (cancelled) return;
        if (!response.ok || !result.ok) {
          setError(result.ok ? "Checkout failed." : result.error);
          return;
        }
        setCheckout(result);
      } catch {
        if (!cancelled) setError("Could not initialize checkout. Please try again.");
      }
    }
    initialize();
    return () => {
      cancelled = true;
    };
  }, [checkoutKey, formData]);

  useEffect(() => {
    if (!checkout) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [checkout]);

  const expiresAtMs = checkout ? Date.parse(checkout.checkoutExpiresAt) : 0;
  const expired = Boolean(checkout && expiresAtMs <= nowMs);
  const secondsRemaining = checkout
    ? Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1_000))
    : 0;
  const holdClock = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;

  async function releaseAndGoBack() {
    if (leaving) return;
    setLeaving(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutKey }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not update this checkout.");
      }
      onBack();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update this checkout.");
    } finally {
      setLeaving(false);
    }
  }

  const stripePromise = useMemo(
    () =>
      checkout?.mode === "real" && checkout.publishableKey
        ? loadStripe(checkout.publishableKey)
        : null,
    [checkout],
  );

  return (
    <div>
      <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase mb-2">Payment</h2>
      <p className="text-on-surface-variant mb-10">
        Pay the rental, tax, and refundable $200 security deposit today.
      </p>

      <div className="bg-surface-container-high p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="receipt_long" className="text-primary text-xl" />
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Payment Summary</span>
        </div>
        {checkout ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Rental ({DURATION_LABELS[formData.duration]})</span><span className="font-bold">{checkout.display.rental}</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Texas Motor Vehicle Rental Tax</span><span className="font-bold">{checkout.display.tax}</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Security Deposit <span className="text-[10px]">(refundable, charged today)</span></span><span className="font-bold">{checkout.display.deposit}</span></div>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between text-lg"><span className="font-headline font-bold uppercase">Total Today</span><span className="text-primary font-headline font-bold">{checkout.display.total}</span></div>
          </div>
        ) : (
          <p className="text-on-surface-variant text-sm">Securing your time and calculating the final total…</p>
        )}
      </div>

      {checkout && (
        <p role="status" className={`mb-6 text-sm font-medium ${expired ? "text-error" : "text-on-surface-variant"}`}>
          {expired
            ? "This 15-minute checkout hold expired. Go back to review and start payment again."
            : `Your selected time is held for ${holdClock}.`}
        </p>
      )}

      {error && (
        <div>
          <p role="alert" className="text-error text-sm font-medium mb-6">{error}</p>
          <button type="button" onClick={releaseAndGoBack} disabled={leaving} className="w-full min-h-[44px] bg-surface-container-highest py-4 font-headline font-bold uppercase tracking-widest disabled:opacity-50">Back to Review</button>
        </div>
      )}

      {checkout?.mode === "demo" && (
        <DemoPaymentForm checkout={checkout} onBack={releaseAndGoBack} onSuccess={onSuccess} expired={expired} />
      )}
      {checkout?.mode === "real" && stripePromise && checkout.rental.clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: checkout.rental.clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#f97316",
                colorBackground: "#1d1d1d",
                colorText: "#ffffff",
                colorDanger: "#ef4444",
                borderRadius: "0px",
              },
            },
          }}
        >
          <RealPaymentForm checkout={checkout} onBack={releaseAndGoBack} onSuccess={onSuccess} expired={expired} />
        </Elements>
      )}
    </div>
  );
}
