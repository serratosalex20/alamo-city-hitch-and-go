"use client";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { BookingFormData } from "./BookingWizard";
import { PickupDatePicker } from "./PickupDatePicker";
import { PickupTimePicker } from "./PickupTimePicker";
import {
  formatBusinessDate,
  PICKUP_TIME_OPTIONS,
} from "@/lib/booking/schedule";
import { ALL_DURATIONS, DURATION_LABELS } from "@/lib/booking/pricing";
import { trailers } from "@/lib/data/trailers";
import { requestInputSchema } from "@/lib/pickup-requests/validation";
import { buildRequestedSchedule } from "@/lib/pickup-requests/schedule";
import type { PickupRequestInput } from "@/lib/pickup-requests/types";
const outsideOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2),
    minute = i % 2 ? "30" : "00";
  return {
    value: `${String(hour).padStart(2, "0")}:${minute}`,
    label: `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`,
  };
}).filter((o) => !PICKUP_TIME_OPTIONS.some((p) => p.value === o.value));
const fieldClass =
  "w-full min-h-11 bg-surface-container-high p-3 border border-outline-variant focus-visible:outline-2 focus-visible:outline-primary-action";
export function PickupRequestDialog({
  open,
  initialDetails,
  onClose,
}: {
  open: boolean;
  initialDetails: Partial<BookingFormData>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<PickupRequestInput>(() => ({
    submissionKey: crypto.randomUUID(),
    firstName: initialDetails.firstName ?? "",
    lastName: initialDetails.lastName ?? "",
    email: initialDetails.email ?? "",
    phone: initialDetails.phone ?? "",
    trailerId: initialDetails.trailerId ?? "",
    date: initialDetails.date ?? "",
    time: "",
    duration: initialDetails.duration ?? "fullDay",
    message: "",
  }));
  const [month, setMonth] = useState(() =>
    (draft.date || formatBusinessDate(Date.now())).slice(0, 7),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState(""),
    [website, setWebsite] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const element = dialog.current;
    if (open) {
      element?.showModal();
      const timer = setInterval(() => setClock(Date.now()), 30000);
      return () => clearInterval(timer);
    }
    element?.close();
  }, [open]);
  const times = useMemo(
    () =>
      outsideOptions.filter((o) => {
        try {
          buildRequestedSchedule(draft.date, o.value, draft.duration, clock);
          return true;
        } catch {
          return false;
        }
      }),
    [draft.date, draft.duration, clock],
  );
  function change(patch: Partial<PickupRequestInput>) {
    setDraft((d) => ({ ...d, ...patch, submissionKey: crypto.randomUUID() }));
    setError("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const parsed = requestInputSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }
    try {
      buildRequestedSchedule(draft.date, draft.time, draft.duration);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Choose a valid time.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/pickup-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, website }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok)
        throw new Error(result.error ?? "Your request could not be saved.");
      setReceipt(result.requestId);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your request could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      id="pickup-request-dialog"
      aria-labelledby="pickup-request-title"
      aria-describedby="pickup-request-description"
      onCancel={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[90dvh] overflow-y-auto bg-surface-container-low text-on-surface p-5 sm:p-7 border border-outline-variant shadow-2xl backdrop:bg-black/75"
    >
      <div className="flex justify-between gap-4 items-start">
        <h2
          id="pickup-request-title"
          className="font-headline text-2xl uppercase"
        >
          Request a pickup time
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close pickup request"
          className="min-h-11 min-w-11 underline focus-visible:outline-2 focus-visible:outline-primary-action"
        >
          Close
        </button>
      </div>
      <p
        id="pickup-request-description"
        className="text-sm text-on-surface-variant mt-2 mb-5"
      >
        Normal pickups are 8 AM–6 PM daily, Central Time. Request another time
        and we’ll let you know if we can accommodate it.
      </p>
      {receipt ? (
        <div role="status" className="space-y-4">
          <h3 className="font-bold text-lg">Request received</h3>
          <p>
            Your contact details and request have been saved. We’ll email you
            after review.
          </p>
          <p className="text-sm text-on-surface-variant">
            No reservation or charge has been made. Reference:{" "}
            {receipt.slice(0, 8).toUpperCase()}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="underline min-h-11"
          >
            Return to booking
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {(["firstName", "lastName", "email", "phone"] as const).map(
                (key) => (
                  <div key={key}>
                    <label
                      htmlFor={`request-${key}`}
                      className="block text-sm mb-1"
                    >
                      {
                        {
                          firstName: "First name",
                          lastName: "Last name",
                          email: "Email",
                          phone: "Phone",
                        }[key]
                      }{" "}
                      *
                    </label>
                    <input
                      id={`request-${key}`}
                      value={draft[key]}
                      onChange={(e) => change({ [key]: e.target.value })}
                      required
                      maxLength={key === "email" ? 254 : 80}
                      type={
                        key === "email"
                          ? "email"
                          : key === "phone"
                            ? "tel"
                            : "text"
                      }
                      autoComplete={
                        {
                          firstName: "given-name",
                          lastName: "family-name",
                          email: "email",
                          phone: "tel",
                        }[key]
                      }
                      className={fieldClass}
                    />
                  </div>
                ),
              )}
            </div>
            <div>
              <label htmlFor="request-trailer" className="block text-sm mb-1">
                Trailer *
              </label>
              <select
                id="request-trailer"
                value={draft.trailerId}
                onChange={(e) => change({ trailerId: e.target.value })}
                required
                className={fieldClass}
              >
                {trailers
                  .filter((t) => t.status !== "coming_soon")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="request-date" className="block text-sm mb-1">
                Preferred pickup date *
              </label>
              <PickupDatePicker
                id="request-date"
                value={draft.date}
                month={month}
                today={formatBusinessDate(clock)}
                onMonthChange={setMonth}
                onChange={(date) => change({ date, time: "" })}
              />
            </div>
            <div>
              <label htmlFor="request-time" className="block text-sm mb-1">
                Requested time *
              </label>
              <PickupTimePicker
                id="request-time"
                value={draft.time}
                options={times}
                disabled={!draft.date}
                onChange={(time) => change({ time })}
                placeholder={
                  draft.date ? "Choose a requested time" : "Choose a date first"
                }
              />
              <p
                id="request-time-help"
                className="text-xs text-on-surface-variant mt-2"
              >
                Central Time · subject to owner approval and trailer
                availability.
              </p>
            </div>
            <div>
              <label htmlFor="request-duration" className="block text-sm mb-1">
                Rental duration *
              </label>
              <select
                id="request-duration"
                value={draft.duration}
                onChange={(e) =>
                  change({
                    duration: e.target.value as PickupRequestInput["duration"],
                  })
                }
                className={fieldClass}
              >
                {ALL_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {DURATION_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="request-message" className="block text-sm mb-1">
                Anything else we should know?{" "}
                <span className="text-on-surface-variant">(optional)</span>
              </label>
              <textarea
                id="request-message"
                value={draft.message}
                onChange={(e) => change({ message: e.target.value })}
                maxLength={1000}
                rows={3}
                className={fieldClass}
              />
            </div>
            <div hidden aria-hidden="true">
              <label>
                Website
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>
            <p className="text-xs text-on-surface-variant">
              We’ll use your details to respond to this request. No payment or
              account is required.{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Privacy notice
              </a>
            </p>
            {error && (
              <p role="alert" className="text-error">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-12 bg-primary-action text-white px-5 py-3 font-bold disabled:opacity-50"
            >
              {busy ? "Saving request…" : "Send pickup request"}
            </button>
          </fieldset>
        </form>
      )}
    </dialog>
  );
}
