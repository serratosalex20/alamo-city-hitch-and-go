import { DURATION_HOURS } from "@/lib/booking/pricing";
import type { RentalDuration } from "@/types/models";

export const BUSINESS_TIME_ZONE = "America/Chicago";
export const PICKUP_OPEN_HOUR = 6;
export const PICKUP_CLOSE_HOUR = 22;
export const PICKUP_INTERVAL_MINUTES = 30;
export const CHECKOUT_HOLD_MINUTES = 15;
export const DOCUMENT_DEADLINE_HOURS = 24;
export const RETURN_REVIEW_HOURS = 24;

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface PickupTimeOption {
  value: string;
  label: string;
}

export interface AvailablePickupTime extends PickupTimeOption {
  startTimeMs: number;
}

export interface PickupDay {
  date: string;
  times: AvailablePickupTime[];
}

function pickupTimeLabel(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * Explicit pickup choices keep the mobile UI and server rules in lockstep.
 * The final slot starts 30 minutes before closing so a pickup never begins
 * after the published operating window.
 */
export const PICKUP_TIME_OPTIONS: readonly PickupTimeOption[] = Array.from(
  {
    length:
      ((PICKUP_CLOSE_HOUR - PICKUP_OPEN_HOUR) * 60) /
      PICKUP_INTERVAL_MINUTES,
  },
  (_, index) => {
    const totalMinutes =
      PICKUP_OPEN_HOUR * 60 + index * PICKUP_INTERVAL_MINUTES;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return {
      value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      label: pickupTimeLabel(hour, minute),
    };
  },
);

export const PICKUP_HOURS_DESCRIPTION = `Central Time · pickups every ${PICKUP_INTERVAL_MINUTES} minutes from ${PICKUP_TIME_OPTIONS[0].label} to ${PICKUP_TIME_OPTIONS.at(-1)!.label}.`;

// Reuse the formatter when checking every slot in a calendar month.
const businessDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partsAt(timestamp: number): DateTimeParts {
  const values = businessDateTimeFormatter.formatToParts(new Date(timestamp))
    .reduce<Record<string, number>>((result, part) => {
      if (part.type !== "literal") result[part.type] = Number(part.value);
      return result;
    }, {});

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

/** Converts a San Antonio wall-clock date/time to an unambiguous UTC instant. */
export function localPickupToUtc(date: string, time: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch) throw new Error("Enter a valid pickup date and time.");

  const desired: DateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
  if (
    desired.hour < PICKUP_OPEN_HOUR ||
    desired.hour >= PICKUP_CLOSE_HOUR ||
    desired.minute < 0 ||
    desired.minute > 59 ||
    desired.minute % PICKUP_INTERVAL_MINUTES !== 0
  ) {
    throw new Error(
      `Pickup times are available every ${PICKUP_INTERVAL_MINUTES} minutes from ${PICKUP_TIME_OPTIONS[0].label} to ${PICKUP_TIME_OPTIONS.at(-1)!.label}.`,
    );
  }

  const desiredAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let candidate = desiredAsUtc;

  // Two passes handle DST offsets without adding another date library.
  for (let pass = 0; pass < 2; pass += 1) {
    const actual = partsAt(candidate);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    candidate += desiredAsUtc - actualAsUtc;
  }

  const roundTrip = partsAt(candidate);
  if (Object.keys(desired).some((key) => roundTrip[key as keyof DateTimeParts] !== desired[key as keyof DateTimeParts])) {
    throw new Error("That local pickup time is not available. Choose another time.");
  }

  return new Date(candidate);
}

export function buildRentalSchedule(
  date: string,
  time: string,
  duration: RentalDuration,
  nowMs: number = Date.now(),
) {
  const start = localPickupToUtc(date, time);
  if (start.getTime() <= nowMs) {
    throw new Error("Pickup time must be in the future.");
  }
  const end = new Date(start.getTime() + DURATION_HOURS[duration] * 60 * 60 * 1000);
  return {
    startTime: start.toISOString(),
    startTimeMs: start.getTime(),
    endTime: end.toISOString(),
    endTimeMs: end.getTime(),
  };
}

export function formatBusinessDate(timestampMs: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestampMs));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** A bounded month of calendar dates; never normalize invalid months silently. */
export function pickupMonthDates(month: string): string[] {
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Choose a valid calendar month.");
  }
  const [year, monthNumber] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}
