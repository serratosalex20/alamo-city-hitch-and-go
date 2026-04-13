"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { trailers } from "@/lib/data/trailers";
import type { BookingFormData } from "@/app/book/page";

interface Props {
  formData: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
}

export function StepTrailer({ formData, updateForm, onNext }: Props) {
  const selectTrailer = (id: string, slug: string) => {
    updateForm({ trailerId: id, trailerSlug: slug });
  };

  return (
    <div>
      <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase mb-2">
        Select Your Trailer
      </h2>
      <p className="text-on-surface-variant mb-10">
        Choose the rig that fits your cargo requirements.
      </p>

      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        role="radiogroup"
        aria-label="Select a trailer"
      >
        {trailers.map((trailer) => (
          <button
            key={trailer.id}
            onClick={() => selectTrailer(trailer.id, trailer.slug)}
            role="radio"
            aria-checked={formData.trailerId === trailer.id}
            aria-label={`${trailer.name} — $${trailer.pricing.rate24h} per day, ${trailer.specs.gvwr.toLocaleString()} LBS GVWR`}
            className={`text-left flex flex-col bg-surface-container-low border transition-all duration-300 min-h-[44px] ${
              formData.trailerId === trailer.id
                ? "border-primary ring-2 ring-primary/20"
                : "border-white/5 hover:border-white/20"
            }`}
          >
            <div className="aspect-[4/3] overflow-hidden bg-surface-container relative">
              <Image
                src={trailer.imageUrl}
                alt={`${trailer.name} — available for rental`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-headline font-bold uppercase text-sm tracking-tight">
                  {trailer.name}
                </h3>
                <span className="text-primary font-headline font-bold text-sm">
                  ${trailer.pricing.rate24h}/day
                </span>
              </div>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                {trailer.specs.gvwr.toLocaleString()} LBS GVWR &bull;{" "}
                {trailer.specs.hitchSize}
              </p>
              {formData.trailerId === trailer.id && (
                <div className="mt-3 flex items-center gap-2 text-primary text-xs font-bold" aria-hidden="true">
                  <Icon name="check_circle" filled className="text-sm" />
                  SELECTED
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!formData.trailerId}
        className="w-full min-h-[44px] bg-primary-action text-white py-4 font-headline font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-800 transition-all active:scale-[0.98]"
      >
        Continue to Schedule
      </button>
    </div>
  );
}
