const HOUR_MS = 60 * 60 * 1000;
const MINIMUM_SCHEDULE_LEAD_MS = 60 * 1000;
const RESEND_MAX_SCHEDULE_MS = 30 * 24 * HOUR_MS;

export const RETURN_REMINDER_LEAD_MS = 2 * HOUR_MS;

export interface BookingOperationsContact {
  pickupAddress: string;
  pickupInstructions: string;
  supportPhone: string;
  supportEmail: string;
}

/**
 * Returns an ISO timestamp when Resend should schedule the reminder, or null
 * when the two-hour reminder time has already arrived and it should send now.
 */
export function returnReminderScheduledAt(
  endTimeMs: number,
  nowMs: number = Date.now(),
): string | null {
  if (!Number.isFinite(endTimeMs) || endTimeMs <= nowMs) {
    throw new Error("The scheduled return time must be in the future.");
  }
  const reminderTimeMs = endTimeMs - RETURN_REMINDER_LEAD_MS;
  if (reminderTimeMs <= nowMs + MINIMUM_SCHEDULE_LEAD_MS) return null;
  if (reminderTimeMs - nowMs > RESEND_MAX_SCHEDULE_MS) {
    throw new Error("The return reminder is more than 30 days away.");
  }
  return new Date(reminderTimeMs).toISOString();
}

export function pickupChecklist(contact: BookingOperationsContact): string[] {
  return [
    contact.pickupInstructions,
    "Bring the physical government-issued ID or driver's license used during verification.",
    "Bring current proof of insurance and show it to the representative before release.",
    "Complete a visual inspection with the representative and review the pre-rental condition photos.",
    "Wait for the representative to verify the coupler, safety chains, lights, and brake connection before moving the trailer.",
    "A trailer lock and key are provided. Return both. A documented replacement cost may be deducted from the deposit if either is lost or damaged.",
    `Questions or delays: call or text ${contact.supportPhone}, or email ${contact.supportEmail}.`,
  ];
}

export function returnChecklist(contact: BookingOperationsContact): string[] {
  return [
    "Remove all cargo, personal items, and trash before arrival.",
    "Sweep the trailer and remove mud, debris, manure, paint, or other residue. A $100 cleaning fee may apply when more than ordinary quick cleanup is required.",
    "Return every supplied ramp, accessory, trailer lock, and key. Documented replacement costs may be deducted from the deposit for missing or damaged items.",
    "Return the trailer by the scheduled time. Do not leave it unattended; wait for the representative's direction and confirmation.",
    "Complete the return inspection and condition photos with the representative.",
    "After inspection, we initiate any clean-return deposit release or refund within 24 hours. Your bank may take additional time to reflect it.",
    `Questions, delays, or extension requests: call or text ${contact.supportPhone}, or email ${contact.supportEmail} before the return time.`,
  ];
}
