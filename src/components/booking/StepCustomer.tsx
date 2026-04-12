"use client";

import type { BookingFormData } from "@/app/book/page";
import type { ReferralSource } from "@/types/models";

interface Props {
  formData: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const referralOptions: { value: ReferralSource; label: string }[] = [
  { value: "business_card", label: "Business Card" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full bg-surface-container-low text-on-surface font-body py-4 px-5 ghost-border focus:border-b-2 focus:border-primary-action outline-none transition-all placeholder:text-on-surface-variant/40";

export function StepCustomer({ formData, updateForm, onNext, onBack }: Props) {
  const showDetailInput =
    formData.referralSource === "referral" ||
    formData.referralSource === "other";

  const isValid =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone &&
    formData.address.street &&
    formData.address.city &&
    formData.address.zip;

  return (
    <div>
      <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase mb-2">
        Your Details
      </h2>
      <p className="text-on-surface-variant mb-10">
        We need a few details to secure your booking.
      </p>

      <div className="space-y-6">
        {/* Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateForm({ firstName: e.target.value })}
              placeholder="John"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateForm({ lastName: e.target.value })}
              placeholder="Doe"
              className={inputClass}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateForm({ email: e.target.value })}
              placeholder="john@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateForm({ phone: e.target.value })}
              placeholder="(210) 555-0123"
              className={inputClass}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Street Address
          </label>
          <input
            type="text"
            value={formData.address.street}
            onChange={(e) =>
              updateForm({
                address: { ...formData.address, street: e.target.value },
              })
            }
            placeholder="123 Main St"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) =>
                updateForm({
                  address: { ...formData.address, city: e.target.value },
                })
              }
              placeholder="San Antonio"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              State
            </label>
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) =>
                updateForm({
                  address: { ...formData.address, state: e.target.value },
                })
              }
              placeholder="TX"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              ZIP
            </label>
            <input
              type="text"
              value={formData.address.zip}
              onChange={(e) =>
                updateForm({
                  address: { ...formData.address, zip: e.target.value },
                })
              }
              placeholder="78201"
              className={inputClass}
            />
          </div>
        </div>

        {/* Referral Source */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            How did you hear about us?
          </label>
          <select
            value={formData.referralSource}
            onChange={(e) =>
              updateForm({
                referralSource: e.target.value as ReferralSource,
                referralDetail: "",
              })
            }
            className={inputClass}
          >
            {referralOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic detail input for Referral / Other */}
        {showDetailInput && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              {formData.referralSource === "referral"
                ? "Who referred you?"
                : "Please specify"}
            </label>
            <input
              type="text"
              value={formData.referralDetail}
              onChange={(e) => updateForm({ referralDetail: e.target.value })}
              placeholder={
                formData.referralSource === "referral"
                  ? "Their name"
                  : "How did you find us?"
              }
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex gap-4 mt-12">
        <button
          onClick={onBack}
          className="flex-1 bg-surface-container-highest text-on-surface py-4 font-headline font-bold uppercase tracking-widest hover:bg-surface-bright transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 bg-primary-action text-white py-4 font-headline font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-800 transition-all active:scale-[0.98]"
        >
          Review Booking
        </button>
      </div>
    </div>
  );
}
