/**
 * Firestore Data Models — Alamo City Hitch & Go Co.
 *
 * Each interface maps 1:1 to a Firestore document.
 * Foreign keys to Stripe/DocuSign are stored as nullable strings
 * so the booking flow works with or without live API keys.
 */

// ─── Trailer ────────────────────────────────────────────

export type TrailerType = "utility" | "car_hauler" | "enclosed" | "dump" | "flatbed" | "gooseneck";
export type TrailerStatus = "available" | "rented" | "maintenance";

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
  pricing: {
    rate4h: number;
    rate12h: number;
    rate24h: number;
    rate36h: number;
  };
  deposit: number;          // security deposit amount
  badge?: string;           // e.g. "Ready For Pickup", "Commercial Grade"
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

export type RentalDuration = 4 | 12 | 24 | 36;

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
