"use client";

import { useEffect, useState } from "react";
import { PickupDatePicker } from "@/components/booking/PickupDatePicker";
import type { BookingFormData } from "@/app/book/page";
import type { RentalDuration } from "@/types/models";
import { ALL_DURATIONS, DURATION_LABELS } from "@/lib/booking/pricing";
import {
  formatBusinessDate,
  PICKUP_HOURS_DESCRIPTION,
  type PickupDay,
} from "@/lib/booking/schedule";

interface Props {
  formData: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Sprint 3.4 — durations come from the pricing lib so the wizard and
// the /rates page can't drift. Order is fixed by ALL_DURATIONS. The
// "Two-week" block ships with a free day baked in (15 calendar days).
const durationDescriptions: Record<RentalDuration, string> = {
  halfDay: "12-hour block",
  fullDay: "24-hour block",
  oneWeek: "One-week rental",
  twoWeeks: "Two-week rental — includes 1 free day (15 days)",
};

export function StepDateTime({ formData, updateForm, onNext, onBack }: Props) {
  const [clock, setClock] = useState(() => Date.now());
  const [month, setMonth] = useState(() => (formData.date || formatBusinessDate(Date.now())).slice(0, 7));
  const [refresh, setRefresh] = useState(0);
  const [calendar, setCalendar] = useState<{
    key: string; days: PickupDay[]; checkedAtMs: number; receivedAtMs: number; error?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calendarKey = `${formData.trailerId}:${formData.duration}:${month}`;
  const calendarMatches = calendar?.key === calendarKey;
  const calendarLoading = !calendarMatches;
  const currentTime = calendar ? calendar.checkedAtMs + Math.max(0, clock - calendar.receivedAtMs) : clock;
  const today = formatBusinessDate(currentTime);
  const availableDays = calendarMatches && !calendar.error
    ? calendar.days.map(day => ({ ...day, times: day.times.filter(time => time.startTimeMs > currentTime) }))
    : [];
  const timeOptions = availableDays.find(day => day.date === formData.date)?.times ?? [];
  const selectedTimeAvailable = timeOptions.some(option => option.value === formData.time);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCalendar() {
      const receivedAtMs = Date.now();
      try {
        const query = new URLSearchParams({ trailerId: formData.trailerId, duration: formData.duration, month });
        const response = await fetch(`/api/availability?${query}`, { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error ?? "We could not load available pickups.");
        if (!controller.signal.aborted) {
          setCalendar({ key: calendarKey, days: result.days, checkedAtMs: result.checkedAtMs, receivedAtMs });
          setClock(Date.now());
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          setCalendar({ key: calendarKey, days: [], checkedAtMs: receivedAtMs, receivedAtMs,
            error: failure instanceof Error ? failure.message : "We could not load available pickups. Please try again." });
        }
      }
    }
    void loadCalendar();
    return () => controller.abort();
  }, [calendarKey, formData.trailerId, formData.duration, month, refresh]);

  useEffect(() => {
    const tick = window.setInterval(() => setClock(Date.now()), 1000);
    const reload = () => { if (!document.hidden) setRefresh(value => value + 1); };
    const polling = window.setInterval(reload, 30_000);
    window.addEventListener("focus", reload);
    return () => { window.clearInterval(tick); window.clearInterval(polling); window.removeEventListener("focus", reload); };
  }, []);

  // A changed duration or refreshed inventory must never leave a hidden stale selection.
  useEffect(() => {
    if (calendarMatches && !calendar.error && formData.time && !selectedTimeAvailable) {
      updateForm({ time: "" });
    }
  }, [calendarMatches, calendar?.error, formData.time, selectedTimeAvailable, updateForm]);

  async function checkAvailability() {
    if (!formData.date || !selectedTimeAvailable || checking) return;
    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trailerId: formData.trailerId,
          date: formData.date,
          time: formData.time,
          duration: formData.duration,
        }),
      });
      const result = (await response.json()) as { ok: boolean; available?: boolean; error?: string };
      if (!result.ok || !result.available) {
        setError(result.error ?? "That trailer is not available for the selected time.");
        updateForm({ time: "" });
        setRefresh(value => value + 1);
        return;
      }
      onNext();
    } catch {
      setError("We could not check availability. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase mb-2">
        Pick Your Schedule
      </h2>
      <p className="text-on-surface-variant mb-10">
        Choose your pickup date, time, and rental duration.
      </p>

      <div className="space-y-8">
        {/* Date */}
        <div>
          <label
            htmlFor="booking-date"
            className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3"
          >
            Pickup Date <span className="text-error" aria-hidden="true">*</span>
          </label>
          <PickupDatePicker
            value={formData.date}
            month={month}
            today={today}
            days={availableDays}
            loading={calendarLoading}
            error={calendarMatches ? calendar.error : undefined}
            onRetry={() => setRefresh(value => value + 1)}
            onMonthChange={(value) => { setMonth(value); updateForm({ date: "", time: "" }); setError(null); }}
            onChange={(date) => { updateForm({ date, time: "" }); setError(null); }}
          />
        </div>

        {/* Time */}
        <div>
          <label
            htmlFor="booking-time"
            className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3"
          >
            Pickup Time <span className="text-error" aria-hidden="true">*</span>
          </label>
          <select
            id="booking-time"
            required
            disabled={!formData.date || calendarLoading || timeOptions.length === 0}
            value={selectedTimeAvailable ? formData.time : ""}
            onChange={(e) => { updateForm({ time: e.target.value }); setError(null); }}
            aria-describedby="booking-time-help"
            className="w-full bg-surface-container-low text-on-surface font-body py-4 px-5 ghost-border focus:border-b-2 focus:border-primary-action outline-none transition-all"
          >
            <option value="" disabled>
              {calendarLoading ? "Checking available times…" : !formData.date ? "Choose a date first" : timeOptions.length === 0 ? "No available times — choose another date" : "Choose a pickup time"}
            </option>
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p
            id="booking-time-help"
            className="mt-2 text-xs text-on-surface-variant"
          >
            {PICKUP_HOURS_DESCRIPTION} Only available times are shown.
          </p>
        </div>

        {/* Duration */}
        <fieldset>
          <legend className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Rental Duration
          </legend>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="radiogroup" aria-label="Select rental duration">
            {ALL_DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => { updateForm({ duration: d, time: "" }); setError(null); }}
                role="radio"
                aria-checked={formData.duration === d}
                aria-label={`${DURATION_LABELS[d]} — ${durationDescriptions[d]}`}
                className={`p-4 min-h-[44px] text-center transition-all ${
                  formData.duration === d
                    ? "bg-primary-action text-white"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                }`}
              >
                <span className="block font-headline font-bold text-lg">
                  {DURATION_LABELS[d]}
                </span>
                <span className="block text-[10px] uppercase tracking-wider opacity-70 mt-1">
                  {durationDescriptions[d]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {calendarMatches && calendar.error && (
        <div role="alert" className="mt-8 border-l-4 border-error bg-error/10 px-4 py-3 text-sm text-error">
          <p>{calendar.error}</p>
          <button type="button" onClick={() => setRefresh(value => value + 1)} className="underline min-h-[44px]">Try Again</button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-8 border-l-4 border-error bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {/* Nav */}
      <div className="flex gap-4 mt-12">
        <button
          onClick={onBack}
          className="flex-1 min-h-[44px] bg-surface-container-highest text-on-surface py-4 font-headline font-bold uppercase tracking-widest hover:bg-surface-bright transition-all"
        >
          Back
        </button>
        <button
          onClick={checkAvailability}
          disabled={!formData.date || !selectedTimeAvailable || checking}
          className="flex-1 min-h-[44px] bg-primary-action text-white py-4 font-headline font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-[0.98]"
        >
          {checking ? "Checking…" : "Check Availability"}
        </button>
      </div>
    </div>
  );
}
