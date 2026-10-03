"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { pickupMonthDates, type PickupDay } from "@/lib/booking/schedule";
import styles from "./BookingPickers.module.css";

interface Props {
  id?: string;
  value: string;
  month: string;
  today: string;
  days?: PickupDay[];
  loading?: boolean;
  error?: string;
  onMonthChange: (month: string) => void;
  onChange: (date: string) => void;
  onRetry?: () => void;
}

function displayDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });
}

export function PickupDatePicker({
  id = "booking-date",
  value,
  month,
  today,
  days,
  loading,
  error,
  onMonthChange,
  onChange,
  onRetry,
}: Props) {
  const calendarId = `${id}-calendar`;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dates = pickupMonthDates(month);
  const firstWeekday = new Date(`${month}-01T12:00:00Z`).getUTCDay();
  const availableDates = new Set(
    days
      ? days.filter((day) => day.times.length > 0).map((day) => day.date)
      : dates.filter((date) => date >= today),
  );
  const monthLabel = displayDate(`${month}-01`, {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function moveMonth(offset: number) {
    const next = new Date(`${month}-01T12:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + offset);
    onMonthChange(next.toISOString().slice(0, 7));
  }

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={calendarId}
        aria-label={
          value
            ? `Pickup date: ${displayDate(value, { dateStyle: "long" })}`
            : "Choose a pickup date"
        }
        onClick={() => setOpen((value) => !value)}
        className="w-full min-h-[58px] flex items-center gap-3 text-left bg-surface-container-low text-on-surface font-body py-4 px-5 ghost-border cursor-pointer hover:border-primary-action focus-visible:outline-2 focus-visible:outline-primary-action"
      >
        <CalendarDays
          size={19}
          className="text-primary shrink-0"
          aria-hidden="true"
        />
        <span className="flex-1">
          {value
            ? displayDate(value, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            : "Choose a pickup date"}
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id={calendarId}
          role="dialog"
          aria-labelledby={`${calendarId}-heading`}
          className={`${styles.panel} ${styles.scrollArea} absolute top-full left-0 z-50 mt-2 w-full max-w-sm max-h-[min(28rem,65dvh)] overflow-y-auto border border-outline-variant bg-surface-container text-on-surface p-4 shadow-2xl`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3
              id={`${calendarId}-heading`}
              className="font-headline font-bold text-lg uppercase"
            >
              Pickup Date
            </h3>
            <button
              type="button"
              autoFocus
              onClick={close}
              aria-label="Close calendar"
              className="p-3 cursor-pointer hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary-action"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              disabled={month <= today.slice(0, 7)}
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
              className="p-3 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary-action"
            >
              <ChevronLeft size={20} />
            </button>
            <p aria-live="polite" className="font-bold">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
              className="p-3 cursor-pointer hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary-action"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div
            className="grid grid-cols-7 text-center gap-1"
            role="group"
            aria-label={monthLabel}
            aria-busy={loading}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span
                key={day}
                className="text-xs text-on-surface-variant pb-2"
                aria-hidden="true"
              >
                {day}
              </span>
            ))}
            {Array.from({ length: firstWeekday }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {dates.map((date) => {
              const unavailable =
                date < today ||
                loading ||
                Boolean(error) ||
                !availableDates.has(date);
              return (
                <button
                  key={date}
                  type="button"
                  disabled={unavailable}
                  aria-pressed={value === date}
                  data-picker-date={date}
                  aria-label={`${displayDate(date, { dateStyle: "full" })}${unavailable ? ", unavailable" : ""}`}
                  onKeyDown={(event) => {
                    const offset = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                    }[event.key];
                    if (offset === undefined) return;
                    event.preventDefault();
                    const buttons = Array.from(
                      event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
                        "[data-picker-date]",
                      ),
                    );
                    let index = buttons.indexOf(event.currentTarget) + offset;
                    while (
                      index >= 0 &&
                      index < buttons.length &&
                      buttons[index].disabled
                    )
                      index += Math.sign(offset);
                    buttons[index]?.focus();
                  }}
                  onClick={() => {
                    onChange(date);
                    close();
                  }}
                  className={`min-h-[44px] font-bold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary-action disabled:opacity-25 disabled:cursor-not-allowed disabled:line-through ${value === date ? "bg-primary-action text-white" : date === today ? "ring-1 ring-inset ring-outline-variant enabled:hover:bg-surface-container-high" : "enabled:hover:bg-surface-container-high"}`}
                >
                  {Number(date.slice(-2))}
                </button>
              );
            })}
          </div>
          <p
            role="status"
            className="text-xs leading-relaxed text-on-surface-variant mt-4 border-t border-outline-variant pt-3"
          >
            {loading
              ? "Checking available dates…"
              : error
                ? error
                : days
                  ? availableDates.size === 0
                    ? "No available pickups this month for this rental length. Try another month or a shorter rental."
                    : "Unavailable dates are crossed out. Times depend on your trailer and rental length."
                  : "Choose your pickup date. All times are in Central Time."}
          </p>
          {error && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 min-h-[44px] px-4 bg-primary-action text-white"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
