"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function PickupRequestActions({
  id,
  pending,
  retryNeeded,
}: {
  id: string;
  pending: boolean;
  retryNeeded: boolean;
}) {
  const [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function act(action: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/pickup-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Unable to update request.");
      setMessage(
        data.delivery.failed
          ? "Saved. Email delivery needs a retry."
          : data.delivery.outstanding
            ? "Saved. Email delivery is still pending. Check the delivery status below."
            : "Saved. Notifications are up to date.",
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to update request.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-8 bg-surface-container-low p-6">
      <h2 className="font-headline text-2xl uppercase mb-4">Owner actions</h2>
      {pending && (
        <>
          <label htmlFor="decision-note" className="block mb-2">
            Note to renter
          </label>
          <textarea
            id="decision-note"
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-h-28 bg-surface-container p-3 mb-4"
          />
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy || !note.trim()}
              onClick={() => act("approved")}
              className="px-5 py-3 bg-primary-action text-white disabled:opacity-50"
            >
              Approve time
            </button>
            <button
              disabled={busy || !note.trim()}
              onClick={() => act("declined")}
              className="px-5 py-3 bg-surface-container-high disabled:opacity-50"
            >
              Decline time
            </button>
          </div>
          <p className="text-sm text-on-surface-variant mt-3">
            Approval permits this pickup time. Inventory is checked again at
            checkout.
          </p>
        </>
      )}
      {retryNeeded && (
        <button
          disabled={busy}
          onClick={() => act("retry_notifications")}
          className="underline min-h-11 mt-3"
        >
          Retry pending emails
        </button>
      )}
      {message && (
        <p role="status" className="mt-3">
          {message}
        </p>
      )}
    </section>
  );
}
