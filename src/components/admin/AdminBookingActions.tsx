"use client";

import { depositSelection } from "@/lib/booking/deposit-selection";
import { InspectionPhotoPicker } from "./InspectionPhotoPicker";
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
  const [retainDollars, setRetainDollars] = useState("0");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const settlement = depositSelection(retainDollars, props.depositAmount);

  async function act(action: string) {
    setBusy(action);
    setMessage(null);
    try {
      const amountCents = action === "retain_deposit" ? settlement?.amountCents : undefined;
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

  async function uploadPhotos(data: FormData): Promise<boolean> {
    setBusy("photos");
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/bookings/${props.bookingId}/inspection`, {
        method: "POST",
        body: data,
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Photo upload failed.");
      setMessage({ ok: true, text: "Inspection photos saved." });
      router.refresh();
      return true;
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Photo upload failed." });
      return false;
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
      {needsPrePhotos && <InspectionPhotoPicker phase="pre" savedCount={props.prePhotoCount} disabled={busy !== null} uploading={busy === "photos"} onUpload={uploadPhotos} />}
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
      {needsPostPhotos && <>
        <InspectionPhotoPicker phase="post" savedCount={props.postPhotoCount} disabled={busy !== null} uploading={busy === "photos"} onUpload={uploadPhotos} />
        <div className="space-y-3">
          <label htmlFor="retain-amount" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Amount to retain (maximum ${(props.depositAmount / 100).toFixed(2)})</label>
          <input id="retain-amount" type="number" min="0" max={props.depositAmount / 100} step="0.01" disabled={busy !== null} value={retainDollars} onChange={(event) => { setRetainDollars(event.target.value); setMessage(null); }} className="w-full bg-surface-container-high p-3" />
          <p className="text-sm text-on-surface-variant">Enter 0 to return the full deposit. Enter a greater amount to retain it and return the remainder. A decision note is required when retaining money.</p>
          {settlement ? <p aria-live="polite">Retain: ${(settlement.retainedCents / 100).toFixed(2)} · Return to renter: ${(settlement.returnedCents / 100).toFixed(2)}</p> : <p role="alert" className="text-error">Enter an amount from $0 to ${(props.depositAmount / 100).toFixed(2)}, with up to two decimal places.</p>}
          <button disabled={busy !== null || props.postPhotoCount === 0 || !settlement || (settlement.retainedCents > 0 && !note.trim())} onClick={() => settlement && act(settlement.action)} className={actionClass}>
            {busy === "release_deposit" || busy === "retain_deposit" ? "Processing…" : "Process Deposit"}
          </button>
        </div>
      </>}

      {props.status === "completed" && <p className="text-sm text-green-400">Return is complete. Deposit outcome: {props.depositStatus.replaceAll("_", " ")}.</p>}
      {message && <p role="status" className={`text-sm ${message.ok ? "text-green-400" : "text-error"}`}>{message.text}</p>}
    </section>
  );
}
