"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BookingStatus,
  DepositStatus,
  ReturnReminderStatus,
} from "@/types/models";

interface Props {
  bookingId: string;
  status: BookingStatus;
  depositStatus: DepositStatus;
  depositAmount: number;
  prePhotoCount: number;
  postPhotoCount: number;
  returnReminderStatus?: ReturnReminderStatus;
  returnReminderScheduledAt?: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "medium",
  timeStyle: "short",
});

export function AdminBookingActions(props: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [retainDollars, setRetainDollars] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function act(action: string) {
    setBusy(action);
    setMessage(null);
    try {
      const amountCents = retainDollars ? Math.round(Number(retainDollars) * 100) : undefined;
      const response = await fetch(`/api/admin/bookings/${props.bookingId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note, amountCents }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        returnReminderStatus?: ReturnReminderStatus;
      };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Booking update failed.");
      setMessage({
        ok: true,
        text: result.returnReminderStatus === "failed"
          ? "Booking updated, but the return reminder needs to be retried."
          : "Booking updated.",
      });
      router.refresh();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Booking update failed." });
    } finally {
      setBusy(null);
    }
  }

  async function uploadPhotos(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("photos");
    setMessage(null);
    const form = event.currentTarget;
    try {
      const response = await fetch(`/api/admin/bookings/${props.bookingId}/inspection`, {
        method: "POST",
        body: new FormData(form),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Photo upload failed.");
      setMessage({ ok: true, text: "Inspection photos saved." });
      form.reset();
      router.refresh();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Photo upload failed." });
    } finally {
      setBusy(null);
    }
  }

  const actionClass = "min-h-[44px] px-5 py-3 bg-primary-action text-white font-headline font-bold uppercase tracking-widest text-xs disabled:opacity-40";
  const secondaryClass = "min-h-[44px] px-5 py-3 bg-surface-container-high text-white font-headline font-bold uppercase tracking-widest text-xs disabled:opacity-40";
  const needsPrePhotos = ["confirmed", "deposit_action_required", "ready_for_pickup"].includes(props.status);
  const needsPostPhotos = props.status === "return_inspection";

  return (
    <section className="space-y-5 bg-surface-container-low p-6 ghost-border" aria-labelledby="owner-actions">
      <h2 id="owner-actions" className="font-headline text-2xl font-bold uppercase">Owner Actions</h2>
      {(props.status === "under_review" || props.status === "pending_insurance" || props.status === "return_inspection") && (
        <div><label htmlFor="owner-note" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Inspection / Decision Note</label><textarea id="owner-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="w-full bg-surface-container-high p-3 outline-none focus:ring-2 focus:ring-primary" /></div>
      )}
      {props.status === "under_review" && <div className="flex flex-wrap gap-3"><button disabled={busy !== null} onClick={() => act("approve")} className={actionClass}>Approve Booking</button><button disabled={busy !== null} onClick={() => act("request_insurance_resubmission")} className={secondaryClass}>Request New Insurance</button><button disabled={busy !== null} onClick={() => act("reject")} className={secondaryClass}>Reject</button></div>}
      {props.status === "confirmed" && <div><button disabled={busy !== null} onClick={() => act("request_deposit")} className={actionClass}>Request $200 Deposit</button><p className="text-xs text-on-surface-variant mt-2">The server allows this within 48 hours of pickup to protect the authorization window.</p></div>}
      {props.status === "deposit_action_required" && <p className="text-sm text-primary">Awaiting customer confirmation of the security deposit.</p>}
      {needsPrePhotos && <form onSubmit={uploadPhotos} className="space-y-3 border-t border-white/10 pt-5"><input type="hidden" name="phase" value="pre" /><label htmlFor="pre-files" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pre-rental Inspection Photos ({props.prePhotoCount})</label><input id="pre-files" name="files" type="file" accept="image/jpeg,image/png,image/webp" multiple required className="block w-full text-sm" /><button disabled={busy !== null} className={secondaryClass}>{busy === "photos" ? "Uploading…" : "Upload Pre-rental Photos"}</button></form>}
      {props.status === "ready_for_pickup" && <button disabled={busy !== null || props.prePhotoCount === 0} onClick={() => act("mark_picked_up")} className={actionClass}>Mark Picked Up</button>}
      {props.status === "active" && (
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Return reminder: {props.returnReminderStatus?.replaceAll("_", " ") ?? "not scheduled"}
            {props.returnReminderScheduledAt ? ` · ${dateTimeFormatter.format(new Date(props.returnReminderScheduledAt))}` : ""}
          </p>
          <div className="flex flex-wrap gap-3">
            {(!props.returnReminderStatus || ["failed", "not_configured", "cancel_failed"].includes(props.returnReminderStatus)) && (
              <button disabled={busy !== null} onClick={() => act("retry_return_reminder")} className={secondaryClass}>Retry Return Reminder</button>
            )}
            <button disabled={busy !== null} onClick={() => act("mark_returned")} className={actionClass}>Mark Returned</button>
          </div>
        </div>
      )}
      {needsPostPhotos && <><form onSubmit={uploadPhotos} className="space-y-3 border-t border-white/10 pt-5"><input type="hidden" name="phase" value="post" /><label htmlFor="post-files" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Return Inspection Photos ({props.postPhotoCount})</label><input id="post-files" name="files" type="file" accept="image/jpeg,image/png,image/webp" multiple required className="block w-full text-sm" /><button disabled={busy !== null} className={secondaryClass}>{busy === "photos" ? "Uploading…" : "Upload Return Photos"}</button></form><div className="grid gap-3 md:grid-cols-[1fr_auto]"><div><label htmlFor="retain-amount" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Amount to retain (maximum ${(props.depositAmount / 100).toFixed(2)})</label><input id="retain-amount" type="number" min="0.01" max={props.depositAmount / 100} step="0.01" value={retainDollars} onChange={(event) => setRetainDollars(event.target.value)} className="w-full bg-surface-container-high p-3" /></div><div className="flex items-end gap-3 flex-wrap"><button disabled={busy !== null || props.postPhotoCount === 0} onClick={() => act("release_deposit")} className={actionClass}>Release Full Deposit</button><button disabled={busy !== null || props.postPhotoCount === 0 || !retainDollars} onClick={() => act("retain_deposit")} className={secondaryClass}>Retain Documented Amount</button></div></div></>}
      {props.status === "completed" && <p className="text-sm text-green-400">Return is complete. Deposit outcome: {props.depositStatus.replaceAll("_", " ")}.</p>}
      {message && <p role="status" className={`text-sm ${message.ok ? "text-green-400" : "text-error"}`}>{message.text}</p>}
    </section>
  );
}
