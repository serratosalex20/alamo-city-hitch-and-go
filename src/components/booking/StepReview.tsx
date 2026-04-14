"use client";

import { Icon } from "@/components/ui/Icon";
import { trailers } from "@/lib/data/trailers";
import type { BookingFormData } from "@/app/book/page";

interface Props {
  formData: BookingFormData;
  onBack: () => void;
}

export function StepReview({ formData, onBack }: Props) {
  const trailer = trailers.find((t) => t.id === formData.trailerId);
  if (!trailer) return null;

  const priceKey = `rate${formData.duration}h` as keyof typeof trailer.pricing;
  const rentalPrice = trailer.pricing[priceKey];

  const handleSubmit = () => {
    // TODO: POST to /api/bookings — will wire up with Firestore + Stripe
    alert(
      `Booking submitted!\n\nTrailer: ${trailer.name}\nDate: ${formData.date}\nDuration: ${formData.duration}h\nTotal: $${rentalPrice}\nDeposit Hold: $${trailer.deposit}\n\nThis will connect to Stripe + Firestore once API keys are configured.`
    );
  };

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
              <span className="font-bold">{formData.duration} Hours</span>
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
                Rental Fee ({formData.duration}h)
              </span>
              <span className="font-bold">${rentalPrice}.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">
                Security Deposit{" "}
                <span className="text-[10px]">(hold only — not charged)</span>
              </span>
              <span className="font-bold">${trailer.deposit}.00</span>
            </div>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between text-lg">
              <span className="font-headline font-bold uppercase">
                Total Charged Today
              </span>
              <span className="text-primary font-headline font-bold">
                ${rentalPrice}.00
              </span>
            </div>
          </div>
        </div>
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
          onClick={handleSubmit}
          aria-label="Secure booking — process payment and confirm reservation"
          className="flex-1 min-h-[44px] bg-primary-action text-white py-5 font-headline font-bold uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <Icon name="lock" className="text-sm" />
          Secure Booking
        </button>
      </div>

      <p className="text-center text-[10px] text-on-surface-variant mt-4 uppercase tracking-wider">
        Secure Deposit Authorization &bull; Your card is held, not charged, for
        the ${trailer.deposit} deposit
      </p>
    </div>
  );
}
