"use client";

import { useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { pickupMonthDates, type PickupDay } from "@/lib/booking/schedule";

interface Props {
  value: string;
  month: string;
  today: string;
  days: PickupDay[];
  loading: boolean;
  error?: string;
  onMonthChange: (month: string) => void;
  onChange: (date: string) => void;
  onRetry: () => void;
}

function displayDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

export function PickupDatePicker({ value, month, today, days, loading, error, onMonthChange, onChange, onRetry }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dates = pickupMonthDates(month);
  const firstWeekday = new Date(`${month}-01T12:00:00Z`).getUTCDay();
  const availableDates = new Set(days.filter(day => day.times.length > 0).map(day => day.date));
  const monthLabel = displayDate(`${month}-01`, { month: "long", year: "numeric" });

  function moveMonth(offset: number) {
    const next = new Date(`${month}-01T12:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + offset);
    onMonthChange(next.toISOString().slice(0, 7));
  }

  return (
    <>
      <button
        id="booking-date"
        type="button"
        aria-haspopup="dialog"
        aria-label={value ? `Pickup date: ${displayDate(value, { dateStyle: "long" })}` : "Choose a pickup date"}
        onClick={() => dialog.current?.showModal()}
        className="w-full flex items-center justify-between bg-surface-container-low text-on-surface font-body py-4 px-5 ghost-border focus-visible:outline-2 focus-visible:outline-primary-action"
      >
        {value ? displayDate(value, { year: "numeric", month: "2-digit", day: "2-digit" }) : "Choose an available date"}
        <CalendarDays size={20} aria-hidden="true" />
      </button>
      <dialog ref={dialog} aria-labelledby="pickup-calendar-heading" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm max-h-[90dvh] overflow-y-auto bg-surface-container text-on-surface p-5 shadow-xl backdrop:bg-black/70">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 id="pickup-calendar-heading" className="font-headline font-bold text-xl">Choose Pickup Date</h3>
          <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close calendar" className="p-3 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary-action"><X size={20} /></button>
        </div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <button type="button" disabled={month <= today.slice(0, 7)} onClick={() => moveMonth(-1)} aria-label="Previous month" className="p-3 disabled:opacity-25 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary-action"><ChevronLeft size={20} /></button>
          <p aria-live="polite" className="font-bold">{monthLabel}</p>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="p-3 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary-action"><ChevronRight size={20} /></button>
        </div>
        <div className="grid grid-cols-7 text-center gap-1" role="group" aria-label={monthLabel} aria-busy={loading}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <span key={day} className="text-xs text-on-surface-variant pb-2" aria-hidden="true">{day}</span>)}
          {Array.from({ length: firstWeekday }, (_, i) => <span key={`blank-${i}`} />)}
          {dates.map(date => {
            const unavailable = loading || Boolean(error) || !availableDates.has(date);
            return (
              <button key={date} type="button" disabled={unavailable} aria-pressed={value === date}
                aria-label={`${displayDate(date, { dateStyle: "full" })}${unavailable ? ", unavailable" : ""}`}
                onClick={() => { onChange(date); dialog.current?.close(); }}
                className={`min-h-[44px] font-bold focus-visible:outline-2 focus-visible:outline-primary-action disabled:opacity-25 disabled:cursor-not-allowed disabled:line-through ${value === date ? "bg-primary-action text-white" : "enabled:hover:bg-surface-container-high"}`}
              >{Number(date.slice(-2))}</button>
            );
          })}
        </div>
        <p role="status" className="text-sm text-on-surface-variant mt-4">
          {loading ? "Checking available dates…" : error ? error : availableDates.size === 0 ? "No available pickups this month for this rental length. Try another month or a shorter rental." : "Unavailable dates are crossed out. Times depend on your trailer and rental length."}
        </p>
        {error && <button type="button" onClick={onRetry} className="mt-3 min-h-[44px] px-4 bg-primary-action text-white">Try Again</button>}
      </dialog>
    </>
  );
}
