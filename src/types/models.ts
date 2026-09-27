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
   * Sprint 3.4 — pricing keys mirror the `RentalDuration` enum exactly,
   * so `calculatePrice()` can do `trailer.pricing[duration]` with no
   * translation layer. 2-week block is calendar-extended to 15 days
   * (1 free day baked in) per owner decision 2026-05-22.
   */
  pricing: {
    halfDay: number;    // 12 hours
    fullDay: number;    // 24 hours
    oneWeek: number;    // 168 hours
    twoWeeks: number;   // 360 hours (15-day calendar: 14d + 1 free day)
  };
  deposit: number;          // security deposit amount (USD whole dollars)
  badge?: string;           // e.g. "Ready For Pickup", "Coming Soon"
  inventoryCount: number;   // how many physical units of this class
  virtualBoost: number;     // admin can artificially inflate availability
  status: TrailerStatus;
  /**
   * Sprint 3.4 — per-trailer instructional video URL (towing, set-up,
   * safety, rules). Optional because owner is filming progressively.
   * When unset, the `<TrailerVideoPanel>` renders a "Video coming soon"
   * placeholder instead of an embedded player.
   */
  instructionalVideoUrl?: string;
  instructionalVideoPosterUrl?: string;
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
 * Sprint 3.4 — semantic duration keys instead of hour numbers.
 *
 * Old (Sprint 3.3): halfDay | fullDay | threeDays | twoWeeks (3-day block).
 * New (Sprint 3.4): halfDay | fullDay | oneWeek | twoWeeks. The 3-day
 * block was retired in favor of a 1-week block per owner direction; the
 * 2-week block is now calendar-extended to 15 days (1 free day baked in).
 *
 * Why semantic keys:
 *   - "twoWeeks" reads better than "336" in code and UI
 *   - Decouples brand language ("Full Day") from operational math
 *   - Avoids debates about whether "24" means midnight-midnight or 24 elapsed
 *
 * For the math, see DURATION_HOURS in src/lib/booking/pricing.ts.
 */
export type RentalDuration = "halfDay" | "fullDay" | "oneWeek" | "twoWeeks";

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
