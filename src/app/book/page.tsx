"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { StepTrailer } from "@/components/booking/StepTrailer";
import { StepDateTime } from "@/components/booking/StepDateTime";
import { StepCustomer } from "@/components/booking/StepCustomer";
import { StepReview } from "@/components/booking/StepReview";
import { StepPayment } from "@/components/booking/StepPayment";
import { Icon } from "@/components/ui/Icon";
import type { RentalDuration, ReferralSource } from "@/types/models";

export interface BookingFormData {
  trailerId: string;
  trailerSlug: string;
  date: string;
  time: string;
  duration: RentalDuration;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  referralSource: ReferralSource;
  referralDetail: string;
}

const initialFormData: BookingFormData = {
  trailerId: "",
  trailerSlug: "",
  date: "",
  time: "",
  duration: 24,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: { street: "", city: "", state: "TX", zip: "" },
  referralSource: "website",
  referralDetail: "",
};

const steps = [
  { label: "Trailer", icon: "local_shipping" },
  { label: "Schedule", icon: "calendar_today" },
  { label: "Details", icon: "person" },
  { label: "Review", icon: "fact_check" },
  { label: "Payment", icon: "credit_card" },
];

// Step 5 is the post-payment confirmation view; it intentionally lives
// outside the step indicator (no "back" once paid — match retail UX).
const CONFIRMATION_STEP = steps.length;

interface BookingResult {
  rentalIntentId: string;
  depositIntentId: string;
}

export default function BookPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const updateForm = (updates: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const next = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handlePaymentSuccess = (result: BookingResult) => {
    setBookingResult(result);
    setCurrentStep(CONFIRMATION_STEP);
  };

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-28 pb-24 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Step Indicator — hidden on the post-payment confirmation view */}
        {currentStep < CONFIRMATION_STEP && (
          <nav aria-label="Booking progress" className="flex items-center justify-center gap-2 mb-16">
            <ol className="flex items-center gap-2 list-none p-0 m-0">
              {steps.map((step, i) => (
                <li key={step.label} className="flex items-center">
                  <button
                    onClick={() => i < currentStep && setCurrentStep(i)}
                    disabled={i > currentStep}
                    aria-current={i === currentStep ? "step" : undefined}
                    aria-label={`Step ${i + 1}: ${step.label}${i === currentStep ? " (current)" : i < currentStep ? " (completed)" : ""}`}
                    className={`flex items-center gap-2 px-4 py-3 min-h-[44px] min-w-[44px] transition-all ${
                      i === currentStep
                        ? "bg-primary-action text-white"
                        : i < currentStep
                          ? "bg-surface-container-high text-primary cursor-pointer"
                          : "bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Icon name={step.icon} className="text-sm" />
                    <span className="hidden sm:inline font-headline text-xs font-bold uppercase tracking-wider">
                      {step.label}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={`w-8 h-[2px] mx-1 ${
                        i < currentStep ? "bg-primary" : "bg-surface-container-highest"
                      }`}
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Step Content — aria-live announces step changes to screen readers */}
        <div aria-live="polite" aria-atomic="true">
          {currentStep === 0 && (
            <StepTrailer formData={formData} updateForm={updateForm} onNext={next} />
          )}
          {currentStep === 1 && (
            <StepDateTime formData={formData} updateForm={updateForm} onNext={next} onBack={back} />
          )}
          {currentStep === 2 && (
            <StepCustomer formData={formData} updateForm={updateForm} onNext={next} onBack={back} />
          )}
          {currentStep === 3 && (
            <StepReview formData={formData} onBack={back} onContinue={next} />
          )}
          {currentStep === 4 && (
            <StepPayment formData={formData} onBack={back} onSuccess={handlePaymentSuccess} />
          )}
          {currentStep === CONFIRMATION_STEP && bookingResult && (
            <section aria-labelledby="confirm-heading" className="text-center pt-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-action/10 border border-primary-action mb-6">
                <Icon name="check_circle" className="text-primary text-4xl" />
              </div>
              <h2
                id="confirm-heading"
                className="text-4xl md:text-5xl font-headline font-bold tracking-tighter uppercase mb-3"
              >
                Booking Confirmed
              </h2>
              <p className="text-on-surface-variant text-lg font-light mb-8 max-w-md mx-auto leading-relaxed">
                Your trailer is reserved. We sent a sign-in link to{" "}
                <strong className="text-on-surface">{formData.email}</strong>
                {" "}so you can access your dashboard, sign the rental agreement, and
                upload your documents.
              </p>
              <div className="bg-surface-container p-6 max-w-md mx-auto text-left mb-10">
                <div className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                  Confirmation
                </div>
                <div className="font-mono text-sm break-all">
                  {bookingResult.rentalIntentId}
                </div>
              </div>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-3 bg-primary-action text-white px-10 py-4 font-headline font-bold uppercase tracking-widest hover:brightness-110 transition-all min-h-[44px]"
              >
                Open Sign-In Page
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
