import { getFirestoreAdmin } from "@/lib/firebase/admin";
import { hasFirebase, isDemoEnvironment } from "@/lib/env";
import { hasConflict, MIN_BUFFER_MIN } from "@/lib/booking/availability";
import type { Booking, BookingAuditEvent } from "@/types/models";

const COLLECTION = "bookings";
const ACTIVE_CONFLICT_STATUSES = new Set<Booking["status"]>([
  "pending_payment",
  "pending_signature",
  "pending_identity",
  "pending_insurance",
  "under_review",
  "confirmed",
  "deposit_action_required",
  "ready_for_pickup",
  "active",
  "return_inspection",
]);

type DemoGlobal = typeof globalThis & {
  __acgDemoBookings?: Map<string, Booking>;
};

function demoBookings(): Map<string, Booking> {
  const root = globalThis as DemoGlobal;
  root.__acgDemoBookings ??= new Map<string, Booking>();
  return root.__acgDemoBookings;
}

export class BookingConflictError extends Error {}
export class BookingPersistenceError extends Error {}

export function isPersistenceReady(): boolean {
  return hasFirebase || isDemoEnvironment;
}

export function currentlyBlocksInventory(booking: Booking, nowMs: number): boolean {
  if (!ACTIVE_CONFLICT_STATUSES.has(booking.status)) return false;
  if (booking.status === "pending_payment" && booking.checkoutExpiresAtMs <= nowMs) {
    return false;
  }
  return true;
}

export async function checkBookingAvailability(
  trailerId: string,
  startTimeMs: number,
  endTimeMs: number,
  capacity: number,
): Promise<boolean> {
  const bookings = await listAllBookings();
  const nowMs = Date.now();
  const overlapping = bookings.filter(
    (booking) =>
      booking.trailerId === trailerId &&
      currentlyBlocksInventory(booking, nowMs) &&
      hasConflict(
        { startMs: startTimeMs, endMs: endTimeMs },
        [{ startMs: booking.startTimeMs, endMs: booking.endTimeMs }],
        MIN_BUFFER_MIN,
      ),
  );
  return overlapping.length < capacity;
}

function assertNoConflict(candidate: Booking, existing: Booking[], capacity: number) {
  const nowMs = Date.now();
  const overlapping = existing.filter(
    (booking) =>
      booking.id !== candidate.id &&
      booking.trailerId === candidate.trailerId &&
      currentlyBlocksInventory(booking, nowMs) &&
      hasConflict(
        { startMs: candidate.startTimeMs, endMs: candidate.endTimeMs },
        [{ startMs: booking.startTimeMs, endMs: booking.endTimeMs }],
        MIN_BUFFER_MIN,
      ),
  );
  if (overlapping.length >= capacity) {
    throw new BookingConflictError(
      "That trailer was just booked for the selected time. Choose another schedule.",
    );
  }
}

export async function createBookingHold(
  booking: Booking,
  capacity: number,
): Promise<Booking> {
  if (!hasFirebase) {
    if (!isDemoEnvironment) {
      throw new BookingPersistenceError("Booking storage is not configured.");
    }
    const store = demoBookings();
    const existing = store.get(booking.id);
    if (existing) return existing;
    assertNoConflict(booking, Array.from(store.values()), capacity);
    store.set(booking.id, structuredClone(booking));
    return booking;
  }

  const db = getFirestoreAdmin();
  if (!db) throw new BookingPersistenceError("Booking storage failed to initialize.");
  const ref = db.collection(COLLECTION).doc(booking.id);

  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) return existing.data() as Booking;

    const sameTrailer = await transaction.get(
      db.collection(COLLECTION).where("trailerId", "==", booking.trailerId),
    );
    assertNoConflict(
      booking,
      sameTrailer.docs.map((doc) => doc.data() as Booking),
      capacity,
    );
    transaction.create(ref, booking);
    return booking;
  });
}

export async function getBooking(id: string): Promise<Booking | null> {
  if (!hasFirebase) {
    return isDemoEnvironment ? structuredClone(demoBookings().get(id) ?? null) : null;
  }
  const db = getFirestoreAdmin();
  if (!db) return null;
  const snapshot = await db.collection(COLLECTION).doc(id).get();
  return snapshot.exists ? (snapshot.data() as Booking) : null;
}

export async function listBookingsForEmail(email: string): Promise<Booking[]> {
  const normalized = email.trim().toLowerCase();
  let bookings: Booking[];
  if (!hasFirebase) {
    bookings = isDemoEnvironment ? Array.from(demoBookings().values()) : [];
  } else {
    const db = getFirestoreAdmin();
    if (!db) return [];
    const snapshot = await db.collection(COLLECTION).where("customerEmail", "==", normalized).get();
    bookings = snapshot.docs.map((doc) => doc.data() as Booking);
  }
  return bookings
    .filter((booking) => booking.customerEmail === normalized)
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .map((booking) => structuredClone(booking));
}

export async function listAllBookings(): Promise<Booking[]> {
  let bookings: Booking[];
  if (!hasFirebase) {
    bookings = isDemoEnvironment ? Array.from(demoBookings().values()) : [];
  } else {
    const db = getFirestoreAdmin();
    if (!db) return [];
    const snapshot = await db.collection(COLLECTION).get();
    bookings = snapshot.docs.map((doc) => doc.data() as Booking);
  }
  return bookings
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .map((booking) => structuredClone(booking));
}

export async function updateBooking(
  id: string,
  updates: Partial<Booking>,
  event?: Omit<BookingAuditEvent, "createdAt" | "createdAtMs">,
): Promise<Booking> {
  const now = new Date();
  const auditEvent: BookingAuditEvent | undefined = event
    ? { ...event, createdAt: now.toISOString(), createdAtMs: now.getTime() }
    : undefined;

  if (!hasFirebase) {
    if (!isDemoEnvironment) throw new BookingPersistenceError("Booking storage is not configured.");
    const store = demoBookings();
    const current = store.get(id);
    if (!current) throw new Error("Booking not found.");
    const next: Booking = {
      ...current,
      ...updates,
      auditTrail: auditEvent ? [...current.auditTrail, auditEvent] : current.auditTrail,
      updatedAt: now.toISOString(),
      updatedAtMs: now.getTime(),
    };
    store.set(id, structuredClone(next));
    return next;
  }

  const db = getFirestoreAdmin();
  if (!db) throw new BookingPersistenceError("Booking storage failed to initialize.");
  const ref = db.collection(COLLECTION).doc(id);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error("Booking not found.");
    const current = snapshot.data() as Booking;
    const next: Booking = {
      ...current,
      ...updates,
      auditTrail: auditEvent ? [...current.auditTrail, auditEvent] : current.auditTrail,
      updatedAt: now.toISOString(),
      updatedAtMs: now.getTime(),
    };
    transaction.set(ref, next);
    return next;
  });
}

export async function findBookingByPaymentIntent(paymentIntentId: string): Promise<Booking | null> {
  if (!hasFirebase) {
    const found = isDemoEnvironment
      ? Array.from(demoBookings().values()).find(
          (booking) =>
            booking.rentalPaymentIntentId === paymentIntentId ||
            booking.depositPaymentIntentId === paymentIntentId,
        )
      : undefined;
    return found ? structuredClone(found) : null;
  }
  const db = getFirestoreAdmin();
  if (!db) return null;
  for (const field of ["rentalPaymentIntentId", "depositPaymentIntentId"] as const) {
    const snapshot = await db.collection(COLLECTION).where(field, "==", paymentIntentId).limit(1).get();
    if (!snapshot.empty) return snapshot.docs[0].data() as Booking;
  }
  return null;
}
