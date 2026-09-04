import { DURATION_HOURS } from "@/lib/booking/pricing";
import type { RentalDuration } from "@/types/models";

export const BUSINESS_TIME_ZONE = "America/Chicago";
export const PICKUP_OPEN_HOUR = 6;
export const PICKUP_CLOSE_HOUR = 22;
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

function partsAt(timestamp: number, timeZone: string): DateTimeParts {
  const values = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(new Date(timestamp))
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
    desired.minute > 59
  ) {
    throw new Error("Pickup times are available daily from 6:00 AM to 9:59 PM.");
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
    const actual = partsAt(candidate, BUSINESS_TIME_ZONE);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    candidate += desiredAsUtc - actualAsUtc;
  }

  const roundTrip = partsAt(candidate, BUSINESS_TIME_ZONE);
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
