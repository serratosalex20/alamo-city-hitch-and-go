"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";

interface DepositDetails {
  ok: boolean;
  clientSecret?: string;
  publishableKey?: string;
  method?: "authorization" | "refundable_charge";
  status?: string;
  error?: string;
}

function DepositForm({ bookingId, method }: { bookingId: string; method?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/${bookingId}/documents?deposit=return`,
      },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message ?? "The deposit could not be confirmed.");
      setBusy(false);
      return;
    }
    const response = await fetch(`/api/bookings/${bookingId}/deposit`, { method: "POST" });
    const body = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !body.ok) {
      setError(body.error ?? "The deposit status could not be updated.");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={confirm} className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        {method === "refundable_charge"
          ? "This longer rental uses a refundable $200 deposit charge. Any clean-return refund is initiated manually after inspection."
          : "Your bank requires confirmation of the $200 authorization. This is a temporary hold, not a rental charge."}
      </p>
      <div className="bg-white p-4"><PaymentElement /></div>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <button disabled={!stripe || busy} className="min-h-[44px] bg-primary-action px-6 py-3 font-headline font-bold uppercase tracking-widest text-white disabled:opacity-40">
        {busy ? "Confirming…" : "Confirm $200 Deposit"}
      </button>
    </form>
  );
}

export function DepositConfirmation({ bookingId }: { bookingId: string }) {
  const [details, setDetails] = useState<DepositDetails | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/bookings/${bookingId}/deposit`)
      .then(async (response) => ({ response, body: (await response.json()) as DepositDetails }))
      .then(({ response, body }) => {
        if (!active) return;
        setDetails(response.ok ? body : { ok: false, error: body.error ?? "Deposit confirmation could not load." });
      })
      .catch(() => active && setDetails({ ok: false, error: "Deposit confirmation could not load." }));
    return () => { active = false; };
  }, [bookingId]);

  const stripePromise = useMemo(
    () => details?.publishableKey ? loadStripe(details.publishableKey) : null,
    [details?.publishableKey],
  );

  if (!details) return <p className="text-sm text-on-surface-variant">Loading secure deposit confirmation…</p>;
  if (!details.ok || !details.clientSecret || !stripePromise) {
    return <p role="alert" className="text-sm text-error">{details.error ?? "Deposit confirmation is unavailable."}</p>;
  }
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: details.clientSecret, appearance: { theme: "night" } }}>
      <DepositForm bookingId={bookingId} method={details.method} />
    </Elements>
  );
}
