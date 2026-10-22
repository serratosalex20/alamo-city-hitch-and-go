"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { revealBookingTarget } from "@/lib/booking/viewport";
import { Icon } from "@/components/ui/Icon";
// Sprint 3.3 — use bookableTrailers so "coming_soon" units don't appear
// as selectable options. The /fleet page still shows them with a
// "Coming Soon" badge so customers know what's next in the inventory.
import { bookableTrailers } from "@/lib/data/trailers";
import type { BookingFormData } from "@/app/book/page";

interface Props {
  formData: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
}

export function StepTrailer({ formData, updateForm, onNext }: Props) {
  const continueRef = useRef<HTMLButtonElement>(null);
  const [manualSelection, setManualSelection] = useState(0);

  useLayoutEffect(() => {
    if (manualSelection) revealBookingTarget(continueRef.current);
  }, [manualSelection]);

  const selectTrailer = (id: string, slug: string) => {
    updateForm({ trailerId: id, trailerSlug: slug });
    setManualSelection((count) => count + 1);
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
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
        role="radiogroup"
        aria-label="Select a trailer"
      >
        {bookableTrailers.map((trailer) => (
          <button
            type="button"
            key={trailer.id}
            onClick={() => selectTrailer(trailer.id, trailer.slug)}
            tabIndex={formData.trailerId ? (formData.trailerId === trailer.id ? 0 : -1) : (trailer === bookableTrailers[0] ? 0 : -1)}
            onKeyDown={(event) => {
              const index = bookableTrailers.indexOf(trailer);
              const offset = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1
                : ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 0;
              if (!offset && event.key !== "Home" && event.key !== "End") return;
              event.preventDefault();
              const nextIndex = event.key === "Home" ? 0
                : event.key === "End" ? bookableTrailers.length - 1
                : (index + offset + bookableTrailers.length) % bookableTrailers.length;
              const nextTrailer = bookableTrailers[nextIndex];
              const radios = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
              radios?.[nextIndex]?.focus({ preventScroll: true });
              selectTrailer(nextTrailer.id, nextTrailer.slug);
            }}
            role="radio"
            aria-checked={formData.trailerId === trailer.id}
            aria-label={`${trailer.name} — $${trailer.pricing.fullDay} per day, ${trailer.specs.gvwr.toLocaleString()} LBS GVWR`}
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
                  ${trailer.pricing.fullDay}/day
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
        ref={continueRef}
        type="button"
        onClick={onNext}
        disabled={!formData.trailerId}
        className="w-full scroll-mt-24 scroll-mb-4 min-h-[44px] bg-primary-action text-white py-4 font-headline font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-[0.98]"
      >
        Continue to Schedule
      </button>
    </div>
  );
}
