"use client";

import type { BookingFormData } from "@/app/book/page";
import type { RentalDuration } from "@/types/models";

interface Props {
  formData: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const durations: { value: RentalDuration; label: string; description: string }[] = [
  { value: 4, label: "4 Hours", description: "Quick local haul" },
  { value: 12, label: "12 Hours", description: "Half-day project" },
  { value: 24, label: "24 Hours", description: "Full day rental" },
  { value: 36, label: "36 Hours", description: "Extended project" },
];

export function StepDateTime({ formData, updateForm, onNext, onBack }: Props) {
  const today = new Date().toISOString().split("T")[0];

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
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Pickup Date
          </label>
          <input
            type="date"
            min={today}
            value={formData.date}
            onChange={(e) => updateForm({ date: e.target.value })}
            className="w-full bg-surface-container-low text-on-surface font-body py-4 px-5 ghost-border focus:border-b-2 focus:border-primary-action outline-none transition-all"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Pickup Time
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => updateForm({ time: e.target.value })}
            className="w-full bg-surface-container-low text-on-surface font-body py-4 px-5 ghost-border focus:border-b-2 focus:border-primary-action outline-none transition-all"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Rental Duration
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {durations.map((d) => (
              <button
                key={d.value}
                onClick={() => updateForm({ duration: d.value })}
                className={`p-4 text-center transition-all ${
                  formData.duration === d.value
                    ? "bg-primary-action text-white"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                }`}
              >
                <span className="block font-headline font-bold text-lg">
                  {d.label}
                </span>
                <span className="block text-[10px] uppercase tracking-wider opacity-70 mt-1">
                  {d.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex gap-4 mt-12">
        <button
          onClick={onBack}
          className="flex-1 bg-surface-container-highest text-on-surface py-4 font-headline font-bold uppercase tracking-widest hover:bg-surface-bright transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!formData.date || !formData.time}
          className="flex-1 bg-primary-action text-white py-4 font-headline font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-800 transition-all active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
