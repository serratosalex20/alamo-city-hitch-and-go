/**
 * Firestore Data Models — Alamo City Hitch & Go Co.
 *
 * Each interface maps 1:1 to a Firestore document.
 * Foreign keys to Stripe/DocuSign are stored as nullable strings
 * so the booking flow works with or without live API keys.
 */

// ─── Trailer ────────────────────────────────────────────

export type TrailerType = "utility" | "car_hauler" | "enclosed" | "dump" | "flatbed" | "gooseneck";

/**
 * Trailer lifecycle status.
 *   - available  : in inventory, bookable
 *   - rented     : currently on an active rental
 *   - maintenance: out of service for repairs/inspection
 *   - coming_soon: announced to the market but not yet bookable
 *                  (Sprint 3.3 added — rendered on the fleet page with
 *                   a "Coming Soon" badge, filtered from booking flow.)
 */
export type TrailerStatus = "available" | "rented" | "maintenance" | "coming_soon";

export interface Trailer {
  id: string;
  name: string;
  type: TrailerType;
  slug: string;
  description: string;
  imageUrl: string;
  images: string[]; // front-quarter, rear-quarter, interior/deck
  specs: {
    gvwr: number;        // lbs
    payload: number;     // lbs
    hitchSize: string;   // e.g. "2\" Ball Coupler"
    widthInches: number;
    lengthFeet: number;
    heightInches?: number; // enclosed only
  };
  /**
   * Sprint 3.3 — pricing keys mirror the `RentalDuration` enum
   * exactly, so `calculatePrice()` can do `trailer.pricing[duration]`
   * with no translation layer.
   */
  pricing: {
    halfDay: number;    // 12 hours
    fullDay: number;    // 24 hours
    threeDays: number;  // 72 hours
    twoWeeks: number;   // 336 hours
  };
  deposit: number;          // security deposit amount (USD whole dollars)
  badge?: string;           // e.g. "Ready For Pickup", "Coming Soon"
  inventoryCount: number;   // how many physical units of this class
  virtualBoost: number;     // admin can artificially inflate availability
  status: TrailerStatus;
  createdAt: string;        // ISO date
  updatedAt: string;
}

// ─── User ───────────────────────────────────────────────

export type UserRole = "customer" | "admin";
export type ReferralSource =
  | "business_card"
  | "referral"
  | "website"
  | "facebook"
  | "instagram"
  | "other";

export interface User {
  id: string;               // Firebase Auth UID
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  role: UserRole;
  referralSource: ReferralSource;
  referralDetail?: string;  // name (if referral) or text (if other)
  stripeCustomerId?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt: string;
  updatedAt: string;
}

// ─── Booking ────────────────────────────────────────────

export type BookingStatus =
  | "pending_payment"
  | "pending_signature"
  | "pending_verification"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled";

/**
 * Sprint 3.3 — semantic duration keys instead of hour numbers.
 *
 * Old: 4 | 12 | 24 | 36 (hour-number union).
 * New: semantic string keys that mirror Trailer.pricing field names exactly.
 *
 * Why semantic keys:
 *   - "two_weeks" reads better than "336" in code and UI
 *   - Decouples brand language ("Full Day") from operational math
 *   - Avoids debates about whether "24" means midnight-midnight or 24 elapsed
 *
 * For the math, see DURATION_HOURS in src/lib/booking/pricing.ts.
 */
export type RentalDuration = "halfDay" | "fullDay" | "threeDays" | "twoWeeks";

export interface Booking {
  id: string;
  userId: string;
  trailerId: string;
  trailerName: string;       // denormalized for dashboard display
  unitId: string;            // e.g. "#TX-48092-B"
  status: BookingStatus;
  duration: RentalDuration;
  startTime: string;         // ISO datetime
  endTime: string;           // ISO datetime (recalculated on extensions)
  extensions: Extension[];
  rentalTotal: number;       // cents
  depositAmount: number;     // cents
  // Stripe
  rentalPaymentIntentId?: string;
  depositPaymentIntentId?: string;  // auth & capture (manual capture)
  depositCaptured: boolean;
  depositReleased: boolean;
  // DocuSign
  docusignEnvelopeId?: string;
  agreementSigned: boolean;
  agreementSignedAt?: string;
  // AI Verification
  idDocumentUrl?: string;
  addressDocumentUrl?: string;
  idVerified: boolean;
  addressVerified: boolean;
  nameMatchScore?: number;
  // Admin
  preInspectionPhotos: string[];
  postInspectionPhotos: string[];
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Extension ──────────────────────────────────────────

export interface Extension {
  id: string;
  bookingId: string;
  hoursAdded: 4;             // always 4-hour blocks
  chargeAmount: number;      // cents
  paymentIntentId?: string;
  createdAt: string;
}

// ─── Transaction ────────────────────────────────────────

export type TransactionType =
  | "rental_charge"
  | "deposit_hold"
  | "deposit_capture"
  | "deposit_release"
  | "extension_charge"
  | "refund";

export interface Transaction {
  id: string;
  bookingId: string;
  userId: string;
  type: TransactionType;
  amount: number;            // cents
  stripePaymentIntentId?: string;
  status: "pending" | "succeeded" | "failed" | "cancelled";
  createdAt: string;
}

// ─── Document ───────────────────────────────────────────

export type DocumentType =
  | "rental_agreement"
  | "rules_guidelines"
  | "drivers_license"
  | "proof_of_address"
  | "pre_inspection"
  | "post_inspection";

export interface StoredDocument {
  id: string;
  bookingId: string;
  userId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
}

// ─── Calendar Block (admin maintenance blocks) ─────────

export interface CalendarBlock {
  id: string;
  trailerId: string;
  reason: string;            // e.g. "Tire replacement", "Annual inspection"
  startDate: string;         // ISO date
  endDate: string;
  createdBy: string;         // admin userId
  createdAt: string;
}
