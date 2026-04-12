"use client";

import { useState } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { StepTrailer } from "@/components/booking/StepTrailer";
import { StepDateTime } from "@/components/booking/StepDateTime";
import { StepCustomer } from "@/components/booking/StepCustomer";
import { StepReview } from "@/components/booking/StepReview";
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
];

export default function BookPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);

  const updateForm = (updates: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const next = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-24 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-16">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <button
                onClick={() => i < currentStep && setCurrentStep(i)}
                disabled={i > currentStep}
                className={`flex items-center gap-2 px-4 py-2 transition-all ${
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
                  className={`w-8 h-[2px] mx-1 ${
                    i < currentStep ? "bg-primary" : "bg-surface-container-highest"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
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
          <StepReview formData={formData} onBack={back} />
        )}
      </main>
      <Footer />
    </>
  );
}
