"use client";

import { useEffect, useState } from "react";
import { PickupDatePicker } from "@/components/booking/PickupDatePicker";
import { PickupTimePicker } from "@/components/booking/PickupTimePicker";
import type { BookingFormData } from "@/app/book/page";
import type { RentalDuration } from "@/types/models";
import { ALL_DURATIONS, DURATION_LABELS } from "@/lib/booking/pricing";
import { formatBusinessDate, localPickupToUtc, PICKUP_HOURS_DESCRIPTION, PICKUP_TIME_OPTIONS } from "@/lib/booking/schedule";

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
  const today = formatBusinessDate(clock);
  const [month, setMonth] = useState(() => (formData.date || today).slice(0, 7));
  const timeOptions = formData.date ? PICKUP_TIME_OPTIONS.filter(option => localPickupToUtc(formData.date, option.value).getTime() > clock) : [];
  const selectedTimeAvailable = timeOptions.some(option => option.value === formData.time);

  useEffect(() => {
    const refresh = () => setClock(Date.now());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

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
            onMonthChange={setMonth}
            onChange={date => updateForm({ date, time: "" })}
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
          <PickupTimePicker
            value={formData.time}
            options={timeOptions}
            disabled={!formData.date}
            placeholder={!formData.date ? "Choose a date first" : timeOptions.length === 0 ? "No pickup times left — choose another date" : "Choose a pickup time"}
            onChange={time => updateForm({ time })}
          />
          <p id="booking-time-help" className="mt-2 text-xs text-on-surface-variant">{PICKUP_HOURS_DESCRIPTION}</p>
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
                onClick={() => updateForm({ duration: d })}
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

      {/* Nav */}
      <div className="flex gap-4 mt-12">
        <button
          onClick={onBack}
          className="flex-1 min-h-[44px] bg-surface-container-highest text-on-surface py-4 font-headline font-bold uppercase tracking-widest hover:bg-surface-bright transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!formData.date || !selectedTimeAvailable}
          className="flex-1 min-h-[44px] bg-primary-action text-white py-4 font-headline font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
