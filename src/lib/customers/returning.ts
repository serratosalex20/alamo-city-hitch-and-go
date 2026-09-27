import type { BookingFormData } from "@/components/booking/BookingWizard";
import type { Booking, BookingStatus } from "@/types/models";
import type { CustomerProfile } from "./profile";

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
export function paidBookings(email: string, bookings: Booking[]) {
  return bookings.filter(b => normalize(b.customerEmail) === normalize(email) && b.paymentStatus === "succeeded" && b.status !== "cancelled")
    .sort((a, b) => b.createdAtMs - a.createdAtMs);
}
export function returningDetails(email: string, profile: CustomerProfile | null, bookings: Booking[]) {
  const prior = paidBookings(email, bookings)[0];
  const useProfile = profile && (!prior || Date.parse(profile.updatedAt) >= prior.createdAtMs);
  const names = profile?.name.trim().split(/\s+/);
  const savedDetails: Partial<BookingFormData> = {
    email,
    ...(prior ? { firstName: prior.customer.firstName, lastName: prior.customer.lastName, phone: prior.customer.phone, address: prior.customer.address,
      ...(prior.towVehicle ? { towVehicle: { ...prior.towVehicle, plate: prior.towVehicle.plate ?? "" } } : {}),
      referralSource: "previous_customer", referralDetail: "" } : {}),
    ...(useProfile ? { firstName: names![0], lastName: names!.slice(1).join(" "), phone: profile!.phone } : {}),
    emailMarketingOptIn: profile?.emailMarketing ?? false,
  };
  return { savedDetails, returningCustomer: !!prior };
}
export function sameRenter(a: Booking, b: Booking) {
  return normalize(a.customerEmail) === normalize(b.customerEmail) &&
    normalize(a.customer.firstName) === normalize(b.customer.firstName) && normalize(a.customer.lastName) === normalize(b.customer.lastName);
}
export function validThrough(expiration: string | undefined, returnDate: string) {
  if (!expiration || !/^\d{4}-\d{2}-\d{2}$/.test(expiration)) return false;
  const date = new Date(`${expiration}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === expiration && expiration >= returnDate;
}
export function reusableInsurance(source: Booking, target: Booking, returnDate: string) {
  return sameRenter(source, target) && source.insuranceStatus === "approved" && !!source.insuranceStoragePath &&
    validThrough(source.insuranceExpiresAt, returnDate) && !!source.towVehicle && !!target.towVehicle &&
    (["year", "make", "model", "plate"] as const).every(key => normalize(source.towVehicle![key] ?? "") === normalize(target.towVehicle![key] ?? ""));
}
export function nextDocumentStatus(booking: Pick<Booking, "identityStatus" | "insuranceStatus" | "agreementStatus" | "insurancePolicyNumber">): BookingStatus {
  if (booking.identityStatus !== "verified") return "pending_identity";
  if (!["uploaded", "approved"].includes(booking.insuranceStatus)) return "pending_insurance";
  // Existing signed agreements predate collection of policy numbers in the portal.
  if (booking.agreementStatus === "signed") return "under_review";
  if (!booking.insurancePolicyNumber?.trim()) return "pending_insurance";
  return "pending_signature";
}
