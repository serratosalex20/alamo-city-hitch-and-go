import type { RentalDuration } from "@/types/models";
import type { buildRentalSchedule } from "@/lib/booking/schedule";
export type RentalSchedule = ReturnType<typeof buildRentalSchedule>;
export interface PickupRequestInput {
  submissionKey: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  trailerId: string;
  date: string;
  time: string;
  duration: RentalDuration;
  message: string;
}
export type RequestDecision = "approved" | "declined";
export interface RequestNotification {
  kind: "received" | "owner" | "decision";
  status: "pending" | "sending" | "sent" | "failed";
  key: string;
  attempts: number;
  leaseUntil?: number;
  claimId?: string;
  providerId?: string;
  error?: string;
}
export interface PickupRequestRecord
  extends PickupRequestInput,
    RentalSchedule {
  id: string;
  status: "pending" | RequestDecision | "booked";
  createdAtMs: number;
  updatedAtMs: number;
  decision?: { kind: RequestDecision; note: string; actor: string; at: number };
  bookingId?: string;
  notifications: RequestNotification[];
  audit: { action: string; actor: string; at: number }[];
}
