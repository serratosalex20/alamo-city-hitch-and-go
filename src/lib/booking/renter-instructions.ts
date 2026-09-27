import type { BookingStatus } from "@/types/models";

export function instructionState(status: BookingStatus, endTimeMs: number, nowMs: number) {
  return {
    pickup: ["confirmed", "deposit_action_required", "ready_for_pickup"].includes(status),
    returns: status === "active",
    returnDue: status === "active" && Number.isFinite(endTimeMs) && endTimeMs - nowMs <= 24 * 60 * 60 * 1000,
  };
}
