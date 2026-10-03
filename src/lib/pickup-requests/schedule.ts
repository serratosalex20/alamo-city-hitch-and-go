import {
  BUSINESS_TIME_ZONE,
  PICKUP_TIME_OPTIONS,
} from "@/lib/booking/schedule";
import { DURATION_HOURS } from "@/lib/booking/pricing";
import type { RentalDuration } from "@/types/models";
import type { RentalSchedule } from "./types";
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export function buildRequestedSchedule(
  date: string,
  time: string,
  duration: RentalDuration,
  nowMs = Date.now(),
): RentalSchedule {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(time)
  )
    throw new Error("Choose a valid date and a time in 30-minute increments.");
  if (PICKUP_TIME_OPTIONS.some((option) => option.value === time))
    throw new Error(
      "That time is within normal pickup hours. Please use regular booking.",
    );
  const [year, month, day] = date.split("-").map(Number),
    [hour, minute] = time.split(":").map(Number);
  const desired = { year, month, day, hour, minute };
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const matches: number[] = [];
  // Enumerate offsets rather than picking one side of a repeated local hour.
  for (let offset = -14 * 60; offset <= 14 * 60; offset += 30) {
    const candidate = wall + offset * 60000;
    const parts = Object.fromEntries(
      formatter.formatToParts(candidate).map((p) => [p.type, Number(p.value)]),
    );
    if (Object.entries(desired).every(([key, value]) => parts[key] === value))
      matches.push(candidate);
  }
  if (matches.length !== 1)
    throw new Error(
      "That local time is invalid or ambiguous due to the clock change. Please choose another time.",
    );
  const startTimeMs = matches[0];
  if (startTimeMs <= nowMs)
    throw new Error("Pickup time must be in the future.");
  if (!Object.hasOwn(DURATION_HOURS, duration))
    throw new Error("Choose a valid rental duration.");
  const endTimeMs = startTimeMs + DURATION_HOURS[duration] * 3600000;
  return {
    startTimeMs,
    endTimeMs,
    startTime: new Date(startTimeMs).toISOString(),
    endTime: new Date(endTimeMs).toISOString(),
  };
}
