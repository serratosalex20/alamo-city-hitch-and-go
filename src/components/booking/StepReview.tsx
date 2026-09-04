"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { trailers } from "@/lib/data/trailers";
import { calculatePrice, DURATION_LABELS, formatUsd } from "@/lib/booking/pricing";
import type { BookingFormData } from "@/app/book/page";

interface Props {
  formData: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function StepReview({ formData, updateForm, onBack, onContinue }: Props) {
  const trailer = trailers.find((t) => t.id === formData.trailerId);
  if (!trailer) return null;

  // Sprint 3.3 — direct lookup: pricing keys mirror RentalDuration values.
  const rentalPrice = trailer.pricing[formData.duration];
  const quote = calculatePrice(formData.trailerId, formData.duration);
  const durationLabel = DURATION_LABELS[formData.duration];

  return (
    <div>
      <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase mb-2">
        Review &amp; Confirm
      </h2>
      <p className="text-on-surface-variant mb-10">
        Double-check your details before we process your booking.
      </p>

      <div className="space-y-6">
        {/* Trailer */}
        <div className="bg-surface-container p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="local_shipping" className="text-primary text-xl" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Trailer
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-headline font-bold text-lg uppercase">
              {trailer.name}
            </span>
            <span className="text-primary font-headline font-bold">
              ${rentalPrice}
            </span>
          </div>
          <p className="text-on-surface-variant text-xs">
            {trailer.specs.gvwr.toLocaleString()} LBS GVWR &bull;{" "}
            {trailer.specs.hitchSize}
          </p>
        </div>

        <div className="bg-surface-container p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="directions_car" className="text-primary text-xl" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Tow Vehicle
            </span>
          </div>
          <p className="font-bold">
            {formData.towVehicle.year} {formData.towVehicle.make} {formData.towVehicle.model}
          </p>
          {formData.towVehicle.plate && (
            <p className="text-on-surface-variant text-sm">Plate: {formData.towVehicle.plate}</p>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-surface-container p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="calendar_today" className="text-primary text-xl" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Schedule
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant">
                Date
              </span>
              <span className="font-bold">{formData.date}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant">
                Time
              </span>
              <span className="font-bold">{formData.time}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant">
                Duration
              </span>
              <span className="font-bold">{durationLabel}</span>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="bg-surface-container p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="person" className="text-primary text-xl" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Customer
            </span>
          </div>
          <p className="font-bold">
            {formData.firstName} {formData.lastName}
          </p>
          <p className="text-on-surface-variant text-sm">{formData.email}</p>
          <p className="text-on-surface-variant text-sm">{formData.phone}</p>
          <p className="text-on-surface-variant text-sm">
            {formData.address.street}, {formData.address.city},{" "}
            {formData.address.state} {formData.address.zip}
          </p>
        </div>

        {/* Pricing Summary */}
        <div className="bg-surface-container-high p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="receipt_long" className="text-primary text-xl" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Payment Summary
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">
                Rental Fee ({durationLabel})
              </span>
              <span className="font-bold">{formatUsd(quote.rentalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Texas Sales Tax</span>
              <span className="font-bold">{formatUsd(quote.taxCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">
                Security Deposit{" "}
                <span className="text-[10px]">(authorized near pickup)</span>
              </span>
              <span className="font-bold">{formatUsd(quote.depositCents)}</span>
            </div>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between text-lg">
              <span className="font-headline font-bold uppercase">
                Total Charged Today
              </span>
              <span className="text-primary font-headline font-bold">
                {formatUsd(quote.totalCents)}
              </span>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 bg-surface-container-low p-5 cursor-pointer ghost-border">
          <input
            type="checkbox"
            checked={formData.policiesAccepted}
            onChange={(event) => updateForm({ policiesAccepted: event.target.checked })}
            className="mt-1 h-5 w-5 accent-primary-action"
          />
          <span className="text-sm leading-relaxed text-on-surface-variant">
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="text-primary underline">
              key rental terms
            </Link>
            , cancellation policy, cleaning and damage charges, and the $200 security-deposit process. I understand the full rental agreement is signed after payment.
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-12">
        <button
          onClick={onBack}
          className="flex-1 min-h-[44px] bg-surface-container-highest text-on-surface py-4 font-headline font-bold uppercase tracking-widest hover:bg-surface-bright transition-all"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!formData.policiesAccepted}
          aria-label="Continue to payment"
          className="flex-1 min-h-[44px] bg-primary-action text-white py-5 font-headline font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3"
        >
          Continue to Payment
          <Icon name="arrow_forward" className="text-sm" />
        </button>
      </div>

      <p className="text-center text-[10px] text-on-surface-variant mt-4 uppercase tracking-wider">
        Your rental and tax are charged today. The ${trailer.deposit} security deposit is handled near pickup.
      </p>
    </div>
  );
}
