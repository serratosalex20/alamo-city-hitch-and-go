import { getFirestoreAdmin } from "@/lib/firebase/admin";
import { bookingCollection, hasFirebase, isDemoEnvironment } from "@/lib/env";
import { hasConflict, MIN_BUFFER_MIN } from "@/lib/booking/availability";
import type { Booking, BookingAuditEvent } from "@/types/models";

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

function sameCheckoutDetails(left: Booking, right: Booking): boolean {
  return (
    left.checkoutKey === right.checkoutKey &&
    left.customerEmail === right.customerEmail &&
    JSON.stringify(left.customer) === JSON.stringify(right.customer) &&
    JSON.stringify(left.towVehicle) === JSON.stringify(right.towVehicle) &&
    left.trailerId === right.trailerId &&
    left.duration === right.duration &&
    left.startTimeMs === right.startTimeMs &&
    left.endTimeMs === right.endTimeMs &&
    left.rentalSubtotal === right.rentalSubtotal &&
    left.taxAmount === right.taxAmount &&
    left.rentalTotal === right.rentalTotal &&
    Boolean(left.depositCollectedAtCheckout) === Boolean(right.depositCollectedAtCheckout) &&
    left.depositAmount === right.depositAmount
  );
}

function assertIdempotentCheckout(existing: Booking, candidate: Booking) {
  if (!sameCheckoutDetails(existing, candidate)) {
    throw new BookingConflictError(
      "Checkout details changed after the time was secured. Return to review and restart payment.",
    );
  }
}

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
    if (existing) {
      if (existing.status === "cancelled" && existing.paymentStatus !== "succeeded") {
        assertNoConflict(booking, Array.from(store.values()), capacity);
        store.set(booking.id, structuredClone(booking));
        return booking;
      }
      assertIdempotentCheckout(existing, booking);
      return existing;
    }
    assertNoConflict(booking, Array.from(store.values()), capacity);
    store.set(booking.id, structuredClone(booking));
    return booking;
  }

  const db = getFirestoreAdmin();
  if (!db) throw new BookingPersistenceError("Booking storage failed to initialize.");
  const ref = db.collection(bookingCollection).doc(booking.id);

  return db.runTransaction(async (transaction) => {
    const existingSnapshot = await transaction.get(ref);
    if (existingSnapshot.exists) {
      const existing = existingSnapshot.data() as Booking;
      if (existing.status !== "cancelled" || existing.paymentStatus === "succeeded") {
        assertIdempotentCheckout(existing, booking);
        return existing;
      }

      const sameTrailer = await transaction.get(
        db.collection(bookingCollection).where("trailerId", "==", booking.trailerId),
      );
      assertNoConflict(
        booking,
        sameTrailer.docs.map((doc) => doc.data() as Booking),
        capacity,
      );
      transaction.set(ref, booking);
      return booking;
    }

    const sameTrailer = await transaction.get(
      db.collection(bookingCollection).where("trailerId", "==", booking.trailerId),
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

export async function completeRentalPaymentRecord({
  bookingId,
  paymentIntentId,
  capacity,
  updates,
}: {
  bookingId: string;
  paymentIntentId: string;
  capacity: number;
  updates: Partial<Booking>;
}): Promise<Booking> {
  const now = new Date();

  const complete = (current: Booking, allBookings: Booking[]) => {
    if (current.rentalPaymentIntentId !== paymentIntentId) {
      throw new Error("Payment does not match this booking.");
    }
    if (current.paymentStatus === "succeeded") return current;
    if (current.paymentStatus === "refunded" || current.status === "cancelled") {
      throw new BookingConflictError("This checkout is no longer active.");
    }
    if (current.checkoutExpiresAtMs <= now.getTime()) {
      throw new BookingConflictError(
        "The 15-minute checkout hold expired before payment completed.",
      );
    }
    assertNoConflict(current, allBookings, capacity);
    const auditEvent: BookingAuditEvent = {
      action: "rental_payment_succeeded",
      actor: "stripe",
      createdAt: now.toISOString(),
      createdAtMs: now.getTime(),
    };
    return {
      ...current,
      ...updates,
      auditTrail: [...current.auditTrail, auditEvent],
      updatedAt: now.toISOString(),
      updatedAtMs: now.getTime(),
    };
  };

  if (!hasFirebase) {
    if (!isDemoEnvironment) throw new BookingPersistenceError("Booking storage is not configured.");
    const store = demoBookings();
    const current = store.get(bookingId);
    if (!current) throw new Error("Booking not found.");
    const next = complete(current, Array.from(store.values()));
    store.set(bookingId, structuredClone(next));
    return structuredClone(next);
  }

  const db = getFirestoreAdmin();
  if (!db) throw new BookingPersistenceError("Booking storage failed to initialize.");
  const ref = db.collection(bookingCollection).doc(bookingId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error("Booking not found.");
    const current = snapshot.data() as Booking;
    if (current.paymentStatus === "succeeded") return current;
    const sameTrailer = await transaction.get(
      db.collection(bookingCollection).where("trailerId", "==", current.trailerId),
    );
    const next = complete(
      current,
      sameTrailer.docs.map((doc) => doc.data() as Booking),
    );
    transaction.set(ref, next);
    return next;
  });
}

export async function getBooking(id: string): Promise<Booking | null> {
  if (!hasFirebase) {
    return isDemoEnvironment ? structuredClone(demoBookings().get(id) ?? null) : null;
  }
  const db = getFirestoreAdmin();
  if (!db) return null;
  const snapshot = await db.collection(bookingCollection).doc(id).get();
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
    const snapshot = await db.collection(bookingCollection).where("customerEmail", "==", normalized).get();
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
    const snapshot = await db.collection(bookingCollection).get();
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
  canUpdate?: (current: Booking) => boolean,
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
    if (canUpdate && !canUpdate(current)) return structuredClone(current);
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
  const ref = db.collection(bookingCollection).doc(id);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error("Booking not found.");
    const current = snapshot.data() as Booking;
    if (canUpdate && !canUpdate(current)) return current;
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
    const snapshot = await db.collection(bookingCollection).where(field, "==", paymentIntentId).limit(1).get();
    if (!snapshot.empty) return snapshot.docs[0].data() as Booking;
  }
  return null;
}
